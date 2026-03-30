export type OverlayPublicationState = "draft" | "staged" | "live";
export type OverlayFormat = "landscape" | "portrait";
export type ValidationIssueLevel = "warning" | "error" | "blocking";
export type ValidationIssueScope = "form" | "data-flow" | "overlay" | "system";

export type ValidationIssue = {
  id: string;
  level: ValidationIssueLevel;
  scope: ValidationIssueScope;
  title: string;
  description: string;
};

export type OverlayWidgetKind = "chat" | "support" | "now-playing";

export type OverlayWidget = {
  id: string;
  kind: OverlayWidgetKind;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  accent: string;
  values: string[];
};

export type OverlayRecord = {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  publicationState: OverlayPublicationState;
  background: string;
  widgets: OverlayWidget[];
};

export type OverlayRecordPatch = Partial<
  Pick<OverlayRecord, "background" | "description" | "height" | "name" | "width">
>;

export type NexisProjectState = {
  projectId: string;
  projectName: string;
  overlays: OverlayRecord[];
  dataFlowIssues: ValidationIssue[];
};

export type NexisProjectAction =
  | {
      type: "projectRenamed";
      name: string;
    }
  | {
      type: "overlayAdded";
      overlay: OverlayRecord;
    }
  | {
      type: "overlayUpdated";
      overlayId: string;
      patch: OverlayRecordPatch;
    }
  | {
      type: "overlayPublicationChanged";
      overlayId: string;
      publicationState: OverlayPublicationState;
    };

export const NEXIS_PROJECT_STORAGE_KEY = "nexis.project.v1";
export const DEFAULT_OVERLAY_WIDTH = 1920;
export const DEFAULT_OVERLAY_HEIGHT = 1080;

const SAMPLE_OVERLAYS: OverlayRecord[] = [
  {
    id: "overlay-1",
    name: "Stream Command Center",
    description:
      "A landscape control overlay for chat, music, and live support moments.",
    width: 1920,
    height: 1080,
    publicationState: "live",
    background:
      "linear-gradient(135deg, rgba(5, 7, 17, 0.96), rgba(20, 24, 38, 0.98))",
    widgets: [
      {
        id: "overlay-1-widget-chat",
        kind: "chat",
        title: "Unified chat",
        subtitle: "Twitch + YouTube routed through one sample retriever",
        x: 4,
        y: 10,
        width: 34,
        accent: "#67e8f9",
        values: ["kanethornwyrd: welcome in", "guest_artist: starting soon"],
      },
      {
        id: "overlay-1-widget-now-playing",
        kind: "now-playing",
        title: "Now playing",
        subtitle: "Local media watcher sample data source",
        x: 61,
        y: 12,
        width: 27,
        accent: "#f9a8d4",
        values: ["Signal Bloom", "by North Pixel"],
      },
      {
        id: "overlay-1-widget-support",
        kind: "support",
        title: "Support ribbon",
        subtitle: "Donation and follow events",
        x: 57,
        y: 67,
        width: 31,
        accent: "#fcd34d",
        values: ["Recent: 5 EUR", "Goal: 61%"],
      },
    ],
  },
  {
    id: "overlay-2",
    name: "Portrait Companion",
    description:
      "A portrait companion overlay for vertical layouts and short-form testing.",
    width: 1080,
    height: 1920,
    publicationState: "staged",
    background:
      "linear-gradient(180deg, rgba(11, 17, 35, 0.98), rgba(36, 13, 51, 0.98))",
    widgets: [
      {
        id: "overlay-2-widget-chat",
        kind: "chat",
        title: "Compact chat",
        subtitle: "Portrait-safe chat stack",
        x: 8,
        y: 8,
        width: 52,
        accent: "#a5b4fc",
        values: ["hello vertical world", "testing fake events"],
      },
      {
        id: "overlay-2-widget-support",
        kind: "support",
        title: "Recent support",
        subtitle: "Waiting on donation scraper setup",
        x: 11,
        y: 74,
        width: 46,
        accent: "#fb7185",
        values: ["No live source yet", "Use fake events to preview"],
      },
    ],
  },
];

const SAMPLE_DATA_FLOW_ISSUES: ValidationIssue[] = [
  {
    id: "issue-youtube-auth",
    level: "warning",
    scope: "data-flow",
    title: "YouTube chat remains optional in the sample retriever.",
    description:
      "The unified chat demo still renders with Twitch only, but the multistream path is incomplete.",
  },
  {
    id: "issue-donations-source",
    level: "blocking",
    scope: "data-flow",
    title: "The support ribbon has no live donation scraper yet.",
    description:
      "Keep using fake events in this first slice until a real payment adapter is wired in.",
  },
];

