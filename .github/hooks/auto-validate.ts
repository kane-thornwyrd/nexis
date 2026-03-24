import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type HookInput = {
  cwd?: string;
  hookEventName?: string;
  sessionId?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
};

type HookOutput = {
  continue?: boolean;
  stopReason?: string;
  systemMessage?: string;
  decision?: "block";
  reason?: string;
  hookSpecificOutput?: {
    hookEventName: "PostToolUse";
    additionalContext?: string;
  };
};

type OperatingSystemCode = "windows" | "darwin" | "linux";
type ArchCode = "x64" | "arm64";

type RuntimeTarget = {
  platform: OperatingSystemCode;
  arch: ArchCode;
  binaryPath: string;
  buildScript: string;
};

type CommandResult = {
  ok: boolean;
  command: string[];
  output: string;
  exitCode: number | null;
  warnings: string[];
};

type SmokeTestResult = {
  ok: boolean;
  command: string[];
  output: string;
  warnings: string[];
  reason?: string;
};

type ValidationState = {
  status: "passed" | "failed";
  changedFiles: string[];
  details: string[];
  updatedAt: string;
};

const STATE_DIR = ".github/hooks/.state/auto-validate";
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
const BINARY_RELEVANT_ROOT_FILES = new Set([
  "build-watcher.ts",
  "tailwind.config.js",
  "package.json",
  "tsconfig.json",
  "bunfig.toml",
  "createProcess.ts",
]);
const EDIT_TOOL_HINTS = [
  "apply_patch",
  "create",
  "delete",
  "edit",
  "insert",
  "move",
  "patch",
  "rename",
  "replace",
  "write",
];
const NON_EDIT_TOOL_HINTS = [
  "read",
  "search",
  "fetch",
  "list",
  "view",
  "open",
  "terminal",
  "run",
  "task",
  "browser",
];
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
const STARTUP_LOG_FRAGMENT = "server running at";
const SMOKE_TEST_TIMEOUT_MS = 5_000;
const SHUTDOWN_TIMEOUT_MS = 2_000;
const textDecoder = new TextDecoder();

const readStdin = async () => {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8").trim();
};

const unique = <T>(values: Iterable<T>) => [...new Set(values)];

const sanitizeId = (value: string | undefined) =>
  (value ?? "default-session").replace(/[^A-Za-z0-9._-]/g, "_");

const getStatePath = (root: string, sessionId: string) =>
  path.join(root, STATE_DIR, `${sanitizeId(sessionId)}.json`);

const saveValidationState = async (
  root: string,
  sessionId: string,
  state: ValidationState,
) => {
  await mkdir(path.join(root, STATE_DIR), { recursive: true });
  await Bun.write(
    getStatePath(root, sessionId),
    `${JSON.stringify(state, null, 2)}\n`,
  );
};

