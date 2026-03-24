import { expect, test } from "bun:test";

import {
  AUTO_RELEASE_COMMIT_INTERVAL,
  collectBinaryAssetPaths,
  createReleaseArchiveFileName,
  createPackageJsonVersionUpdate,
  createReleaseCommitMessage,
  createReleaseFlavorNotes,
  createReleaseNotes,
  extractChangelogSincePreviousRelease,
  hasReachedReleaseCommitThreshold,
  incrementReleaseVersion,
  isReleaseCommitMessage,
  normalizeReleaseAssetPaths,
  resolveReleaseVersion,
} from "../../../scripts/release/release-utils";

test("incrementReleaseVersion bumps only the leading release number", () => {
  expect(incrementReleaseVersion("1.0.0")).toBe("2.0.0");
  expect(incrementReleaseVersion("41.7.9")).toBe("42.0.0");
});

test("resolveReleaseVersion keeps the current version for the first release and increments after that", () => {
  expect(resolveReleaseVersion("1.0.0", null)).toBe("1.0.0");
  expect(resolveReleaseVersion("1.0.0", "v1.0.0")).toBe("2.0.0");
});

test("createPackageJsonVersionUpdate keeps package.json unchanged when the first release reuses the current version", () => {
  const packageJson = {
    name: "nexis",
    private: true,
    version: "1.0.0",
  };

  expect(createPackageJsonVersionUpdate(packageJson, "1.0.0")).toEqual({
    didVersionChange: false,
    serializedPackageJson: `${JSON.stringify(packageJson, null, 2)}\n`,
  });
});

test("createPackageJsonVersionUpdate serializes the bumped version when the release advances", () => {
  const packageJson = {
    name: "nexis",
    private: true,
    version: "1.0.0",
  };
  const versionUpdate = createPackageJsonVersionUpdate(packageJson, "2.0.0");

  expect(versionUpdate.didVersionChange).toBe(true);
  expect(versionUpdate.serializedPackageJson.endsWith("\n")).toBe(true);
  expect(JSON.parse(versionUpdate.serializedPackageJson)).toEqual({
    ...packageJson,
    version: "2.0.0",
  });
});

test("createReleaseCommitMessage keeps the release commit short and skip-ci safe", () => {
  expect(createReleaseCommitMessage("v2.0.0")).toBe("Release v2.0.0 [skip ci]");
});

test("release threshold helpers recognize release commits and the 10-commit boundary", () => {
  expect(isReleaseCommitMessage("Release v2.0.0 [skip ci]")).toBe(true);
  expect(isReleaseCommitMessage("Fix drawer width")).toBe(false);
  expect(
    hasReachedReleaseCommitThreshold(AUTO_RELEASE_COMMIT_INTERVAL - 1),
  ).toBe(false);
  expect(hasReachedReleaseCommitThreshold(AUTO_RELEASE_COMMIT_INTERVAL)).toBe(
    true,
  );
});

test("collectBinaryAssetPaths extracts the configured release assets from binary scripts", () => {
  expect(
    collectBinaryAssetPaths({
      "subbuild:bin:linux":
        "bun build --compile ./src/server.ts --outfile bin/linux-x64/nexis.x64",
      "subbuild:bin:windows":
        "bun build --compile ./src/server.ts --outfile=.\\bin\\windows-x64\\nexis.exe",
      dev: "bun ./build-watcher",
    }),
  ).toEqual(["./bin/linux-x64/nexis.x64", ".\\bin\\windows-x64\\nexis.exe"]);
});

test("collectBinaryAssetPaths de-duplicates repeated asset paths", () => {
  expect(
    collectBinaryAssetPaths({
      "subbuild:bin:darwin":
        "bun build --compile ./src/server.ts --outfile bin/darwin-x64/nexis.app",
      "subbuild:bin:linux":
        "bun build --compile ./src/server.ts --outfile bin/linux-x64/nexis.x64",
      "subbuild:bin:linux-arm":
        "bun build --compile ./src/server.ts --outfile bin/linux-x64/nexis.x64",
    }),
  ).toEqual(["./bin/darwin-x64/nexis.app", "./bin/linux-x64/nexis.x64"]);
});

