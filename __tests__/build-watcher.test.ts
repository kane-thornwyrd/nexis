import { expect, test } from "bun:test";

import {
  getRuntimeTarget,
  parseOutfileFromBuildScript,
} from "../build-watcher";

test("parseOutfileFromBuildScript extracts an unquoted outfile path", () => {
  expect(
    parseOutfileFromBuildScript(
      "bun build --compile ./src/server.ts --outfile bin/linux-x64/nexis.x64",
    ),
  ).toBe("./bin/linux-x64/nexis.x64");
});

test("parseOutfileFromBuildScript extracts a quoted outfile path", () => {
  expect(
    parseOutfileFromBuildScript(
      'bun build --compile ./src/server.ts --outfile "bin/darwin-arm64/nexis.arm.app"',
    ),
  ).toBe("./bin/darwin-arm64/nexis.arm.app");
});

test("parseOutfileFromBuildScript preserves explicit Windows-style relative outfile paths", () => {
  expect(
    parseOutfileFromBuildScript(
      "bun build --compile ./src/server.ts --outfile=.\\bin\\windows-x64\\nexis.exe",
    ),
  ).toBe(".\\bin\\windows-x64\\nexis.exe");
});

test("getRuntimeTarget resolves the executable path from the matching build script", () => {
  const runtimeTarget = getRuntimeTarget({
    platform: "linux",
    arch: "x64",
    packageName: "nexis",
    scripts: {
      "subbuild:bin:linux":
        "bun build --compile --target=bun-linux-x64 ./src/server.ts --outfile bin/linux-x64/nexis.x64",
    },
  });

  expect(runtimeTarget).toEqual({
    platform: "linux",
    arch: "x64",
    binaryPath: "./bin/linux-x64/nexis.x64",
    buildScript: "subbuild:bin:linux",
  });
});

test("getRuntimeTarget resolves platform-specific executable suffixes", () => {
  const runtimeTarget = getRuntimeTarget({
    platform: "windows",
    arch: "arm64",
    packageName: "nexis",
    scripts: {
      "subbuild:bin:windows-arm":
        "bun build --compile --target=bun-windows-arm64 ./src/server.ts --outfile bin/windows-arm64/nexis.arm.exe",
    },
  });

  expect(runtimeTarget?.binaryPath).toBe("./bin/windows-arm64/nexis.arm.exe");
  expect(runtimeTarget?.buildScript).toBe("subbuild:bin:windows-arm");
});

test("getRuntimeTarget falls back to the conventional binary path when no outfile is configured", () => {
  const runtimeTarget = getRuntimeTarget({
    platform: "linux",
    arch: "arm64",
    packageName: "nexis",
    scripts: {
      "subbuild:bin:linux-arm":
        "bun build --compile --target=bun-linux-arm64 ./src/server.ts",
    },
  });

  expect(runtimeTarget?.binaryPath).toBe("./bin/linux-arm64/nexis");
  expect(runtimeTarget?.buildScript).toBe("subbuild:bin:linux-arm");
});
