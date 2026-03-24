import pkg from "../package.json";

export default {
  "/config.json": Response.json({
    ...{ name: pkg.name },
    ...pkg.serverConfig,
  }),
};
