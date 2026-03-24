import { expect, test } from "bun:test";

import { DEFAULT_PORT, parsePort, resolveServerPort } from "@/server-port";

test("parsePort accepts trimmed numeric ports in range", () => {
  expect(parsePort("0")).toBe(0);
  expect(parsePort(" 3000 ")).toBe(3000);
  expect(parsePort("65535")).toBe(65535);
});

test("parsePort rejects invalid numeric input", () => {
  expect(parsePort("")).toBeNull();
  expect(parsePort("abc")).toBeNull();
  expect(parsePort("12.5")).toBeNull();
  expect(parsePort("-1")).toBeNull();
  expect(parsePort("65536")).toBeNull();
});

test("resolveServerPort returns the default when PORT is unset", () => {
  expect(resolveServerPort({ envPort: undefined })).toBe(DEFAULT_PORT);
  expect(resolveServerPort({ defaultPort: 4321, envPort: undefined })).toBe(
    4321,
  );
});

test("resolveServerPort returns the parsed PORT value when valid", () => {
  expect(resolveServerPort({ envPort: "9999" })).toBe(9999);
  expect(resolveServerPort({ envPort: " 1234 " })).toBe(1234);
});

test("resolveServerPort warns and falls back when PORT is invalid", () => {
  const warnings: string[] = [];

  const resolvedPort = resolveServerPort({
    defaultPort: 4321,
    envPort: "not-a-port",
    warn: (message) => {
      warnings.push(message);
    },
  });

  expect(resolvedPort).toBe(4321);
  expect(warnings).toEqual([
    'Ignoring invalid PORT value "not-a-port". Falling back to 4321.',
  ]);
});