const normalizePath = (root: string, candidate: string) => {
  if (!candidate) {
    return null;
  }

  const withoutQuotes = candidate.replace(/^['"]|['"]$/g, "");
  const resolved = path.isAbsolute(withoutQuotes)
    ? withoutQuotes
    : path.resolve(root, withoutQuotes);
  const relative = path.relative(root, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return relative.split(path.sep).join("/");
};

const collectPaths = (root: string, value: unknown, key = ""): string[] => {
  if (!value) {
    return [] as string[];
  }

  if (typeof value === "string") {
    if (
      [
        "filePath",
        "path",
        "dirPath",
        "old_path",
        "new_path",
        "oldPath",
        "newPath",
        "files",
        "filePaths",
      ].includes(key)
    ) {
      const normalized = normalizePath(root, value);
      return normalized ? [normalized] : [];
    }

    if (key === "input") {
      return extractPathsFromPatch(root, value);
    }

    return [];
  }

  if (Array.isArray(value)) {
    return unique(value.flatMap((entry) => collectPaths(root, entry, key)));
  }

  if (typeof value === "object") {
    return unique(
      Object.entries(value as Record<string, unknown>).flatMap(
        ([childKey, childValue]) => collectPaths(root, childValue, childKey),
      ),
    );
  }

  return [];
};

const extractPathsFromPatch = (root: string, patchText: string): string[] => {
  const matches = patchText.matchAll(
    /^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm,
  );
  const paths = [] as string[];

  for (const match of matches) {
    const normalized = normalizePath(root, match[1]?.trim() ?? "");

    if (normalized) {
      paths.push(normalized);
    }
  }

  return unique(paths);
};

const isEditingTool = (toolName: string) => {
  const lowerName = toolName.toLowerCase();

  if (!lowerName) {
    return false;
  }

  if (NON_EDIT_TOOL_HINTS.some((hint) => lowerName.includes(hint))) {
    return false;
  }

  return EDIT_TOOL_HINTS.some((hint) => lowerName.includes(hint));
};

const needsStyleBuild = (filePath: string) => {
  if (GENERATED_FILES.has(filePath)) {
    return false;
  }

  if (STYLE_RELEVANT_FILES.has(filePath)) {
    return true;
  }

  if (!filePath.startsWith("src/")) {
    return false;
  }

  return STYLE_RELEVANT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
};

const needsBinaryBuild = (filePath: string) => {
  if (GENERATED_FILES.has(filePath)) {
    return false;
  }

  if (filePath.startsWith("src/")) {
    return true;
  }

  return BINARY_RELEVANT_ROOT_FILES.has(filePath);
};

const readPackageName = async (root: string) => {
  const packageJson = JSON.parse(
    await Bun.file(path.join(root, "package.json")).text(),
  ) as { name?: string };

  return packageJson.name ?? "nexis";
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
  if (arch.startsWith("arm") || arch.startsWith("aarch64")) return "arm64";

  return null;
};

const getRuntimeTarget = async (
  root: string,
): Promise<RuntimeTarget | null> => {
  const platform = resolvePlatform();
  const arch = resolveArch();

  if (!platform || !arch) {
    return null;
  }

  return {
    platform,
    arch,
    binaryPath: path.join(
      root,
      "bin",
      `${platform}-${arch}`,
      await readPackageName(root),
    ),
    buildScript: BUILD_SCRIPT_BY_TARGET[platform][arch],
  };
};

const extractWarnings = (output: string) =>
  unique(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^warn(?::|ing)/i.test(line)),
  );

const runCommand = (cwd: string, command: string[]): CommandResult => {
  const result = Bun.spawnSync(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });
  const stdout = textDecoder.decode(result.stdout);
  const stderr = textDecoder.decode(result.stderr);
  const output = [stdout, stderr].filter(Boolean).join("\n").trim();

  return {
    ok: result.exitCode === 0,
    command,
    output,
    exitCode: result.exitCode,
    warnings: extractWarnings(output),
  };
};

const readStream = async (
  stream: ReadableStream<Uint8Array> | null,
  onChunk: (text: string) => void,
) => {
  if (!stream) {
    return;
  }

  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      onChunk(textDecoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }
};

const stopProcess = async (proc: Bun.Subprocess) => {
  try {
    if (process.platform === "win32") {
      proc.kill();
    } else {
      proc.kill("SIGINT");
    }
  } catch {
    // The process may already be exiting.
  }

  await Promise.race([
    proc.exited.catch(() => undefined),
    Bun.sleep(SHUTDOWN_TIMEOUT_MS),
  ]);
};

const smokeTestBinary = async (
  cwd: string,
  binaryPath: string,
): Promise<SmokeTestResult> => {
  const command = [binaryPath];
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });
  let stdout = "";
  let stderr = "";
  let startupSeen = false;
  const watchOutput = (chunk: string) => {
    const combined = `${stdout}${stderr}${chunk}`;

    if (combined.toLowerCase().includes(STARTUP_LOG_FRAGMENT)) {
      startupSeen = true;
    }
  };
  const stdoutPromise = readStream(proc.stdout, (chunk) => {
    stdout += chunk;
    watchOutput(chunk);
  });
  const stderrPromise = readStream(proc.stderr, (chunk) => {
    stderr += chunk;
    watchOutput(chunk);
  });
  const deadline = Date.now() + SMOKE_TEST_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (startupSeen) {
      break;
    }

    if (proc.exitCode !== null) {
      break;
    }

    await Bun.sleep(100);
  }

  if (proc.exitCode === null) {
    await stopProcess(proc);
  }

  await Promise.all([stdoutPromise, stderrPromise]);

  const output = [stdout, stderr].filter(Boolean).join("\n").trim();
  const warnings = extractWarnings(output);

  if (startupSeen) {
    return {
      ok: true,
      command,
      output,
      warnings,
    };
  }

  return {
    ok: false,
    command,
    output,
    warnings,
    reason:
      proc.exitCode !== null
        ? `The binary exited before reaching its startup log (exit code ${proc.exitCode}).`
        : `The binary did not reach its startup log within ${SMOKE_TEST_TIMEOUT_MS / 1000}s.`,
  };
};

const formatCommand = (command: string[]) =>
  command
    .map((part) => (part.includes(" ") ? JSON.stringify(part) : part))
    .join(" ");

const buildSuccessOutput = (details: string[]): HookOutput => ({
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: details.join("\n"),
  },
});

const buildFailureOutput = (reason: string, details: string[]): HookOutput => ({
  decision: "block",
  reason,
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: details.join("\n"),
  },
});

