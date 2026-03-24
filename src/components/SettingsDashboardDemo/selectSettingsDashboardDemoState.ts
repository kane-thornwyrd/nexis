import { countActiveAssets, getDeliveryOption } from "@/APITester.shared";
import type { AppState } from "@/app-state/app-state.types";

export const selectSettingsDashboardDemoState = (appState: AppState) => {
  const draft = appState.demoAdmin;

  return {
    activeAssetCount: countActiveAssets(draft.assetToggles),
    assetToggles: draft.assetToggles,
    deliveryMode: draft.deliveryMode,
    displayName: draft.displayName,
    notes: draft.notes,
    overlayTitle: draft.overlayTitle,
    selectedDeliveryMode: getDeliveryOption(draft.deliveryMode),
  };
};

export type SettingsDashboardDemoState = ReturnType<
  typeof selectSettingsDashboardDemoState
>;
