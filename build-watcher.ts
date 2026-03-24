import {
  existsSync,
  readdirSync,
  watch,
  type FSWatcher,
  type WatchEventType,
  type WatchListener,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { color as bColor, spawn, spawnSync, type Subprocess } from "bun";

import pkg from "./package.json";

export type OperatingSystemCode = "windows" | "darwin" | "linux";
export type ArchCode = "x64" | "arm64";

type RuntimeTarget = {
  platform: OperatingSystemCode;
  arch: ArchCode;
  binaryPath: string;
  buildScript: string;
};

type BuildPlan = {
  filePath: string | null;
  label: string;
  needsStyleBuild: boolean;
  skip: boolean;
};

type BuildStepResult = {
  success: boolean;
  resourceUsage: {
    maxRSS: number;
    cpuTime: {
      user: number;
      system: number;
    };
  } | null;
};

const SOURCE_WATCH_ROOT = "./src";
const STATIC_WATCH_PATHS = [
  "./build-watcher.ts",
  "./tailwind.config.js",
] as const;
const GENERATED_FILES = new Set(["src/index.css"]);
const STYLE_RELEVANT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".tsx",
]);
const STYLE_RELEVANT_FILES = new Set([
  "build-watcher.ts",
  "tailwind.config.js",
]);
const BUILD_SCRIPT_BY_TARGET: Record<
  OperatingSystemCode,
  Record<ArchCode, string>
> = {
  windows: {
    x64: "subbuild:bin:windows",
    arm64: "subbuild:bin:windows-arm",
  },
  darwin: {
    x64: "subbuild:bin:darwin",
    arm64: "subbuild:bin:darwin-arm",
  },
  linux: {
    x64: "subbuild:bin:linux",
    arm64: "subbuild:bin:linux-arm",
  },
};

let proc = null as Subprocess | null;
let current = Promise.resolve();
let shuttingDown = false;
let shutdownPromise = null as Promise<void> | null;

const ansiColor = (color: string): string => bColor(color, "ansi") as string;
const closeWatcher = (watcher: FSWatcher) => {
  try {
    watcher.close();
  } catch {
    // Watchers may already be closed during repeated shutdown paths.
  }
};

