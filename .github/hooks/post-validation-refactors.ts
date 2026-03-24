import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

type HookInput = {
  cwd?: string;
  hookEventName?: "PostToolUse" | "SubagentStop" | "Stop";
  sessionId?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  agent_type?: string;
};

type HookOutput = {
  continue?: boolean;
  systemMessage?: string;
  hookSpecificOutput?: Record<string, unknown>;
};

type SessionState = {
  changedFiles: string[];
  completedPassIds: string[];
};

type ValidationState = {
  status?: "passed" | "failed";
  changedFiles?: string[];
  details?: string[];
  updatedAt?: string;
};

type FunctionalConsistencyState = {
  unresolved?: Record<string, unknown>;
};

type PassSelector =
  | "react-components"
  | "source-files"
  | "non-react-source-files";

type RefactorPassConfig = {
  id: string;
  agent: string;
  selector: PassSelector;
};

type RefactorPassConfigFile = {
  passes?: unknown[];
};

const STATE_DIR = ".github/hooks/.state/post-validation-refactors";
const AUTO_VALIDATE_STATE_DIR = ".github/hooks/.state/auto-validate";
const FUNCTIONAL_CONSISTENCY_STATE_DIR =
  ".github/hooks/.state/functional-consistency";
const CONFIG_PATH = ".github/hooks/post-validation-refactors.config.json";
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
const DEFAULT_PASSES: RefactorPassConfig[] = [
  {
    id: "lightweight-components",
    agent: "Lightweight Components Guard",
    selector: "react-components",
  },
  {
    id: "refactoring-tricks",
    agent: "Refactoring Tricks Guard",
    selector: "source-files",
  },
];

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

const createEmptyState = (): SessionState => ({
  changedFiles: [],
  completedPassIds: [],
});

const normalizeSessionState = (value: unknown): SessionState => {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const changedFiles = Array.isArray(record.changedFiles)
    ? record.changedFiles.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const completedPassIds = Array.isArray(record.completedPassIds)
    ? record.completedPassIds.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const migratedPassIds = [
    ...(record.componentReviewCompleted === true
      ? ["lightweight-components"]
      : []),
    ...(record.refactorReviewCompleted === true ? ["refactoring-tricks"] : []),
  ];

  return {
    changedFiles: unique(changedFiles),
    completedPassIds: unique([...completedPassIds, ...migratedPassIds]),
  };
};

const getStatePath = (root: string, sessionId: string) =>
  path.join(root, STATE_DIR, `${sanitizeId(sessionId)}.json`);

const hasStateData = (state: SessionState) =>
  state.changedFiles.length > 0 || state.completedPassIds.length > 0;

const ensureStateDir = async (root: string) => {
  await mkdir(path.join(root, STATE_DIR), { recursive: true });
};

const loadJsonFile = async <T>(filePath: string): Promise<T | null> => {
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return null;
  }

  try {
    return JSON.parse(await file.text()) as T;
  } catch {
    return null;
  }
};

const loadSessionState = async (root: string, sessionId: string) =>
  normalizeSessionState(
    await loadJsonFile<unknown>(getStatePath(root, sessionId)),
  );

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

const isPassSelector = (value: string): value is PassSelector =>
  ["react-components", "source-files", "non-react-source-files"].includes(
    value,
  );

const normalizePassConfig = (value: unknown): RefactorPassConfig | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const agent = typeof record.agent === "string" ? record.agent.trim() : "";
  const selector =
    typeof record.selector === "string" && isPassSelector(record.selector)
      ? record.selector
      : null;

  if (!id || !agent || !selector) {
    return null;
  }

  return { id, agent, selector };
};

const loadPassConfigs = async (root: string) => {
  const config = await loadJsonFile<RefactorPassConfigFile>(
    path.join(root, CONFIG_PATH),
  );
  const normalized = [] as RefactorPassConfig[];
  const seen = new Set<string>();

  for (const value of config?.passes ?? []) {
    const pass = normalizePassConfig(value);

    if (!pass || seen.has(pass.id)) {
      continue;
    }

    seen.add(pass.id);
    normalized.push(pass);
  }

  return normalized.length ? normalized : DEFAULT_PASSES;
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

const isReactComponentFile = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");

  return (
    normalized.endsWith(".tsx") ||
    normalized.endsWith(".jsx") ||
    normalized.startsWith("src/components/") ||
    normalized.includes("/components/")
  );
};

const isRefactorEligibleFile = (filePath: string) => {
  if (
    filePath.startsWith(".github/") ||
    filePath.startsWith("node_modules/") ||
    filePath.startsWith("bin/") ||
    filePath.startsWith("__tests__/") ||
    isNamedTestFile(filePath) ||
    filePath.endsWith(".d.ts")
  ) {
    return false;
  }

  return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
};

