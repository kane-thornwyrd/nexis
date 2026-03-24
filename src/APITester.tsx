import { useAppState } from "@/app-state/useAppState";
import { BackgroundPreview } from "./components/BackgroundPreview";
import { selectBackgroundPreviewState } from "./components/BackgroundPreview";
import {
  DashboardDrawer,
  DashboardDrawerBackground,
  DashboardDrawerPanel,
} from "./components/DashboardDrawer";
import { SettingsDashboardContent } from "./components/SettingsDashboardContent";
import { SettingsDashboardDemo } from "./components/SettingsDashboardDemo";
import { selectSettingsDashboardDemoState } from "./components/SettingsDashboardDemo";

export function APITester() {
  const { actions, appState, canUndo } = useAppState();
  const backgroundPreviewState = selectBackgroundPreviewState(appState);
  const settingsDashboardDemoState = selectSettingsDashboardDemoState(appState);

  return (
    <DashboardDrawer>
      <DashboardDrawerBackground>
        <BackgroundPreview {...backgroundPreviewState} />
      </DashboardDrawerBackground>

      <DashboardDrawerPanel>
        <SettingsDashboardContent>
          <SettingsDashboardDemo
            {...settingsDashboardDemoState}
            canUndo={canUndo}
            onAssetToggleChange={actions.setAssetToggle}
            onDeliveryModeChange={actions.setDeliveryMode}
            onDisplayNameChange={actions.setDisplayName}
            onNotesChange={actions.setNotes}
            onOverlayTitleChange={actions.setOverlayTitle}
            onResetDraft={actions.resetDraft}
            onUndo={actions.undoLastChange}
          />
        </SettingsDashboardContent>
      </DashboardDrawerPanel>
    </DashboardDrawer>
  );
}
