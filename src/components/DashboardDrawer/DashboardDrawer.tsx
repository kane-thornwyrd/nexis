import { IconArrowRight } from "@tabler/icons-react";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

import { useDashboardDrawer } from "./useDashboardDrawer";

import Logo from "../../logo.square.svg";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

type DashboardDrawerContextValue = {
  dashboardOpen: boolean;
};

type InertableElement = HTMLDivElement & {
  inert?: boolean;
};

const DashboardDrawerContext =
  createContext<DashboardDrawerContextValue | null>(null);

type DashboardDrawerSlotProps = {
  children: ReactNode;
};

type DashboardDrawerProps = DashboardDrawerSlotProps & {
  closeLabel?: string;
  handleLabel?: string;
  openLabel?: string;
  panelId?: string;
};

function splitDashboardDrawerChildren(children: ReactNode) {
  let background: ReactNode = null;
  let panel: ReactNode = null;
  const fallbackPanelChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (
      isValidElement<DashboardDrawerSlotProps>(child) &&
      child.type === DashboardDrawerBackground
    ) {
      background = child.props.children;
      return;
    }

    if (
      isValidElement<DashboardDrawerSlotProps>(child) &&
      child.type === DashboardDrawerPanel
    ) {
      panel = child.props.children;
      return;
    }

    fallbackPanelChildren.push(child);
  });

  return {
    background,
    panel:
      panel ??
      (fallbackPanelChildren.length > 0 ? fallbackPanelChildren : null),
  };
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => {
    if (element.tabIndex < 0) {
      return false;
    }

    if (element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    return element.getClientRects().length > 0;
  });
}

export function useDashboardDrawerContext() {
  const context = useContext(DashboardDrawerContext);

  if (!context) {
    throw new Error(
      "useDashboardDrawerContext must be used inside DashboardDrawer.",
    );
  }

  return context;
}

export function DashboardDrawerBackground({
  children,
}: DashboardDrawerSlotProps) {
  return <>{children}</>;
}

export function DashboardDrawerPanel({ children }: DashboardDrawerSlotProps) {
  return <>{children}</>;
}

export function DashboardDrawer({
  children,
  closeLabel = "Hide",
  handleLabel = undefined,
  openLabel = "Show",
  panelId,
}: DashboardDrawerProps) {
  const generatedPanelId = useId();
  const resolvedPanelId =
    panelId ?? `dashboard-drawer-${generatedPanelId.replaceAll(":", "")}`;
  const { closeDashboard, dashboardOpen, toggleDashboard } =
    useDashboardDrawer();
  const backgroundRef = useRef<InertableElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(dashboardOpen);
  const { background, panel } = splitDashboardDrawerChildren(children);

  useEffect(() => {
    if (wasOpenRef.current && !dashboardOpen) {
      handleRef.current?.focus();
    }

    wasOpenRef.current = dashboardOpen;
  }, [dashboardOpen]);

  useEffect(() => {
    const backgroundElement = backgroundRef.current;

    if (!backgroundElement || !("inert" in backgroundElement)) {
      return;
    }

    backgroundElement.inert = dashboardOpen;

    return () => {
      backgroundElement.inert = false;
    };
  }, [dashboardOpen]);

  useEffect(() => {
    if (!dashboardOpen) {
      return;
    }

    const frameElement = frameRef.current;

    if (!frameElement) {
      return;
    }

    const focusFirstElement = () => {
      const focusableElements = getFocusableElements(frameElement);
      const firstFocusableElement = focusableElements[0];

      if (firstFocusableElement) {
        firstFocusableElement.focus();
        return;
      }

      frameElement.focus();
    };

    if (!frameElement.contains(document.activeElement)) {
      focusFirstElement();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(frameElement);

      if (focusableElements.length === 0) {
        event.preventDefault();
        frameElement.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0]!;
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1]!;
      const activeElement = document.activeElement as HTMLElement | null;

      if (!activeElement || !frameElement.contains(activeElement)) {
        event.preventDefault();

        if (event.shiftKey) {
          lastFocusableElement.focus();
          return;
        }

        firstFocusableElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;

      if (target instanceof Node && !frameElement.contains(target)) {
        focusFirstElement();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [dashboardOpen]);

  return (
    <DashboardDrawerContext.Provider value={{ dashboardOpen }}>
      <div className="dashboard-stage">
        <div
          className="dashboard-stage__scrim"
          data-open={dashboardOpen ? "true" : "false"}
          aria-hidden="true"
          onClick={closeDashboard}
        />

        <div
          ref={backgroundRef}
          className="dashboard-stage__background"
          aria-hidden={dashboardOpen}
        >
          {background}
        </div>

        <aside
          className="dashboard-drawer"
          data-open={dashboardOpen ? "true" : "false"}
        >
          <div
            ref={frameRef}
            className="dashboard-drawer__frame"
            role={dashboardOpen ? "dialog" : undefined}
            aria-modal={dashboardOpen || undefined}
            aria-label={dashboardOpen ? handleLabel : undefined}
            tabIndex={-1}
          >
            <div
              id={resolvedPanelId}
              className="dashboard-drawer__surface"
              data-open={dashboardOpen ? "true" : "false"}
              aria-hidden={!dashboardOpen}
            >
              <div className="dashboard-drawer__scroller">{panel}</div>
            </div>

            <button
              ref={handleRef}
              type="button"
              className="dashboard-drawer__handle"
              aria-controls={resolvedPanelId}
              aria-expanded={dashboardOpen}
              onClick={toggleDashboard}
            >
              <IconArrowRight className="dashboard-drawer__handle-chevron" />
              <img src={Logo} alt="Logo" />
              <span className="dashboard-drawer__handle-status">NEXIS</span>
            </button>
          </div>
        </aside>
      </div>
    </DashboardDrawerContext.Provider>
  );
}