test("normalizeReleaseAssetPaths trims blank entries and preserves first-seen order", () => {
  expect(
    normalizeReleaseAssetPaths([
      " ./bin/linux-x64/nexis.x64 ",
      "",
      ".\\bin\\windows-x64\\nexis.exe",
      "./bin/linux-x64/nexis.x64",
      " .\\bin\\windows-x64\\nexis.exe ",
    ]),
  ).toEqual(["./bin/linux-x64/nexis.x64", ".\\bin\\windows-x64\\nexis.exe"]);
});

test("createReleaseArchiveFileName maps blocked executable filenames to safe archive names", () => {
  expect(createReleaseArchiveFileName("./bin/darwin-x64/nexis.app")).toBe(
    "darwin-x64-nexis.tar.gz",
  );
  expect(createReleaseArchiveFileName("./bin/windows-x64/nexis.exe")).toBe(
    "windows-x64-nexis.tar.gz",
  );
  expect(
    createReleaseArchiveFileName(".\\bin\\windows-arm64\\nexis.arm.exe"),
  ).toBe("windows-arm64-nexis.tar.gz");
});

test("extractChangelogSincePreviousRelease returns the top changelog slice added since the previous release", () => {
  const previousChangelog = `# CHANGELOG\n\nIntro\n\n### 2026-03-23\n- Older item\n`;
  const currentChangelog = `# CHANGELOG\n\nIntro\n\n### 2026-03-24\n- New item\n\n### 2026-03-23\n- Older item\n`;

  expect(
    extractChangelogSincePreviousRelease(currentChangelog, previousChangelog),
  ).toBe(`### 2026-03-24\n- New item`);
});

test("extractChangelogSincePreviousRelease ignores trailing newline drift between git and working tree copies", () => {
  const previousChangelog = `# CHANGELOG\n\nIntro\n\n### 2026-03-23\n- Older item`;
  const currentChangelog = `# CHANGELOG\n\nIntro\n\n### 2026-03-24\n- New item\n\n### 2026-03-23\n- Older item\n`;

  expect(
    extractChangelogSincePreviousRelease(currentChangelog, previousChangelog),
  ).toBe(`### 2026-03-24\n- New item`);
});

test("extractChangelogSincePreviousRelease returns all changelog entries when no previous release exists", () => {
  const currentChangelog = `# CHANGELOG\n\nIntro\n\n### 2026-03-24\n- New item\n\n### 2026-03-23\n- Older item\n`;

  expect(extractChangelogSincePreviousRelease(currentChangelog, null)).toBe(
    `### 2026-03-24\n- New item\n\n### 2026-03-23\n- Older item`,
  );
});

test("createReleaseFlavorNotes adds the requested milestone and themed notes", () => {
  expect(createReleaseFlavorNotes(10)).toContain(
    "🎉✨🥳 Ten-release milestone energy unlocked.",
  );
  expect(createReleaseFlavorNotes(42)[0]).toContain("Don't panic");
  expect(createReleaseFlavorNotes(420)).toEqual([
    "🎉✨🥳 Ten-release milestone energy unlocked.",
    "🌿🪴🍃 Version 420 arrives with unmistakable plant symbolism.",
  ]);
  expect(createReleaseFlavorNotes(1312)[0]).toContain("🚓👮🛡️");
});

test("createReleaseNotes combines changelog content and flavor notes", () => {
  expect(createReleaseNotes("42.0.0", "### 2026-03-24\n- New item")).toBe(
    [
      "## Changelog since the previous release",
      "",
      "### 2026-03-24",
      "- New item",
      "",
      "## Release signals",
      "",
      "- 🛸 Don't panic. Keep a towel nearby for this Hitchhiker's Guide to the Galaxy-coded release.",
    ].join("\n"),
  );
});

test("createReleaseNotes prepends a loud warning for the first release", () => {
  expect(
    createReleaseNotes("1.0.0", "### 2026-03-24\n- New item", {
      isFirstRelease: true,
    }),
  ).toContain("## WARNING: FIRST RELEASE ONLY");
  expect(
    createReleaseNotes("1.0.0", "### 2026-03-24\n- New item", {
      isFirstRelease: true,
    }),
  ).toContain("Nothing in this release should be treated as usable");
});
