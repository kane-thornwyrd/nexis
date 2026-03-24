import { expect, test } from "bun:test";

import {
  appendCommandRequest,
  createInitialHistory,
  getLatestUndoableEntry,
  replayHistory,
} from "@/app-state/index";
import {
  DEFAULT_DISPLAY_NAME,
  DEFAULT_OVERLAY_TITLE,
} from "@/APITester.shared";
import type { HistoryMetadataFactory } from "@/app-state/app-state.types";

const createDeterministicMetadataFactory = (): HistoryMetadataFactory => {
  let eventSequence = 0;
  let timestampSequence = 0;

  return {
    createEventId: () => {
      eventSequence += 1;
      return `event-${eventSequence}`;
    },
    createTimestamp: () => {
      timestampSequence += 1;
      return `2026-03-23T00:00:00.${String(timestampSequence).padStart(3, "0")}Z`;
    },
  };
};

test("replays the projected demo-admin state from append-only history", () => {
  const metadataFactory = createDeterministicMetadataFactory();
  let history = createInitialHistory(metadataFactory);

  history = appendCommandRequest(
    history,
    { type: "demoAdmin.displayName.set", value: "Control room alpha" },
    metadataFactory,
  );
  history = appendCommandRequest(
    history,
    { type: "demoAdmin.deliveryMode.set", value: "monitoring" },
    metadataFactory,
  );
  history = appendCommandRequest(
    history,
    {
      type: "demoAdmin.assetToggle.set",
      assetKey: "incidentLatch",
      checked: true,
    },
    metadataFactory,
  );

  const projectedState = replayHistory(history);

  expect(history).toHaveLength(4);
  expect(history[1]?.commands).toEqual([
    { type: "demoAdmin.displayName.set", value: "Control room alpha" },
  ]);
  expect(projectedState.demoAdmin.displayName).toBe("Control room alpha");
  expect(projectedState.demoAdmin.deliveryMode).toBe("monitoring");
  expect(projectedState.demoAdmin.assetToggles.incidentLatch).toBe(true);
});

test("appends undo entries that walk backward through prior accepted events", () => {
  const metadataFactory = createDeterministicMetadataFactory();
  let history = createInitialHistory(metadataFactory);

  history = appendCommandRequest(
    history,
    { type: "demoAdmin.displayName.set", value: "Control room alpha" },
    metadataFactory,
  );
  const firstChangeId = history.at(-1)?.event.eventId;

  history = appendCommandRequest(
    history,
    { type: "demoAdmin.overlayTitle.set", value: "Mission brief" },
    metadataFactory,
  );
  const secondChangeId = history.at(-1)?.event.eventId;

  history = appendCommandRequest(
    history,
    { type: "history.undo" },
    metadataFactory,
  );

  expect(history).toHaveLength(4);
  expect(history.at(-1)?.commands).toEqual([
    { type: "history.undo", targetEventId: secondChangeId },
  ]);
  expect(getLatestUndoableEntry(history)?.event.eventId).toBe(firstChangeId);
  expect(replayHistory(history).demoAdmin.overlayTitle).toBe(
    DEFAULT_OVERLAY_TITLE,
  );

  history = appendCommandRequest(
    history,
    { type: "history.undo" },
    metadataFactory,
  );

  expect(history).toHaveLength(5);
  expect(history.at(-1)?.commands).toEqual([
    { type: "history.undo", targetEventId: firstChangeId },
  ]);
  expect(getLatestUndoableEntry(history)).toBeNull();

  const projectedState = replayHistory(history);

  expect(projectedState.demoAdmin.displayName).toBe(DEFAULT_DISPLAY_NAME);
  expect(projectedState.demoAdmin.overlayTitle).toBe(DEFAULT_OVERLAY_TITLE);
});
