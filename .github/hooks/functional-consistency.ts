import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

type HookInput = {
  cwd?: string;
  hookEventName?: "PreToolUse" | "PostToolUse" | "Stop";
  sessionId?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_use_id?: string;
  stop_hook_active?: boolean;
};

type HookOutput = {
  continue?: boolean;
  systemMessage?: string;
  hookSpecificOutput?: Record<string, unknown>;
};

type SessionState = {
  preSnapshots: Record<string, Record<string, string | null>>;
  unresolved: Record<string, UnresolvedChange>;
  lastStopBlockSignature?: string;
};

type UnresolvedChange = {
  key: string;
  filePath: string;
  functionName: string;
  bodyLineCount: number;
  preferredTestPath: string;
  candidateTestPaths: string[];
  status: "missing-test" | "test-failed";
  lastCommand?: string;
  lastResult?: string;
};

type CommandResult = {
  ok: boolean;
  command: string[];
  output: string;
  exitCode: number | null;
};

type ExtractedFunction = {
  name: string;
  blockText: string;
  bodyLineCount: number;
};

const STATE_DIR = ".github/hooks/.state/functional-consistency";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
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
const RESERVED_METHOD_NAMES = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "with",
  "else",
  "do",
  "try",
  "return",
  "function",
  "typeof",
  "delete",
  "new",
  "await",
]);
const FUNCTION_PATTERNS = [
  /\b(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
  /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\s*\(|(?:<[^>]+>\s*)?\([^)]*\)\s*(?::[^\n=]+)?\s*=>|(?:<[^>]+>\s*)?[A-Za-z_$][\w$]*\s*(?::[^\n=]+)?\s*=>)/g,
  /^\s*(?:export\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:function\s*\(|\([^)]*\)\s*(?::[^\n=]+)?\s*=>|[A-Za-z_$][\w$]*\s*(?::[^\n=]+)?\s*=>)/gm,
  /^\s*(?:public\s+|private\s+|protected\s+|static\s+|readonly\s+|abstract\s+|override\s+|async\s+)*(constructor|[A-Za-z_$][\w$]*)\s*\([^;\n]*\)\s*(?::[^\n{=]+)?\{/gm,
  /^\s*(?:export\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^;\n]*\)\s*(?::[^\n{=]+)?\{/gm,
];
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

const createEmptyState = (): SessionState => ({
  preSnapshots: {},
  unresolved: {},
});

const hasStateData = (state: SessionState) =>
  Boolean(
    Object.keys(state.preSnapshots).length ||
    Object.keys(state.unresolved).length ||
    state.lastStopBlockSignature,
  );

const ensureStateDir = async (root: string) => {
  await mkdir(path.join(root, STATE_DIR), { recursive: true });
};

const loadSessionState = async (root: string, sessionId: string) => {
  const statePath = getStatePath(root, sessionId);
  const stateFile = Bun.file(statePath);

  if (!(await stateFile.exists())) {
    return createEmptyState();
  }

  try {
    return JSON.parse(await stateFile.text()) as SessionState;
  } catch {
    return createEmptyState();
  }
};

const saveSessionState = async (
  root: string,
  sessionId: string,
  state: SessionState,
) => {
  const statePath = getStatePath(root, sessionId);

  if (!hasStateData(state)) {
    await rm(statePath, { force: true });
    return;
  }

  await ensureStateDir(root);
  await Bun.write(statePath, `${JSON.stringify(state, null, 2)}\n`);
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

const isNamedTestFile = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");

  return (
    /(?:^|\/)[^/]+(?:\.test|\.spec)\.[jt]sx?$/i.test(normalized) ||
    /(?:^|\/)[^/]+_(?:test|spec)_[^/]*\.[jt]sx?$/i.test(normalized)
  );
};

const isPolicyTestFile = (filePath: string) =>
  filePath.startsWith("__tests__/") || isNamedTestFile(filePath);

const isReactComponentFile = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");

  return (
    normalized.endsWith(".tsx") ||
    normalized.endsWith(".jsx") ||
    normalized.startsWith("src/components/") ||
    normalized.includes("/components/")
  );
};

const isPolicySourceFile = (filePath: string) => {
  if (
    filePath.startsWith(".github/") ||
    filePath.startsWith("node_modules/") ||
    filePath.startsWith("bin/") ||
    filePath.startsWith("__tests__/") ||
    isReactComponentFile(filePath) ||
    isNamedTestFile(filePath) ||
    filePath.endsWith(".d.ts")
  ) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
};

const readFileIfExists = async (filePath: string) => {
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return null;
  }

  return await file.text();
};

const buildTestCandidates = (filePath: string) => {
  const stem = filePath.replace(/\.[^.]+$/, "");

  return unique([
    `__tests__/${stem}.test.ts`,
    `__tests__/${stem}.test.tsx`,
    `__tests__/${stem}.spec.ts`,
    `__tests__/${stem}.spec.tsx`,
    `${stem}.test.ts`,
    `${stem}.test.tsx`,
    `${stem}.spec.ts`,
    `${stem}.spec.tsx`,
  ]);
};

const findExistingTestPath = async (root: string, candidates: string[]) => {
  for (const candidate of candidates) {
    if (await Bun.file(path.join(root, candidate)).exists()) {
      return candidate;
    }
  }

  return null;
};

const stripCommentsAndStringsForBraceMatching = (
  source: string,
  startIndex: number,
) => {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inLineComment) {
      if (character === "\n") {
        inLineComment = false;
      }

      continue;
    }

    if (inBlockComment) {
      if (character === "*" && nextCharacter === "/") {
        inBlockComment = false;
        index += 1;
      }

      continue;
    }

    if (inSingleQuote || inDoubleQuote || inTemplate) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (inSingleQuote && character === "'") {
        inSingleQuote = false;
      } else if (inDoubleQuote && character === '"') {
        inDoubleQuote = false;
      } else if (inTemplate && character === "`") {
        inTemplate = false;
      }

      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (character === "'") {
      inSingleQuote = true;
      continue;
    }

    if (character === '"') {
      inDoubleQuote = true;
      continue;
    }

    if (character === "`") {
      inTemplate = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return null;
};

const countNonEmptyLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;

const extractFunctions = (source: string): ExtractedFunction[] => {
  const seen = new Set<string>();
  const extracted = [] as ExtractedFunction[];

  for (const pattern of FUNCTION_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of source.matchAll(pattern)) {
      const name = match[1]?.trim();

      if (!name || RESERVED_METHOD_NAMES.has(name)) {
        continue;
      }

      const braceOffset = match[0].lastIndexOf("{");
      const openBraceIndex =
        braceOffset >= 0
          ? (match.index ?? 0) + braceOffset
          : source.indexOf("{", (match.index ?? 0) + match[0].length);

      if (openBraceIndex < 0) {
        continue;
      }

      const closeBraceIndex = stripCommentsAndStringsForBraceMatching(
        source,
        openBraceIndex,
      );

      if (closeBraceIndex === null) {
        continue;
      }

      const dedupeKey = `${name}:${match.index ?? 0}:${openBraceIndex}`;

      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);

      const blockText = source.slice(match.index ?? 0, closeBraceIndex + 1);
      const bodyText = source.slice(openBraceIndex + 1, closeBraceIndex);

      extracted.push({
        name,
        blockText,
        bodyLineCount: countNonEmptyLines(bodyText),
      });
    }
  }

  return extracted;
};