const main = async () => {
  const stdin = await readStdin();

  if (!stdin) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const input = JSON.parse(stdin) as HookInput;
  const cwd = input.cwd ? path.resolve(input.cwd) : process.cwd();
  const sessionId = sanitizeId(input.sessionId);
  const toolName = String(input.tool_name ?? "");
  const toolInput = input.tool_input ?? {};
  const envFilePath = normalizePath(
    cwd,
    process.env.TOOL_INPUT_FILE_PATH ?? "",
  );
  const changedFiles = unique([
    ...collectPaths(cwd, toolInput),
    ...(envFilePath ? [envFilePath] : []),
  ]).filter(Boolean);

  if (!isEditingTool(toolName)) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const relevantFiles = changedFiles.filter(needsBinaryBuild);

  if (!relevantFiles.length) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const target = await getRuntimeTarget(cwd);

  if (!target) {
    await saveValidationState(cwd, sessionId, {
      status: "failed",
      changedFiles: relevantFiles,
      details: [
        "Automatic validation is blocked: unsupported platform or architecture.",
        `Tool: ${toolName}`,
        `Files: ${relevantFiles.join(", ")}`,
        `Platform: ${os.platform()}`,
        `Architecture: ${os.arch()}`,
      ],
      updatedAt: new Date().toISOString(),
    });

    process.stdout.write(
      JSON.stringify(
        buildFailureOutput(
          "Automatic validation is blocked: unsupported platform or architecture.",
          [
            `Tool: ${toolName}`,
            `Files: ${relevantFiles.join(", ")}`,
            `Platform: ${os.platform()}`,
            `Architecture: ${os.arch()}`,
          ],
        ),
      ),
    );
    return;
  }

  const details = [
    `Automatic validation triggered after ${toolName}.`,
    `Files: ${relevantFiles.join(", ")}`,
  ];

  if (relevantFiles.some(needsStyleBuild)) {
    const styleResult = runCommand(cwd, ["bun", "run", "subbuild:style"]);
    details.push(`Style build: ${formatCommand(styleResult.command)}`);

    if (!styleResult.ok) {
      if (styleResult.output) {
        details.push(styleResult.output);
      }

      await saveValidationState(cwd, sessionId, {
        status: "failed",
        changedFiles: relevantFiles,
        details,
        updatedAt: new Date().toISOString(),
      });

      process.stdout.write(
        JSON.stringify(
          buildFailureOutput(
            "Automatic validation failed during the style build.",
            details,
          ),
        ),
      );
      return;
    }
  }

  const binaryResult = runCommand(cwd, ["bun", "run", target.buildScript]);
  details.push(`Binary build: ${formatCommand(binaryResult.command)}`);

  if (!binaryResult.ok) {
    if (binaryResult.output) {
      details.push(binaryResult.output);
    }

    await saveValidationState(cwd, sessionId, {
      status: "failed",
      changedFiles: relevantFiles,
      details,
      updatedAt: new Date().toISOString(),
    });

    process.stdout.write(
      JSON.stringify(
        buildFailureOutput(
          "Automatic validation failed during the binary build.",
          details,
        ),
      ),
    );
    return;
  }

  const smokeTestResult = await smokeTestBinary(cwd, target.binaryPath);
  details.push(`Smoke test: ${formatCommand(smokeTestResult.command)}`);

  if (!smokeTestResult.ok) {
    if (smokeTestResult.output) {
      details.push(smokeTestResult.output);
    }

    await saveValidationState(cwd, sessionId, {
      status: "failed",
      changedFiles: relevantFiles,
      details,
      updatedAt: new Date().toISOString(),
    });

    process.stdout.write(
      JSON.stringify(
        buildFailureOutput(
          smokeTestResult.reason ??
            "Automatic validation failed during the runtime smoke test.",
          details,
        ),
      ),
    );
    return;
  }

  const warnings = unique([
    ...binaryResult.warnings,
    ...smokeTestResult.warnings,
  ]);

  details.push(`Target: ${target.platform}/${target.arch}`);
  details.push("Runtime startup log observed.");

  if (warnings.length) {
    details.push(`Warnings: ${warnings.join(" | ")}`);
  }

  await saveValidationState(cwd, sessionId, {
    status: "passed",
    changedFiles: relevantFiles,
    details,
    updatedAt: new Date().toISOString(),
  });

  process.stdout.write(JSON.stringify(buildSuccessOutput(details)));
};

void main().catch((error) => {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  process.stdout.write(
    JSON.stringify(
      buildFailureOutput("Automatic validation hook crashed.", [
        `Hook failure: ${message}`,
      ]),
    ),
  );
});
