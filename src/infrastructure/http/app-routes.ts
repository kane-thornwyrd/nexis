import {
  ADMIN_SURFACE_PATH,
  RENDER_SURFACE_SERVER_PATH,
} from "@/app-route-paths";
import { configRoutes } from "./config-routes";

const hasHeaderProperty = (
  request: unknown,
): request is {
  header: unknown;
} => {
  return request !== null && typeof request === "object" && "header" in request;
};

const getHelloRouteRequestHeader = (request: unknown) => {
  return hasHeaderProperty(request) ? request.header : undefined;
};

export const createAppRoutes = <RouteAsset>(indexHTML: RouteAsset) => ({
  ...configRoutes,
  [ADMIN_SURFACE_PATH]: indexHTML,
  [RENDER_SURFACE_SERVER_PATH]: indexHTML,
  "/api/hello": {
    GET: () => Response.json({ ok: "List posts" }),
    PUT: (request: unknown) => {
      console.log(request);
      return Response.json({
        created: true,
        body: getHelloRouteRequestHeader(request),
      });
    },
  },
});