const getFilesForPass = (changedFiles: string[], pass: RefactorPassConfig) => {
  switch (pass.selector) {
    case "react-components":
      return changedFiles.filter(isReactComponentFile);
    case "non-react-source-files":
      return changedFiles.filter((filePath) => !isReactComponentFile(filePath));
    case "source-files":
    default:
      return changedFiles;
  }
};

const loadValidationState = async (root: string, sessionId: string) =>
  await loadJsonFile<ValidationState>(
    path.join(root, AUTO_VALIDATE_STATE_DIR, `${sanitizeId(sessionId)}.json`),
  );

const loadFunctionalConsistencyState = async (
  root: string,
  sessionId: string,
) =>
  await loadJsonFile<FunctionalConsistencyState>(
    path.join(
      root,
      FUNCTIONAL_CONSISTENCY_STATE_DIR,
      `${sanitizeId(sessionId)}.json`,
    ),
  );

const createStopOutput = (reason: string): HookOutput => ({
  hookSpecificOutput: {
    hookEventName: "Stop",
    decision: "block",
    reason,
  },
});

const handlePostToolUse = async (root: string, input: HookInput) => {
  const toolName = String(input.tool_name ?? "");

  if (!isEditingTool(toolName)) {
    return { continue: true } as HookOutput;
  }

  const sessionId = sanitizeId(input.sessionId);
  const state = await loadSessionState(root, sessionId);
  const passConfigs = await loadPassConfigs(root);
  const envFilePath = normalizePath(
    root,
    process.env.TOOL_INPUT_FILE_PATH ?? "",
  );
  const changedFiles = unique([
    ...collectPaths(root, input.tool_input ?? {}),
    ...(envFilePath ? [envFilePath] : []),
  ]).filter(isRefactorEligibleFile);

  if (!changedFiles.length) {
    return { continue: true } as HookOutput;
  }

  state.changedFiles = unique([...state.changedFiles, ...changedFiles]);

  for (const pass of passConfigs) {
    if (getFilesForPass(changedFiles, pass).length) {
      state.completedPassIds = state.completedPassIds.filter(
        (passId) => passId !== pass.id,
      );
    }
  }

  await saveSessionState(root, sessionId, state);

  return { continue: true } as HookOutput;
};

const handleSubagentStop = async (root: string, input: HookInput) => {
  const sessionId = sanitizeId(input.sessionId);
  const state = await loadSessionState(root, sessionId);
  const passConfigs = await loadPassConfigs(root);
  const agentType = String(input.agent_type ?? "");
  const completedPass = passConfigs.find((pass) => pass.agent === agentType);

  if (!hasStateData(state) || !completedPass) {
    return { continue: true } as HookOutput;
  }

  state.completedPassIds = unique([
    ...state.completedPassIds.filter((passId) => passId !== completedPass.id),
    completedPass.id,
  ]);
  await saveSessionState(root, sessionId, state);

  return { continue: true } as HookOutput;
};

const handleStop = async (root: string, input: HookInput) => {
  const sessionId = sanitizeId(input.sessionId);
  const state = await loadSessionState(root, sessionId);
  const changedFiles = unique(
    state.changedFiles.filter(isRefactorEligibleFile),
  );

  if (!changedFiles.length) {
    await saveSessionState(root, sessionId, createEmptyState());
    return { continue: true } as HookOutput;
  }

  const validationState = await loadValidationState(root, sessionId);
  const functionalState = await loadFunctionalConsistencyState(root, sessionId);
  const compileAndRuntimeReady = validationState?.status === "passed";
  const testsReady = !Object.keys(functionalState?.unresolved ?? {}).length;

  if (!compileAndRuntimeReady || !testsReady) {
    return { continue: true } as HookOutput;
  }

  const passConfigs = await loadPassConfigs(root);
  const pendingPasses = passConfigs.flatMap((pass) => {
    const files = getFilesForPass(changedFiles, pass);

    if (!files.length || state.completedPassIds.includes(pass.id)) {
      return [] as Array<{ pass: RefactorPassConfig; files: string[] }>;
    }

    return [{ pass, files }];
  });

  if (!pendingPasses.length) {
    await saveSessionState(root, sessionId, createEmptyState());
    return { continue: true } as HookOutput;
  }

  return createStopOutput(
    `Post-validation refactor pass required for already working and tested code: ${pendingPasses.map(({ pass, files }) => `invoke ${pass.agent} on ${files.join(", ")}`).join(", then ")}. Keep the changes behavior-preserving, and if any follow-up agent finds no worthwhile improvement, say so explicitly before finishing.`,
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
    case "PostToolUse":
      output = await handlePostToolUse(root, input);
      break;
    case "SubagentStop":
      output = await handleSubagentStop(root, input);
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
      systemMessage: `Post-validation refactor hook error: ${message}`,
    }),
  );
});
