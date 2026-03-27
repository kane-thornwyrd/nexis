import path from "node:path";

type HookEventName = "PostToolUse" | "Stop";

type HookInput = {
  cwd?: string;
  hookEventName?: HookEventName;
  sessionId?: string;
  tool_name?: string;
  tool_input?: unknown;
};

type HookOutput = {
  continue?: boolean;
  systemMessage?: string;
  hookSpecificOutput?: {
    hookEventName: HookEventName;
    additionalContext?: string;
    decision?: "block";
    reason?: string;
  };
};

type CommandResult = {
  exitCode: number;
  output: string;
};

type ParsedVersion = {
  raw: string;
  major: number;
  minor: number;
  patch: number;
};

const PRD_PATH = "PRD.md";
const PRD_VERSION_LINE_PATTERN = /^\s*-\s*Version:\s*(\d+)\.(\d+)\.(\d+)\s*$/m;
const PRD_VERSION_LINE_EXAMPLE = "- Version: x.y.z";
const PRD_VERSION_LINE_EXPECTATION = `Expected a line like '${PRD_VERSION_LINE_EXAMPLE}'.`;
const PRD_VERSIONING_GUIDANCE = [
  "Use approximate semantic versioning (semver):",
  "patch for wording clarification, formatting cleanup, examples, and other non-normative edits;",
  "minor for additive requirements, new user stories, new capabilities, new workflows, and other scope-expanding changes;",
  "major for incompatible requirement changes, removed requirements, primary workflow resets, or domain-model changes that invalidate earlier PRD assumptions.",
].join(" ");
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

const readStdin = async () => {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8").trim();
};

const unique = <T>(values: Iterable<T>) => [...new Set(values)];

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

const collectPaths = (root: string, value: unknown, key = ""): string[] => {
  if (!value) {
    return [];
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

const runCommand = async (
  cwd: string,
  command: string[],
): Promise<CommandResult> => {
  const proc = Bun.spawn({
    cmd: command,
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    exitCode,
    output: `${stdout}${stderr}`.trim(),
  };
};

const parseVersion = (text: string): ParsedVersion | null => {
  const match = text.match(PRD_VERSION_LINE_PATTERN);

  if (!match) {
    return null;
  }

  return {
    raw: `${match[1]}.${match[2]}.${match[3]}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

const compareVersions = (left: ParsedVersion, right: ParsedVersion) => {
  if (left.major !== right.major) {
    return left.major > right.major ? 1 : -1;
  }

  if (left.minor !== right.minor) {
    return left.minor > right.minor ? 1 : -1;
  }

  if (left.patch !== right.patch) {
    return left.patch > right.patch ? 1 : -1;
  }

  return 0;
};

const getHeadPrdText = async (root: string) => {
  const result = await runCommand(root, ["git", "show", `HEAD:${PRD_PATH}`]);

  if (result.exitCode !== 0) {
    return null;
  }

  return result.output;
};

const getWorkingPrdText = async (root: string) => {
  const file = Bun.file(path.join(root, PRD_PATH));

  if (!(await file.exists())) {
    return null;
  }

  return file.text();
};

const hasPrdChangesAgainstHead = async (root: string) => {
  const result = await runCommand(root, [
    "git",
    "diff",
    "--quiet",
    "HEAD",
    "--",
    PRD_PATH,
  ]);
  return result.exitCode === 1;
};

const buildReminderOutput = (message: string): HookOutput => ({
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: message,
  },
});

const createStopOutput = (reason: string): HookOutput => ({
  hookSpecificOutput: {
    hookEventName: "Stop",
    decision: "block",
    reason,
  },
});

const getValidationState = async (root: string) => {
  const [headText, workingText] = await Promise.all([
    getHeadPrdText(root),
    getWorkingPrdText(root),
  ]);

  if (!headText || !workingText) {
    return {
      shouldValidate: false,
      message:
        "PRD version hook skipped: unable to read PRD.md from the working tree or HEAD.",
    } as const;
  }

  const changed = await hasPrdChangesAgainstHead(root);

  if (!changed) {
    return {
      shouldValidate: false,
      message: "",
    } as const;
  }

  const headVersion = parseVersion(headText);
  const workingVersion = parseVersion(workingText);

  if (!headVersion) {
    return {
      shouldValidate: true,
      ok: false,
      reason: `PRD.md changed, but the version hook could not parse the base version from HEAD. ${PRD_VERSION_LINE_EXPECTATION}`,
    } as const;
  }

  if (!workingVersion) {
    return {
      shouldValidate: true,
      ok: false,
      reason: `PRD.md changed, but the current version line is missing or invalid. ${PRD_VERSION_LINE_EXPECTATION}`,
    } as const;
  }

  if (compareVersions(workingVersion, headVersion) <= 0) {
    return {
      shouldValidate: true,
      ok: false,
      reason: `PRD.md changed without a version bump. Current version ${workingVersion.raw} must be greater than the base version ${headVersion.raw}. ${PRD_VERSIONING_GUIDANCE}`,
    } as const;
  }

  return {
    shouldValidate: true,
    ok: true,
    reason: `PRD version advanced from ${headVersion.raw} to ${workingVersion.raw}.`,
  } as const;
};

const handlePostToolUse = async (root: string, input: HookInput) => {
  const toolName = String(input.tool_name ?? "");

  if (!isEditingTool(toolName)) {
    return { continue: true } as HookOutput;
  }

  const envFilePath = normalizePath(
    root,
    process.env.TOOL_INPUT_FILE_PATH ?? "",
  );
  const changedFiles = unique([
    ...collectPaths(root, input.tool_input ?? {}),
    ...(envFilePath ? [envFilePath] : []),
  ]);

  if (!changedFiles.includes(PRD_PATH)) {
    return { continue: true } as HookOutput;
  }

  const validation = await getValidationState(root);

  if (!validation.shouldValidate || validation.ok) {
    return { continue: true } as HookOutput;
  }

  return buildReminderOutput(validation.reason);
};

const handleStop = async (root: string) => {
  const validation = await getValidationState(root);

  if (!validation.shouldValidate) {
    if (validation.message) {
      return {
        continue: true,
        systemMessage: validation.message,
      } as HookOutput;
    }

    return { continue: true } as HookOutput;
  }

  if (validation.ok) {
    return { continue: true } as HookOutput;
  }

  return createStopOutput(validation.reason);
};

const main = async () => {
  const stdin = await readStdin();

  if (!stdin) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const input = JSON.parse(stdin) as HookInput;
  const root = input.cwd ? path.resolve(input.cwd) : process.cwd();
  let output: HookOutput = { continue: true };

  switch (input.hookEventName) {
    case "PostToolUse":
      output = await handlePostToolUse(root, input);
      break;
    case "Stop":
      output = await handleStop(root);
      break;
    default:
      output = { continue: true };
      break;
  }

  process.stdout.write(JSON.stringify(output));
};

void main().catch((error) => {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  process.stdout.write(
    JSON.stringify({
      continue: true,
      systemMessage: `PRD version enforcement hook error: ${message}`,
    }),
  );
});