const findChangedQualifyingFunctions = (
  beforeText: string,
  afterText: string,
) => {
  const beforeByName = new Map<string, ExtractedFunction[]>();

  for (const fn of extractFunctions(beforeText)) {
    beforeByName.set(fn.name, [...(beforeByName.get(fn.name) ?? []), fn]);
  }

  return extractFunctions(afterText).filter((fn) => {
    if (fn.bodyLineCount <= 10) {
      return false;
    }

    const previous = beforeByName.get(fn.name) ?? [];

    return !previous.some((candidate) => candidate.blockText === fn.blockText);
  });
};

const formatCommand = (command: string[]) =>
  command
    .map((part) => (part.includes(" ") ? JSON.stringify(part) : part))
    .join(" ");

const runCommand = (cwd: string, command: string[]): CommandResult => {
  const result = Bun.spawnSync(command, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = textDecoder.decode(result.stdout);
  const stderr = textDecoder.decode(result.stderr);

  return {
    ok: result.exitCode === 0,
    command,
    exitCode: result.exitCode,
    output: [stdout, stderr].filter(Boolean).join("\n").trim(),
  };
};

const removeEntriesForFile = (state: SessionState, filePath: string) => {
  for (const [key, entry] of Object.entries(state.unresolved)) {
    if (entry.filePath === filePath) {
      delete state.unresolved[key];
    }
  }
};

const removeIgnoredComponentEntries = (state: SessionState) => {
  for (const [key, entry] of Object.entries(state.unresolved)) {
    if (isReactComponentFile(entry.filePath)) {
      delete state.unresolved[key];
    }
  }
};

const createMissingTestEntry = (
  filePath: string,
  fn: ExtractedFunction,
  candidates: string[],
  status: UnresolvedChange["status"],
  command?: string,
  result?: string,
): UnresolvedChange => ({
  key: `${filePath}:${fn.name}`,
  filePath,
  functionName: fn.name,
  bodyLineCount: fn.bodyLineCount,
  preferredTestPath: candidates[0],
  candidateTestPaths: candidates,
  status,
  lastCommand: command,
  lastResult: result,
});

const summarizeFunctions = (functions: ExtractedFunction[]) =>
  functions
    .map((fn) => `${fn.name} (${fn.bodyLineCount} non-empty lines)`)
    .join(", ");

const processSourceFileChange = async (
  root: string,
  state: SessionState,
  filePath: string,
  beforeText: string | null,
) => {
  removeEntriesForFile(state, filePath);

  const absoluteFilePath = path.join(root, filePath);
  const afterText = (await readFileIfExists(absoluteFilePath)) ?? "";
  const changedFunctions = findChangedQualifyingFunctions(
    beforeText ?? "",
    afterText,
  );

  if (!changedFunctions.length) {
    return [] as string[];
  }

  const candidates = buildTestCandidates(filePath);
  const existingTestPath = await findExistingTestPath(root, candidates);

  if (!existingTestPath) {
    for (const fn of changedFunctions) {
      const entry = createMissingTestEntry(
        filePath,
        fn,
        candidates,
        "missing-test",
      );
      state.unresolved[entry.key] = entry;
    }

    return [
      `Functional consistency: ${filePath} changed qualifying functions ${summarizeFunctions(changedFunctions)} but no matching test file exists yet.`,
      `Preferred test location: ${candidates[0]}`,
    ];
  }

  const testResult = runCommand(root, ["bun", "test", existingTestPath]);
  const testCommand = formatCommand(testResult.command);

  if (testResult.ok) {
    return [
      `Functional consistency: ran ${testCommand} after changes in ${filePath}.`,
      `Covered functions: ${summarizeFunctions(changedFunctions)}`,
    ];
  }

  for (const fn of changedFunctions) {
    const entry = createMissingTestEntry(
      filePath,
      fn,
      [
        existingTestPath,
        ...candidates.filter((candidate) => candidate !== existingTestPath),
      ],
      "test-failed",
      testCommand,
      testResult.output,
    );
    state.unresolved[entry.key] = entry;
  }

  return [
    `Functional consistency: ${testCommand} failed after changes in ${filePath}.`,
    `Covered functions: ${summarizeFunctions(changedFunctions)}`,
    ...(testResult.output ? [testResult.output] : []),
  ];
};

const processChangedTestFile = async (
  root: string,
  state: SessionState,
  filePath: string,
) => {
  const matchingEntries = Object.values(state.unresolved).filter((entry) =>
    entry.candidateTestPaths.includes(filePath),
  );

  if (!matchingEntries.length) {
    return [] as string[];
  }

  const testResult = runCommand(root, ["bun", "test", filePath]);
  const testCommand = formatCommand(testResult.command);

  if (testResult.ok) {
    for (const entry of matchingEntries) {
      delete state.unresolved[entry.key];
    }

    return [
      `Functional consistency: ran ${testCommand} after updating ${filePath}.`,
    ];
  }

  for (const entry of matchingEntries) {
    state.unresolved[entry.key] = {
      ...entry,
      status: "test-failed",
      preferredTestPath: filePath,
      lastCommand: testCommand,
      lastResult: testResult.output,
    };
  }

  return [
    `Functional consistency: ${testCommand} failed after updating ${filePath}.`,
    ...(testResult.output ? [testResult.output] : []),
  ];
};

const buildAdditionalContextOutput = (messages: string[]): HookOutput => ({
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: messages.join("\n"),
  },
});

