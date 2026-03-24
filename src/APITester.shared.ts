import {
  IconBrowserCheck,
  IconDeviceDesktopAnalytics,
  IconLayoutGrid,
} from "@tabler/icons-react";

export type DeliveryMode = "browser" | "hybrid" | "monitoring";
export type AssetToggleKey = "desktopSync" | "incidentLatch" | "archiveSignals";
export type AssetToggleState = Readonly<Record<AssetToggleKey, boolean>>;

export const DEFAULT_DISPLAY_NAME = "Studio overlay";
export const DEFAULT_OVERLAY_TITLE = "NEXIS live status";
export const DEFAULT_NOTES =
  "Use this surface to preview the current Mira preset across cards, tabs, badges, buttons, radios, and your protected checkbox assets.";
export const DEFAULT_DELIVERY_MODE: DeliveryMode = "browser";

export const THEME_BADGES = [
  "Neutral base",
  "Purple theme",
  "Lime charts",
  "Tabler icons",
  "Geist + Geist Mono",
  "No radius",
] as const;

export const CHART_SWATCHES = [
  { label: "Signal 01", variable: "--chart-1" },
  { label: "Signal 02", variable: "--chart-2" },
  { label: "Signal 03", variable: "--chart-3" },
  { label: "Signal 04", variable: "--chart-4" },
  { label: "Signal 05", variable: "--chart-5" },
] as const;

export const DELIVERY_OPTIONS = [
  {
    description: "Keep adjustments browser-first for fast operator changes.",
    icon: IconBrowserCheck,
    id: "delivery-browser",
    label: "Browser-first",
    value: "browser",
  },
  {
    description: "Blend the page preview with a compact handoff workflow.",
    icon: IconLayoutGrid,
    id: "delivery-hybrid",
    label: "Hybrid handoff",
    value: "hybrid",
  },
  {
    description: "Bias the screen toward monitoring and telemetry review.",
    icon: IconDeviceDesktopAnalytics,
    id: "delivery-monitoring",
    label: "Monitoring",
    value: "monitoring",
  },
] as const satisfies readonly {
  description: string;
  icon: typeof IconBrowserCheck;
  id: string;
  label: string;
  value: DeliveryMode;
}[];

export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

export const getDeliveryOption = (
  deliveryMode: DeliveryMode,
): DeliveryOption => {
  return (
    DELIVERY_OPTIONS.find((option) => option.value === deliveryMode) ??
    DELIVERY_OPTIONS[0]
  );
};

export const countActiveAssets = (assetToggles: AssetToggleState) => {
  return Object.values(assetToggles).filter(Boolean).length;
};

export const DEFAULT_ASSET_TOGGLES: AssetToggleState = {
  archiveSignals: true,
  desktopSync: true,
  incidentLatch: false,
};

export const ASSET_OPTIONS = [
  {
    fieldcode: "asset-desktop-sync",
    key: "desktopSync",
    label: "Desktop sync arm",
  },
  {
    fieldcode: "asset-incident-latch",
    key: "incidentLatch",
    label: "Incident latch",
  },
  {
    fieldcode: "asset-archive-signals",
    key: "archiveSignals",
    label: "Archive signal trail",
  },
] as const satisfies readonly {
  fieldcode: string;
  key: AssetToggleKey;
  label: string;
}[];

export const RECENT_SIGNALS = [
  {
    detail:
      "Typography scale is routed through the shared HTML root toggle group.",
    title: "Scale preview synced",
  },
  {
    detail:
      "The overlay now boots directly into the fixed dark theme across every route.",
    title: "Dark theme locked",
  },
  {
    detail:
      "Checkbox assets remain protected while the rest of the UI leans on shadcn.",
    title: "Custom asset lane preserved",
  },
] as const;
