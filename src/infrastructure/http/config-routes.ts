import pkg from "../../../package.json";

const createConfigResponse = () =>
  Response.json({
    name: pkg.name,
    ...pkg.serverConfig,
  });

export const configRoutes = {
  "/config.json": {
    GET: createConfigResponse,
  },
} as const;

export default configRoutes;
