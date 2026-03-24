import { Match } from "effect";

import type {
  AppEvent,
  AppState,
  HistoryEntry,
  UndoableAppEvent,
} from "./app-state.types";
import { cloneDemoAdminDraft, createInitialAppState } from "./app-state.types";

export const isUndoableEvent = (event: AppEvent): event is UndoableAppEvent => {
  return event.type !== "app.bootstrapped";
};

export const applyEvent = (state: AppState, event: AppEvent): AppState => {
  return Match.value(event).pipe(
    Match.when({ type: "app.bootstrapped" }, ({ draft }) => ({
      demoAdmin: cloneDemoAdminDraft(draft),
    })),
    Match.when({ type: "demoAdmin.displayName.set" }, ({ nextValue }) => ({
      ...state,
      demoAdmin: {
        ...state.demoAdmin,
        displayName: nextValue,
      },
    })),
    Match.when({ type: "demoAdmin.overlayTitle.set" }, ({ nextValue }) => ({
      ...state,
      demoAdmin: {
        ...state.demoAdmin,
        overlayTitle: nextValue,
      },
    })),
    Match.when({ type: "demoAdmin.notes.set" }, ({ nextValue }) => ({
      ...state,
      demoAdmin: {
        ...state.demoAdmin,
        notes: nextValue,
      },
    })),
    Match.when({ type: "demoAdmin.deliveryMode.set" }, ({ nextValue }) => ({
      ...state,
      demoAdmin: {
        ...state.demoAdmin,
        deliveryMode: nextValue,
      },
    })),
    Match.when(
      { type: "demoAdmin.assetToggle.set" },
      ({ assetKey, nextChecked }) => ({
        ...state,
        demoAdmin: {
          ...state.demoAdmin,
          assetToggles: {
            ...state.demoAdmin.assetToggles,
            [assetKey]: nextChecked,
          },
        },
      }),
    ),
    Match.when({ type: "demoAdmin.draft.reset" }, ({ nextDraft }) => ({
      ...state,
      demoAdmin: cloneDemoAdminDraft(nextDraft),
    })),
    Match.exhaustive,
  );
};

export const replayHistory = (history: readonly HistoryEntry[]): AppState => {
  return history.reduce(
    (state, entry) => applyEvent(state, entry.event),
    createInitialAppState(),
  );
};
