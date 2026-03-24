import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "bun";

import {
  createReleaseArchiveFileName,
  normalizeReleaseAssetPaths,
} from "./release-utils";

const repoRoot = process.cwd();
const releaseOutputDirectory = path.join(repoRoot, ".github", ".release");
const sourceAssetListPath = path.join(releaseOutputDirectory, "assets.txt");
const uploadAssetDirectory = path.join(releaseOutputDirectory, "upload-assets");
const uploadAssetListPath = path.join(
  releaseOutputDirectory,
  "upload-assets.txt",
);

const readAssetPaths = (): string[] => {
  if (!existsSync(sourceAssetListPath)) {
    return [];
  }

  return normalizeReleaseAssetPaths(
    readFileSync(sourceAssetListPath, "utf8").split("\n"),
  );
};

const createArchive = (sourceAssetPath: string, archivePath: string) => {
  const resolvedSourcePath = path.resolve(repoRoot, sourceAssetPath);

  if (!existsSync(resolvedSourcePath)) {
    throw new Error(
      `Release asset ${JSON.stringify(sourceAssetPath)} does not exist.`,
    );
  }

  const result = spawnSync(
    [
      "tar",
      "-czf",
      archivePath,
      "-C",
      path.dirname(resolvedSourcePath),
      path.basename(resolvedSourcePath),
    ],
    {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  if (result.exitCode !== 0) {
    throw new Error(
      result.stderr.toString().trim() ||
        `Unable to archive ${sourceAssetPath}.`,
    );
  }
};

const sourceAssetPaths = readAssetPaths();
mkdirSync(uploadAssetDirectory, { recursive: true });

const uploadAssetPaths = sourceAssetPaths.map((sourceAssetPath) => {
  const archivePath = path.join(
    uploadAssetDirectory,
    createReleaseArchiveFileName(sourceAssetPath),
  );

  createArchive(sourceAssetPath, archivePath);

  return archivePath;
});

writeFileSync(
  uploadAssetListPath,
  uploadAssetPaths.length > 0 ? `${uploadAssetPaths.join("\n")}\n` : "",
);

console.log(`Packaged ${uploadAssetPaths.length} release assets for upload.`);
