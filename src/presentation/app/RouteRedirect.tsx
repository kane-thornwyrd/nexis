import { useEffect } from "react";

export function RouteRedirect({ to }: { to: string }) {
  useEffect(() => {
    if (window.location.pathname === to) {
      return;
    }

    window.history.replaceState(window.history.state, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [to]);

  return null;
}