const summarizeUnresolvedEntries = (entries: UnresolvedChange[]) =>
  entries.map((entry) => {
    if (entry.status === "missing-test") {
      return `${entry.filePath}:${entry.functionName} needs a test at ${entry.preferredTestPath}`;
    }

    return `${entry.filePath}:${entry.functionName} has a failing targeted test via ${entry.lastCommand ?? `bun test ${entry.preferredTestPath}`}`;
  });

const createStopOutput = (reason: string): HookOutput => ({
  hookSpecificOutput: {
    hookEventName: "Stop",
    decision: "block",
    reason,
  },
});

const handlePreToolUse = async (root: string, input: HookInput) => {
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
  ]).filter(isPolicySourceFile);

  if (!changedFiles.length) {
    return { continue: true } as HookOutput;
  }

  const sessionId = sanitizeId(input.sessionId);
  const toolUseId = sanitizeId(input.tool_use_id);
  const state = await loadSessionState(root, sessionId);
  const snapshots = {} as Record<string, string | null>;

  for (const filePath of changedFiles) {
    snapshots[filePath] = await readFileIfExists(path.join(root, filePath));
  }

  state.preSnapshots[toolUseId] = snapshots;
  await saveSessionState(root, sessionId, state);

  return { continue: true } as HookOutput;
};