const formatWatchedPath = (
  watchPath: string,
  filename: string | null,
): string | null => {
  if (!filename) {
    return watchPath.replace(/^\.\//, "");
  }

  if (path.extname(watchPath)) {
    return watchPath.replace(/^\.\//, "");
  }

  return path
    .join(watchPath, filename)
    .replace(/^\.\//, "")
    .split(path.sep)
    .join("/");
};

const collectRecursiveWatchPaths = (root: string) => {
  if (!existsSync(root)) {
    return [] as string[];
  }

  const queue = [root];
  const watchPaths = [] as string[];

  while (queue.length) {
    const currentPath = queue.shift();

    if (!currentPath) {
      continue;
    }

    watchPaths.push(currentPath);

    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        queue.push(path.join(currentPath, entry.name));
      }
    }
  }

  return watchPaths;
};

const resolvePlatform = (): OperatingSystemCode | null => {
  const platform = os.platform();

  if (platform.startsWith("win")) return "windows";
  if (platform.startsWith("darwin")) return "darwin";
  if (platform.startsWith("linux")) return "linux";

  return null;
};

const resolveArch = (): ArchCode | null => {
  const arch = os.arch();

  if (arch.startsWith("x64")) return "x64";
  if (arch.startsWith("arm")) return "arm64";

  return null;
};

const getRuntimeTarget = (): RuntimeTarget | null => {
  const platform = resolvePlatform();
  const arch = resolveArch();

  if (!platform || !arch) {
    return null;
  }

  return {
    platform,
    arch,
    binaryPath: `./bin/${platform}-${arch}/${pkg.name}`,
    buildScript: BUILD_SCRIPT_BY_TARGET[platform][arch],
  };
};

const createBuildPlan = (filePath: string | null): BuildPlan => {
  if (!filePath) {
    return {
      filePath,
      label: "Initial build",
      needsStyleBuild: true,
      skip: false,
    };
  }

  if (GENERATED_FILES.has(filePath)) {
    return {
      filePath,
      label: `Ignoring generated file ${filePath}`,
      needsStyleBuild: false,
      skip: true,
    };
  }

  if (
    STYLE_RELEVANT_FILES.has(filePath) ||
    !path.basename(filePath).includes(".")
  ) {
    return {
      filePath,
      label: `${filePath} changed`,
      needsStyleBuild: true,
      skip: false,
    };
  }

  return {
    filePath,
    label: `${filePath} changed`,
    needsStyleBuild: STYLE_RELEVANT_EXTENSIONS.has(
      path.extname(filePath).toLowerCase(),
    ),
    skip: false,
  };
};

const runCommand = (command: string[]) =>
  spawnSync(command, {
    stdout: "inherit",
    stderr: "inherit",
  });

const commandSucceeded = (result: ReturnType<typeof runCommand>): boolean => {
  if ("success" in result && typeof result.success === "boolean") {
    return result.success;
  }

  return result.exitCode === 0;
};

const runBuildStep = (label: string, command: string[]): BuildStepResult => {
  console.log(`${ansiColor("rgb(232, 199, 98)")}Running ${label}...`);

  try {
    const result = runCommand(command);

    return {
      success: commandSucceeded(result),
      resourceUsage: result.resourceUsage
        ? {
            maxRSS: result.resourceUsage.maxRSS,
            cpuTime: {
              user: result.resourceUsage.cpuTime.user,
              system: result.resourceUsage.cpuTime.system,
            },
          }
        : null,
    };
  } catch (error) {
    console.error(
      `${ansiColor("rgb(214, 117, 117)")}Failed to run ${label}`,
      error,
    );

    return {
      success: false,
      resourceUsage: null,
    };
  }
};

const logBuildSummary = (
  target: RuntimeTarget,
  needsStyleBuild: boolean,
  resourceUsage: BuildStepResult["resourceUsage"],
) => {
  const buildScope = needsStyleBuild ? "Style and binary" : "Binary";
  const usageLines = resourceUsage
    ? [
        `  Max memory used\t ${resourceUsage.maxRSS} bytes`,
        `  CPU time (user)\t ${resourceUsage.cpuTime.user} µs`,
        `  CPU time (system)\t ${resourceUsage.cpuTime.system} µs`,
      ]
    : [];

  process.stdout.write(
    `\n${usageLines.join("\n")}${usageLines.length ? "\n" : ""}+----------------------+---------------+---------+---------+\n${buildScope} build completed for ${ansiColor("rgb(117, 214, 122)")}${target.binaryPath}\n`,
  );
};

const stopRunningProcess = async () => {
  if (!proc) {
    return;
  }

  const runningProc = proc;
  proc = null;

  if (runningProc.killed) {
    await runningProc.exited;
    return;
  }

  console.log(`${ansiColor("rgb(214, 117, 117)")}Stopping running process...`);
  runningProc.kill();
  await runningProc.exited;
};

const startProcess = (binaryPath: string) => {
  console.log(
    `\n\x1b[48;5;115m\x1b[38;5;232m APP OUTPUT                                                 \x1b[0m\n`.substring(
      1,
    ),
  );
  console.log(`${ansiColor("rgb(117, 214, 122)")}Starting process...`);

  const nextProc = spawn([binaryPath], {
    stdout: "inherit",
    stderr: "inherit",
  });

  proc = nextProc;
  void nextProc.exited.then(() => {
    if (proc === nextProc) {
      proc = null;
    }
  });
};

const rebuild = async (event: WatchEventType, filePath: string | null) => {
  const target = getRuntimeTarget();

  if (!target) {
    console.error(
      `${ansiColor("rgb(214, 117, 117)")}Unsupported platform or architecture`,
    );
    return;
  }

  const plan = createBuildPlan(filePath);

  if (plan.skip) {
    console.log(`${ansiColor("rgb(146, 179, 214)")}${plan.label}`);
    return;
  }

  console.log(`${ansiColor("rgb(117, 214, 122)")}${plan.label} (${event})`);

  if (plan.needsStyleBuild) {
    const styleResult = runBuildStep("style build", [
      "bun",
      "run",
      "subbuild:style",
    ]);

    if (!styleResult.success) {
      console.error(
        `${ansiColor("rgb(214, 117, 117)")}Style build failed; keeping current process`,
      );
      return;
    }
  }

  const binaryResult = runBuildStep("binary build", [
    "bun",
    "run",
    target.buildScript,
  ]);

  if (!binaryResult.success) {
    console.error(
      `${ansiColor("rgb(214, 117, 117)")}Binary build failed; keeping current process`,
    );
    return;
  }

  logBuildSummary(target, plan.needsStyleBuild, binaryResult.resourceUsage);
  await stopRunningProcess();
  startProcess(target.binaryPath);
};

const compile = (event: WatchEventType, filePath: string | null) => {
  if (shuttingDown) {
    return current;
  }

  current = current
    .then(() => rebuild(event, filePath))
    .catch((error) => {
      console.error(
        `${ansiColor("rgb(214, 117, 117)")}Build watcher failed`,
        error,
      );
    });

  return current;
};

const staticWatchers: FSWatcher[] = [];
let sourceWatchers: FSWatcher[] = [];

const closeSourceWatchers = () => {
  sourceWatchers.forEach(closeWatcher);
  sourceWatchers = [];
};

const createWatcherListener =
  (watchPath: string): WatchListener<string> =>
  (event, filename) => {
    const filePath = formatWatchedPath(watchPath, filename);

    if (filePath?.startsWith("src/") && event === "rename") {
      refreshSourceWatchers();
    }

    void compile(event, filePath);
  };

const createWatcher = (watchPath: string) =>
  watch(watchPath, createWatcherListener(watchPath));

const refreshSourceWatchers = () => {
  closeSourceWatchers();
  sourceWatchers =
    collectRecursiveWatchPaths(SOURCE_WATCH_ROOT).map(createWatcher);
};

STATIC_WATCH_PATHS.forEach((watchPath) => {
  staticWatchers.push(createWatcher(watchPath));
});

refreshSourceWatchers();

const closeWatchers = () => {
  staticWatchers.forEach(closeWatcher);
  closeSourceWatchers();
};

const killChildProcessSync = () => {
  if (!proc || proc.killed) {
    return;
  }

  try {
    proc.kill();
  } catch {
    // The child may already be exiting while the parent tears down.
  }
};

const shutdown = async () => {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shuttingDown = true;
  closeWatchers();
  shutdownPromise = current
    .catch(() => undefined)
    .then(() => stopRunningProcess());

  return shutdownPromise;
};

const exitAfterShutdown = (code: number) => {
  void shutdown().finally(() => process.exit(code));
};

void compile("change" as WatchEventType, null);

process.once("SIGINT", () => {
  exitAfterShutdown(0);
});

process.once("SIGTERM", () => {
  exitAfterShutdown(0);
});

process.once("SIGHUP", () => {
  exitAfterShutdown(0);
});

process.once("exit", () => {
  closeWatchers();
  killChildProcessSync();
});
