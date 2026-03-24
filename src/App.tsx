import { APITester } from "./APITester";
import { EmptyDashboardPage } from "./components/EmptyDashboardPage";
import { EmptyPage } from "./components/EmptyPage";
import "./index.css";
import { Route, Switch } from "wouter";

export function App() {
  return (
    <Switch>
      <Route path="/render/:mode?">
        <EmptyPage />
      </Route>
      <Route path="/demo">
        <APITester />
      </Route>
      <Route path="/">
        <EmptyDashboardPage />
      </Route>
    </Switch>
  );
}
