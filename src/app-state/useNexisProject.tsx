import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

import {
  createOverlayRecord,
  DEFAULT_NEXIS_PROJECT_STATE,
  getOverlayFormat,
  nexisProjectReducer,
  persistProjectState,
  readStoredProjectState,
  type NexisProjectState,
  type OverlayPublicationState,
  type OverlayRecordPatch,
  type OverlayRecord,
} from "./nexis-project";

type NexisProjectContextValue = {
  state: NexisProjectState;
  renameProject: (name: string) => void;
  createOverlay: () => OverlayRecord;
  updateOverlay: (overlayId: string, patch: OverlayRecordPatch) => void;
  setOverlayPublicationState: (
    overlayId: string,
    publicationState: OverlayPublicationState,
  ) => void;
};

const NexisProjectContext =
  createContext<NexisProjectContextValue | null>(null);

export function NexisProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    nexisProjectReducer,
    DEFAULT_NEXIS_PROJECT_STATE,
    () => readStoredProjectState(),
  );

  useEffect(() => {
    persistProjectState(state);
  }, [state]);

  const renameProject = (name: string) => {
    dispatch({ type: "projectRenamed", name });
  };

  const createOverlay = () => {
    const overlay = createOverlayRecord(state.overlays);
    dispatch({ type: "overlayAdded", overlay });
    return overlay;
  };

  const updateOverlay = (
    overlayId: string,
    patch: OverlayRecordPatch,
  ) => {
    dispatch({ type: "overlayUpdated", overlayId, patch });
  };

  const setOverlayPublicationState = (
    overlayId: string,
    publicationState: OverlayPublicationState,
  ) => {
    dispatch({ type: "overlayPublicationChanged", overlayId, publicationState });
  };

  return (
    <NexisProjectContext.Provider
      value={{
        state,
        renameProject,
        createOverlay,
        updateOverlay,
        setOverlayPublicationState,
      }}
    >
      {children}
    </NexisProjectContext.Provider>
  );
}

export const useNexisProject = () => {
  const context = useContext(NexisProjectContext);

  if (!context) {
    throw new Error("useNexisProject must be used inside NexisProjectProvider.");
  }

  return context;
};

export const useOverlayById = (overlayId: string | undefined) => {
  const { state } = useNexisProject();

  if (!overlayId) {
    return null;
  }

  return state.overlays.find((overlay) => overlay.id === overlayId) ?? null;
};

export { getOverlayFormat };