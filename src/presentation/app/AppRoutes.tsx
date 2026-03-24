import { Route, Switch } from "wouter";

import {
  ADMIN_SURFACE_PATH,
  RENDER_SURFACE_CLIENT_PATH,
} from "@/app-route-paths";
import { EmptyDashboardPage } from "@/components/EmptyDashboardPage";
import { EmptyPage } from "@/components/EmptyPage";

export function AppRoutes() {
  return (
    <Switch>
      <Route path={RENDER_SURFACE_CLIENT_PATH}>
        <EmptyPage />
      </Route>
      <Route path={ADMIN_SURFACE_PATH}>
        <EmptyDashboardPage />
      </Route>
    </Switch>
  );
}
