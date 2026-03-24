import {
  DEFAULT_ASSET_TOGGLES,
  DEFAULT_DELIVERY_MODE,
  DEFAULT_DISPLAY_NAME,
  DEFAULT_NOTES,
  DEFAULT_OVERLAY_TITLE,
  type AssetToggleKey,
  type AssetToggleState,
  type DeliveryMode,
} from "@/APITester.shared";

export type DemoAdminDraft = Readonly<{
  displayName: string;
  overlayTitle: string;
  notes: string;
  deliveryMode: DeliveryMode;
  assetToggles: AssetToggleState;
}>;

export type AppState = Readonly<{
  demoAdmin: DemoAdminDraft;
}>;

export type AppCommandRequest =
  | { type: "demoAdmin.displayName.set"; value: string }
  | { type: "demoAdmin.overlayTitle.set"; value: string }
  | { type: "demoAdmin.notes.set"; value: string }
  | { type: "demoAdmin.deliveryMode.set"; value: DeliveryMode }
  | {
      type: "demoAdmin.assetToggle.set";
      assetKey: AssetToggleKey;
      checked: boolean;
    }
  | { type: "demoAdmin.draft.reset" }
  | { type: "history.undo" };

export type AppCommand =
  | { type: "app.bootstrap.requested"; draft: DemoAdminDraft }
  | { type: "demoAdmin.displayName.set"; value: string }
  | { type: "demoAdmin.overlayTitle.set"; value: string }
  | { type: "demoAdmin.notes.set"; value: string }
  | { type: "demoAdmin.deliveryMode.set"; value: DeliveryMode }
  | {
      type: "demoAdmin.assetToggle.set";
      assetKey: AssetToggleKey;
      checked: boolean;
    }
  | { type: "demoAdmin.draft.reset" }
  | { type: "history.undo"; targetEventId: string };

type AppEventBase = Readonly<{
  eventId: string;
}>;

export type AppEvent =
  | (AppEventBase & {
      type: "app.bootstrapped";
      draft: DemoAdminDraft;
    })
  | (AppEventBase & {
      type: "demoAdmin.displayName.set";
      previousValue: string;
      nextValue: string;
    })
  | (AppEventBase & {
      type: "demoAdmin.overlayTitle.set";
      previousValue: string;
      nextValue: string;
    })
  | (AppEventBase & {
      type: "demoAdmin.notes.set";
      previousValue: string;
      nextValue: string;
    })
  | (AppEventBase & {
      type: "demoAdmin.deliveryMode.set";
      previousValue: DeliveryMode;
      nextValue: DeliveryMode;
    })
  | (AppEventBase & {
      type: "demoAdmin.assetToggle.set";
      assetKey: AssetToggleKey;
      previousChecked: boolean;
      nextChecked: boolean;
    })
  | (AppEventBase & {
      type: "demoAdmin.draft.reset";
      previousDraft: DemoAdminDraft;
      nextDraft: DemoAdminDraft;
    });

export type UndoableAppEvent = Exclude<AppEvent, { type: "app.bootstrapped" }>;

export type HistoryEntry = Readonly<{
  timestamp: string;
  event: AppEvent;
  commands: readonly AppCommand[];
}>;

export type HistoryMetadataFactory = {
  createEventId: () => string;
  createTimestamp: () => string;
};

export type AppStateActions = {
  setDisplayName: (value: string) => void;
  setOverlayTitle: (value: string) => void;
  setNotes: (value: string) => void;
  setDeliveryMode: (value: DeliveryMode) => void;
  setAssetToggle: (assetKey: AssetToggleKey, checked: boolean) => void;
  resetDraft: () => void;
  undoLastChange: () => void;
};

export const cloneAssetToggles = (
  assetToggles: AssetToggleState,
): AssetToggleState => ({
  ...assetToggles,
});

export const cloneDemoAdminDraft = (draft: DemoAdminDraft): DemoAdminDraft => ({
  displayName: draft.displayName,
  overlayTitle: draft.overlayTitle,
  notes: draft.notes,
  deliveryMode: draft.deliveryMode,
  assetToggles: cloneAssetToggles(draft.assetToggles),
});

export const createDefaultDemoAdminDraft = (): DemoAdminDraft => ({
  displayName: DEFAULT_DISPLAY_NAME,
  overlayTitle: DEFAULT_OVERLAY_TITLE,
  notes: DEFAULT_NOTES,
  deliveryMode: DEFAULT_DELIVERY_MODE,
  assetToggles: cloneAssetToggles(DEFAULT_ASSET_TOGGLES),
});

export const createInitialAppState = (): AppState => ({
  demoAdmin: createDefaultDemoAdminDraft(),
});
