import { Route, Switch } from "wouter";

import {
  ADMIN_ARTS_PATH,
  ADMIN_DATA_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOG_PATH,
  ADMIN_OVERLAY_MANAGER_PATH,
  ADMIN_OVERLAY_STUDIO_CLIENT_PATH,
  ADMIN_PERMISSIONS_PATH,
  ADMIN_PLUGINS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_SURFACE_PATH,
  APP_ROOT_PATH,
  RENDER_SURFACE_CLIENT_PATH,
  STAGING_SURFACE_CLIENT_PATH,
} from "@/app-route-paths";
import { AdminSurface, type AdminView } from "./AdminSurface";
import { OverlaySurface } from "./OverlaySurface";
import { RouteRedirect } from "./RouteRedirect";

const adminViewRoutes: Array<{ path: string; view: AdminView }> = [
  { path: ADMIN_HOME_PATH, view: "start" },
  { path: ADMIN_SETTINGS_PATH, view: "settings" },
  { path: ADMIN_PLUGINS_PATH, view: "plugins" },
  { path: ADMIN_PERMISSIONS_PATH, view: "permissions" },
  { path: ADMIN_OVERLAY_MANAGER_PATH, view: "overlay-manager" },
  { path: ADMIN_DATA_PATH, view: "data-flow" },
  { path: ADMIN_LOG_PATH, view: "history" },
  { path: ADMIN_ARTS_PATH, view: "art-directions" },
];

const overlaySurfaceRoutes = [
  { path: STAGING_SURFACE_CLIENT_PATH, mode: "staging" },
  { path: RENDER_SURFACE_CLIENT_PATH, mode: "render" },
] as const;

export function AppRoutes() {
  return (
    <Switch>
      <Route path={APP_ROOT_PATH}>
        <RouteRedirect to={ADMIN_SURFACE_PATH} />
      </Route>

      <Route path={ADMIN_SURFACE_PATH}>
        <RouteRedirect to={ADMIN_HOME_PATH} />
      </Route>

      {adminViewRoutes.map(({ path, view }) => (
        <Route key={path} path={path}>
          <AdminSurface view={view} />
        </Route>
      ))}

      <Route path={ADMIN_OVERLAY_STUDIO_CLIENT_PATH}>
        {(params) => (
          <AdminSurface view="overlay-studio" overlayId={params.overlayId} />
        )}
      </Route>

      {overlaySurfaceRoutes.map(({ path, mode }) => (
        <Route key={path} path={path}>
          {(params) => <OverlaySurface mode={mode} overlayId={params.overlayId} />}
        </Route>
      ))}
    </Switch>
  );
}