const handlePostToolUse = async (root: string, input: HookInput) => {
  const toolName = String(input.tool_name ?? "");

  if (!isEditingTool(toolName)) {
    return { continue: true } as HookOutput;
  }

  const sessionId = sanitizeId(input.sessionId);
  const toolUseId = sanitizeId(input.tool_use_id);
  const state = await loadSessionState(root, sessionId);
  const envFilePath = normalizePath(
    root,
    process.env.TOOL_INPUT_FILE_PATH ?? "",
  );
  const changedFiles = unique([
    ...collectPaths(root, input.tool_input ?? {}),
    ...(envFilePath ? [envFilePath] : []),
  ]);
  const ignoredComponentFiles = changedFiles.filter(isReactComponentFile);
  const sourceFiles = changedFiles.filter(isPolicySourceFile);
  const testFiles = changedFiles.filter(isPolicyTestFile);
  const snapshots = state.preSnapshots[toolUseId] ?? {};
  const messages = [] as string[];

  delete state.preSnapshots[toolUseId];
  removeIgnoredComponentEntries(state);

  for (const filePath of ignoredComponentFiles) {
    removeEntriesForFile(state, filePath);
  }

  for (const filePath of sourceFiles) {
    messages.push(
      ...(await processSourceFileChange(
        root,
        state,
        filePath,
        snapshots[filePath] ?? null,
      )),
    );
  }

  for (const filePath of testFiles) {
    messages.push(...(await processChangedTestFile(root, state, filePath)));
  }

  if (!Object.keys(state.unresolved).length) {
    state.lastStopBlockSignature = undefined;
  }

  await saveSessionState(root, sessionId, state);

  if (!messages.length) {
    return { continue: true } as HookOutput;
  }

  return buildAdditionalContextOutput(messages);
};

const handleStop = async (root: string, input: HookInput) => {
  const sessionId = sanitizeId(input.sessionId);
  const state = await loadSessionState(root, sessionId);
  removeIgnoredComponentEntries(state);
  const unresolved = Object.values(state.unresolved);

  if (!unresolved.length) {
    state.lastStopBlockSignature = undefined;
    await saveSessionState(root, sessionId, state);
    return { continue: true } as HookOutput;
  }

  const summary = summarizeUnresolvedEntries(unresolved);
  const signature = summary.sort().join("|");

  state.lastStopBlockSignature = signature;
  await saveSessionState(root, sessionId, state);

  return createStopOutput(
    `Functional consistency is unresolved: ${summary.join("; ")}`,
  );
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
    case "PreToolUse":
      output = await handlePreToolUse(root, input);
      break;
    case "PostToolUse":
      output = await handlePostToolUse(root, input);
      break;
    case "Stop":
      output = await handleStop(root, input);
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
      systemMessage: `Functional consistency hook error: ${message}`,
    }),
  );
});
