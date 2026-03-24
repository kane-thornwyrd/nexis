import {
  createContext,
  useContext,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { Match } from "effect";

import {
  appendCommandRequest,
  createHistoryMetadataFactory,
  createInitialHistory,
  getLatestUndoableEntry,
} from "./app-state.history";
import { replayHistory } from "./app-state.reducer";
import type {
  AppCommandRequest,
  AppState,
  AppStateActions,
  HistoryEntry,
} from "./app-state.types";

type AppStateContextValue = {
  appState: AppState;
  history: readonly HistoryEntry[];
  canUndo: boolean;
  actions: AppStateActions;
};

type AppStateProviderProps = {
  children: ReactNode;
};

type HistoryReducerAction = {
  type: "command.requested";
  request: AppCommandRequest;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

const createHistoryReducer = (
  metadataFactory: ReturnType<typeof createHistoryMetadataFactory>,
) => {
  return (
    history: readonly HistoryEntry[],
    action: HistoryReducerAction,
  ): readonly HistoryEntry[] => {
    return Match.value(action).pipe(
      Match.when({ type: "command.requested" }, ({ request }) => {
        return appendCommandRequest(history, request, metadataFactory);
      }),
      Match.exhaustive,
    );
  };
};

export function AppStateProvider({ children }: AppStateProviderProps) {
  const metadataFactoryRef = useRef(createHistoryMetadataFactory());
  const [history, dispatch] = useReducer(
    createHistoryReducer(metadataFactoryRef.current),
    undefined,
    () => createInitialHistory(metadataFactoryRef.current),
  );
  const appState = replayHistory(history);
  const canUndo = getLatestUndoableEntry(history) !== null;

  const actions: AppStateActions = {
    setDisplayName: (value) => {
      dispatch({
        type: "command.requested",
        request: { type: "demoAdmin.displayName.set", value },
      });
    },
    setOverlayTitle: (value) => {
      dispatch({
        type: "command.requested",
        request: { type: "demoAdmin.overlayTitle.set", value },
      });
    },
    setNotes: (value) => {
      dispatch({
        type: "command.requested",
        request: { type: "demoAdmin.notes.set", value },
      });
    },
    setDeliveryMode: (value) => {
      dispatch({
        type: "command.requested",
        request: { type: "demoAdmin.deliveryMode.set", value },
      });
    },
    setAssetToggle: (assetKey, checked) => {
      dispatch({
        type: "command.requested",
        request: { type: "demoAdmin.assetToggle.set", assetKey, checked },
      });
    },
    resetDraft: () => {
      dispatch({
        type: "command.requested",
        request: { type: "demoAdmin.draft.reset" },
      });
    },
    undoLastChange: () => {
      dispatch({
        type: "command.requested",
        request: { type: "history.undo" },
      });
    },
  };

  return (
    <AppStateContext.Provider value={{ appState, history, canUndo, actions }}>
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside an AppStateProvider");
  }

  return context;
};