export const DEFAULT_NEXIS_PROJECT_STATE: NexisProjectState = {
  projectId: "nexis-local-project",
  projectName: "NEXIS Project",
  overlays: SAMPLE_OVERLAYS,
  dataFlowIssues: SAMPLE_DATA_FLOW_ISSUES,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const isOverlayRecord = (value: unknown): value is OverlayRecord => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.width === "number" &&
    typeof value.height === "number" &&
    typeof value.publicationState === "string" &&
    typeof value.background === "string" &&
    Array.isArray(value.widgets)
  );
};

const isNexisProjectState = (value: unknown): value is NexisProjectState => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.projectId === "string" &&
    typeof value.projectName === "string" &&
    Array.isArray(value.overlays) &&
    value.overlays.every(isOverlayRecord) &&
    Array.isArray(value.dataFlowIssues)
  );
};

const getProjectStorage = (): Pick<Storage, "getItem" | "setItem"> | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const getOverlayFormat = (
  width: number,
  height: number,
): OverlayFormat => {
  return width >= height ? "landscape" : "portrait";
};

export const createOverlayRecord = (overlays: OverlayRecord[]): OverlayRecord => {
  const nextIndex = overlays.length + 1;
  const overlayId = `overlay-${nextIndex}`;

  return {
    id: overlayId,
    name: `Overlay ${nextIndex}`,
    description: "A fresh overlay ready for layout and widget wiring.",
    width: DEFAULT_OVERLAY_WIDTH,
    height: DEFAULT_OVERLAY_HEIGHT,
    publicationState: "draft",
    background:
      "linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(30, 41, 59, 0.96))",
    widgets: [
      {
        id: `${overlayId}-widget-placeholder`,
        kind: "chat",
        title: "Fresh canvas",
        subtitle: "Drop the first widget here in the next pass",
        x: 10,
        y: 12,
        width: 34,
        accent: "#93c5fd",
        values: ["No bound data flow yet", "Use the sample overlay studio"],
      },
    ],
  };
};

const mapOverlayRecordById = (
  overlays: OverlayRecord[],
  overlayId: string,
  updateRecord: (overlay: OverlayRecord) => OverlayRecord,
) => {
  return overlays.map((overlay) =>
    overlay.id === overlayId ? updateRecord(overlay) : overlay,
  );
};

export const nexisProjectReducer = (
  state: NexisProjectState,
  action: NexisProjectAction,
): NexisProjectState => {
  switch (action.type) {
    case "projectRenamed":
      return {
        ...state,
        projectName: action.name,
      };

    case "overlayAdded":
      return {
        ...state,
        overlays: [...state.overlays, action.overlay],
      };

    case "overlayUpdated":
      return {
        ...state,
        overlays: mapOverlayRecordById(state.overlays, action.overlayId, (overlay) => ({
          ...overlay,
          ...action.patch,
        })),
      };

    case "overlayPublicationChanged":
      return {
        ...state,
        overlays: mapOverlayRecordById(state.overlays, action.overlayId, (overlay) => ({
          ...overlay,
          publicationState: action.publicationState,
        })),
      };

    default:
      return state;
  }
};

export const readStoredProjectState = (
  storage: Pick<Storage, "getItem" | "setItem"> | null = getProjectStorage(),
): NexisProjectState => {
  if (!storage) {
    return DEFAULT_NEXIS_PROJECT_STATE;
  }

  try {
    const rawState = storage.getItem(NEXIS_PROJECT_STORAGE_KEY);

    if (!rawState) {
      return DEFAULT_NEXIS_PROJECT_STATE;
    }

    const parsedState = JSON.parse(rawState) as unknown;

    if (!isNexisProjectState(parsedState)) {
      return DEFAULT_NEXIS_PROJECT_STATE;
    }

    return parsedState;
  } catch {
    return DEFAULT_NEXIS_PROJECT_STATE;
  }
};

export const persistProjectState = (
  state: NexisProjectState,
  storage: Pick<Storage, "getItem" | "setItem"> | null = getProjectStorage(),
) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(NEXIS_PROJECT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures in the first incomplete slice.
  }
};