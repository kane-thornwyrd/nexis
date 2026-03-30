import { expect, test } from "bun:test";

import {
  createOverlayRecord,
  DEFAULT_NEXIS_PROJECT_STATE,
  getOverlayFormat,
  nexisProjectReducer,
  persistProjectState,
  readStoredProjectState,
  NEXIS_PROJECT_STORAGE_KEY,
} from "@/app-state";

test("createOverlayRecord creates the next landscape overlay with a deterministic id", () => {
  const overlay = createOverlayRecord(DEFAULT_NEXIS_PROJECT_STATE.overlays);

  expect(overlay.id).toBe("overlay-3");
  expect(overlay.name).toBe("Overlay 3");
  expect(overlay.width).toBe(1920);
  expect(overlay.height).toBe(1080);
  expect(getOverlayFormat(overlay.width, overlay.height)).toBe("landscape");
});

test("nexisProjectReducer updates overlays and publication state", () => {
  const withRenamedProject = nexisProjectReducer(DEFAULT_NEXIS_PROJECT_STATE, {
    type: "projectRenamed",
    name: "Launch Project",
  });

  expect(withRenamedProject.projectName).toBe("Launch Project");

  const withOverlayUpdate = nexisProjectReducer(withRenamedProject, {
    type: "overlayUpdated",
    overlayId: "overlay-1",
    patch: {
      height: 1920,
      name: "Portrait Preview",
      width: 1080,
    },
  });

  expect(withOverlayUpdate.overlays[0]).toMatchObject({
    height: 1920,
    name: "Portrait Preview",
    width: 1080,
  });

  const withPublicationChange = nexisProjectReducer(withOverlayUpdate, {
    type: "overlayPublicationChanged",
    overlayId: "overlay-1",
    publicationState: "staged",
  });

  expect(withPublicationChange.overlays[0]?.publicationState).toBe("staged");
  expect(getOverlayFormat(1080, 1920)).toBe("portrait");
});

test("stored project state falls back safely when storage contains invalid JSON", () => {
  const badStorage = {
    getItem: () => "{not-valid-json",
    setItem: () => {},
  };

  expect(readStoredProjectState(badStorage)).toEqual(DEFAULT_NEXIS_PROJECT_STATE);
});

test("persistProjectState writes the serialized project payload", () => {
  let storedKey = "";
  let storedValue = "";
  const fakeStorage = {
    getItem: () => null,
    setItem: (key: string, value: string) => {
      storedKey = key;
      storedValue = value;
    },
  };

  persistProjectState(DEFAULT_NEXIS_PROJECT_STATE, fakeStorage);

  expect(storedKey).toBe(NEXIS_PROJECT_STORAGE_KEY);
  expect(JSON.parse(storedValue)).toEqual(DEFAULT_NEXIS_PROJECT_STATE);
});