import { expect, test } from "bun:test";

import pkg from "../../../../package.json";

import { createAppRoutes } from "@/infrastructure/http/app-routes";

test("createAppRoutes keeps the active SPA routes and config endpoint together", async () => {
  const indexHTML = { html: true };
  const routes = createAppRoutes(indexHTML);

  expect(routes["/"]).toBe(indexHTML);
  expect(routes["/render/*"]).toBe(indexHTML);
  expect("/demo" in routes).toBe(false);

  const configRoute = routes["/config.json"];

  const firstResponse = await configRoute.GET().json();
  const secondResponse = await configRoute.GET().json();

  expect(firstResponse).toEqual({
    name: pkg.name,
    ...pkg.serverConfig,
  });
  expect(secondResponse).toEqual(firstResponse);
});
