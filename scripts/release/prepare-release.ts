import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "bun";

import {
  collectBinaryAssetPaths,
  createPackageJsonVersionUpdate,
  createReleaseCommitMessage,
  createReleaseNotes,
  extractChangelogSincePreviousRelease,
  resolveReleaseVersion,
} from "./release-utils";

type PackageJson = {
  name: string;
  version: string;
  scripts?: Partial<Record<string, string>>;
};

type ReleaseMetadata = {
  commitMessage: string;
  version: string;
  tag: string;
  previousTag: string | null;
  isFirstRelease: boolean;
  assetPaths: string[];
};

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, "package.json");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const releaseOutputDirectory = path.join(repoRoot, ".github", ".release");

const readJsonFile = <T>(filePath: string): T => {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
};

const runGit = (args: string[]): string => {
  const result = spawnSync(["git", ...args], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(
      stderr ||
        `git ${args.join(" ")} failed with exit code ${result.exitCode}.`,
    );
  }

  return result.stdout.toString().trim();
};

const tryRunGit = (args: string[]): string | null => {
  try {
    return runGit(args);
  } catch {
    return null;
  }
};

const getLatestReleaseTag = (): string | null => {
  const tags = tryRunGit(["tag", "--list", "v*", "--sort=-version:refname"]);

  if (!tags) {
    return null;
  }

  return (
    tags
      .split("\n")
      .map((tag) => tag.trim())
      .find(Boolean) ?? null
  );
};

const readPreviousReleaseChangelog = (tag: string | null): string | null => {
  if (!tag) {
    return null;
  }

  return tryRunGit(["show", `${tag}:CHANGELOG.md`]);
};

const writeReleaseArtifact = (fileName: string, contents: string) => {
  writeFileSync(path.join(releaseOutputDirectory, fileName), contents);
};

const createLineSeparatedFileContents = (lines: readonly string[]): string => {
  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
};

const withTrailingNewline = (value: string): string => `${value}\n`;

const createReleaseArtifacts = (
  metadata: ReleaseMetadata,
  releaseNotes: string,
) => {
  return {
    "version.txt": withTrailingNewline(metadata.version),
    "tag.txt": withTrailingNewline(metadata.tag),
    "commit-message.txt": withTrailingNewline(metadata.commitMessage),
    "release-notes.md": withTrailingNewline(releaseNotes),
    "assets.txt": createLineSeparatedFileContents(metadata.assetPaths),
    "release.json": `${JSON.stringify(metadata, null, 2)}\n`,
  } satisfies Record<string, string>;
};

const packageJson = readJsonFile<PackageJson>(packageJsonPath);
const previousTag = getLatestReleaseTag();
const isFirstRelease = previousTag === null;
const nextVersion = resolveReleaseVersion(packageJson.version, previousTag);
const nextTag = `v${nextVersion}`;
const commitMessage = createReleaseCommitMessage(nextTag);
const currentChangelog = readFileSync(changelogPath, "utf8");
const previousChangelog = readPreviousReleaseChangelog(previousTag);
const changelogSlice = extractChangelogSincePreviousRelease(
  currentChangelog,
  previousChangelog,
);
const releaseNotes = createReleaseNotes(nextVersion, changelogSlice, {
  isFirstRelease,
});
const assetPaths = collectBinaryAssetPaths(packageJson.scripts ?? {});
const releaseMetadata: ReleaseMetadata = {
  commitMessage,
  version: nextVersion,
  tag: nextTag,
  previousTag,
  isFirstRelease,
  assetPaths,
};
const releaseArtifacts = createReleaseArtifacts(releaseMetadata, releaseNotes);
const packageJsonVersionUpdate = createPackageJsonVersionUpdate(
  packageJson,
  nextVersion,
);

if (packageJsonVersionUpdate.didVersionChange) {
  writeFileSync(
    packageJsonPath,
    packageJsonVersionUpdate.serializedPackageJson,
  );
}

mkdirSync(releaseOutputDirectory, { recursive: true });
for (const [fileName, contents] of Object.entries(releaseArtifacts)) {
  writeReleaseArtifact(fileName, contents);
}

console.log(
  `Prepared ${releaseMetadata.tag} with ${releaseMetadata.assetPaths.length} release assets.`,
);
