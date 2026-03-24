import { ASSET_OPTIONS, getDeliveryOption } from "@/APITester.shared";
import type { AppState } from "@/app-state/app-state.types";

export const selectBackgroundPreviewState = (appState: AppState) => {
  const draft = appState.demoAdmin;
  const activeAssetLabels = ASSET_OPTIONS.filter((option) => {
    return draft.assetToggles[option.key];
  });

  return {
    activeAssetCount: activeAssetLabels.length,
    assetToggles: draft.assetToggles,
    displayName: draft.displayName,
    notes: draft.notes,
    overlayTitle: draft.overlayTitle,
    selectedDeliveryMode: getDeliveryOption(draft.deliveryMode),
  };
};

export type BackgroundPreviewState = ReturnType<
  typeof selectBackgroundPreviewState
>;
