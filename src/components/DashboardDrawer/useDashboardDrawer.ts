import { useEffect, useState } from "react";

export function useDashboardDrawer() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  useEffect(() => {
    if (!dashboardOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setDashboardOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dashboardOpen]);

  const closeDashboard = () => {
    setDashboardOpen(false);
  };

  const toggleDashboard = () => {
    setDashboardOpen((currentValue) => !currentValue);
  };

  return {
    closeDashboard,
    dashboardOpen,
    toggleDashboard,
  };
}
