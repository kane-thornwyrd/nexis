const OUTFILE_FLAG_PATTERN = /--outfile(?:=|\s+)(?:"([^"]+)"|'([^']+)'|(\S+))/;
const BINARY_SCRIPT_PREFIX = "subbuild:bin:";
export const AUTO_RELEASE_COMMIT_INTERVAL = 10;
const FIRST_RELEASE_WARNING_SECTION = [
  "## WARNING: FIRST RELEASE ONLY",
  "- This release exists primarily to establish the project's first published release line.",
  "- It marks a major architectural milestone for NEXIS.",
  "- Nothing in this release should be treated as usable or production-ready yet.",
].join("\n");

export const parseReleaseMajor = (version: string): number => {
  const match = version.match(/^(\d+)/);

  if (!match) {
    throw new Error(
      `Unable to parse the release number from version ${JSON.stringify(version)}.`,
    );
  }

  return Number(match[1]);
};

export const incrementReleaseVersion = (version: string): string => {
  return `${parseReleaseMajor(version) + 1}.0.0`;
};

export const resolveReleaseVersion = (
  currentVersion: string,
  previousTag: string | null,
): string => {
  return previousTag === null
    ? currentVersion
    : incrementReleaseVersion(currentVersion);
};

const serializeJsonFile = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

type PackageJsonLike = Record<string, unknown> & {
  version: string;
};

export const createPackageJsonVersionUpdate = <
  TPackageJson extends PackageJsonLike,
>(
  packageJson: TPackageJson,
  nextVersion: string,
): {
  didVersionChange: boolean;
  serializedPackageJson: string;
} => {
  const didVersionChange = packageJson.version !== nextVersion;
  const nextPackageJson = { ...packageJson };

  if (didVersionChange) {
    nextPackageJson.version = nextVersion;
  }

  return {
    didVersionChange,
    serializedPackageJson: serializeJsonFile(nextPackageJson),
  };
};

export const createReleaseCommitMessage = (tag: string): string => {
  return `Release ${tag} [skip ci]`;
};

export const isReleaseCommitMessage = (message: string): boolean => {
  return message.trim().startsWith("Release v");
};

export const hasReachedReleaseCommitThreshold = (
  commitCount: number,
  threshold = AUTO_RELEASE_COMMIT_INTERVAL,
): boolean => {
  return commitCount >= threshold;
};

export const normalizeReleaseAssetPath = (filePath: string): string => {
  if (
    filePath.startsWith("./") ||
    filePath.startsWith("../") ||
    filePath.startsWith(".\\") ||
    filePath.startsWith("..\\")
  ) {
    return filePath;
  }

  return `./${filePath}`;
};

export const parseOutfileFromScript = (script: string): string | null => {
  const outfileMatch = script.match(OUTFILE_FLAG_PATTERN);
  const assetPath =
    outfileMatch?.[1] ?? outfileMatch?.[2] ?? outfileMatch?.[3] ?? null;

  return assetPath ? normalizeReleaseAssetPath(assetPath) : null;
};

export const collectBinaryAssetPaths = (
  scripts: Partial<Record<string, string>>,
): string[] => {
  const assetPaths = Object.entries(scripts)
    .filter(([scriptName]) => scriptName.startsWith(BINARY_SCRIPT_PREFIX))
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
    .flatMap(([, script]) => {
      const assetPath = script ? parseOutfileFromScript(script) : null;
      return assetPath ? [assetPath] : [];
    });

  return [...new Set(assetPaths)];
};

const normalizeLineEndings = (value: string): string =>
  value.replace(/\r\n/g, "\n");

// Ignore newline-only footer drift between working tree files and git blobs.
const splitNormalizedLines = (value: string): string[] =>
  normalizeLineEndings(value).trimEnd().split("\n");

const MISSING_CHANGELOG_FALLBACK =
  "No changelog entries were added since the previous release.";

const getFirstChangelogEntryIndex = (lines: readonly string[]): number => {
  return lines.findIndex((line) => line.startsWith("### "));
};

export const extractChangelogSincePreviousRelease = (
  currentChangelog: string,
  previousChangelog: string | null,
): string => {
  const currentLines = splitNormalizedLines(currentChangelog);
  const firstEntryIndex = getFirstChangelogEntryIndex(currentLines);

  if (firstEntryIndex === -1) {
    return currentChangelog.trim() || MISSING_CHANGELOG_FALLBACK;
  }

  if (!previousChangelog) {
    return currentLines.slice(firstEntryIndex).join("\n").trim();
  }

  const previousLines = splitNormalizedLines(previousChangelog);
  let sharedSuffixLength = 0;

  while (
    sharedSuffixLength < currentLines.length &&
    sharedSuffixLength < previousLines.length &&
    currentLines[currentLines.length - 1 - sharedSuffixLength] ===
      previousLines[previousLines.length - 1 - sharedSuffixLength]
  ) {
    sharedSuffixLength += 1;
  }

  const candidateLines =
    sharedSuffixLength > 0
      ? currentLines.slice(0, currentLines.length - sharedSuffixLength)
      : currentLines;
  const candidateEntryIndex = getFirstChangelogEntryIndex(candidateLines);
  const changelogSlice = candidateLines
    .slice(candidateEntryIndex === -1 ? firstEntryIndex : candidateEntryIndex)
    .join("\n")
    .trim();

  return changelogSlice || MISSING_CHANGELOG_FALLBACK;
};

export const createReleaseFlavorNotes = (releaseMajor: number): string[] => {
  const flavorNotes = [] as string[];

  if (releaseMajor % 10 === 0) {
    flavorNotes.push("🎉✨🥳 Ten-release milestone energy unlocked.");
  }

  if (releaseMajor % 100 === 42) {
    flavorNotes.push(
      "🛸 Don't panic. Keep a towel nearby for this Hitchhiker's Guide to the Galaxy-coded release.",
    );
  }

  if (releaseMajor === 420) {
    flavorNotes.push(
      "🌿🪴🍃 Version 420 arrives with unmistakable plant symbolism.",
    );
  }

  if (releaseMajor === 1312) {
    flavorNotes.push(
      "🚓👮🛡️ Version 1312 carries the requested cop and authority symbols.",
    );
  }

  return flavorNotes;
};

export const createReleaseNotes = (
  version: string,
  changelogSlice: string,
  options: { isFirstRelease?: boolean } = {},
): string => {
  const releaseMajor = parseReleaseMajor(version);
  const flavorNotes = createReleaseFlavorNotes(releaseMajor);
  const sections = [] as string[];

  if (options.isFirstRelease) {
    sections.push(FIRST_RELEASE_WARNING_SECTION);
  }

  sections.push(
    "## Changelog since the previous release",
    changelogSlice.trim(),
  );

  if (flavorNotes.length > 0) {
    sections.push(
      "## Release signals",
      flavorNotes.map((note) => `- ${note}`).join("\n"),
    );
  }

  return sections.join("\n\n").trim();
};
