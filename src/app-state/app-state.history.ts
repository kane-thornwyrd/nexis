import { Match } from "effect";

import type {
  AppCommand,
  AppCommandRequest,
  AppEvent,
  DemoAdminDraft,
  HistoryEntry,
  HistoryMetadataFactory,
} from "./app-state.types";
import {
  cloneDemoAdminDraft,
  createDefaultDemoAdminDraft,
} from "./app-state.types";
import { isUndoableEvent, replayHistory } from "./app-state.reducer";

const isSameDraft = (left: DemoAdminDraft, right: DemoAdminDraft) => {
  return (
    left.displayName === right.displayName &&
    left.overlayTitle === right.overlayTitle &&
    left.notes === right.notes &&
    left.deliveryMode === right.deliveryMode &&
    left.assetToggles.desktopSync === right.assetToggles.desktopSync &&
    left.assetToggles.incidentLatch === right.assetToggles.incidentLatch &&
    left.assetToggles.archiveSignals === right.assetToggles.archiveSignals
  );
};

const cloneEvent = (event: AppEvent): AppEvent => {
  return Match.value(event).pipe(
    Match.when({ type: "app.bootstrapped" }, ({ draft, eventId }) => ({
      type: "app.bootstrapped" as const,
      eventId,
      draft: cloneDemoAdminDraft(draft),
    })),
    Match.when(
      { type: "demoAdmin.displayName.set" },
      ({ eventId, previousValue, nextValue }) => ({
        type: "demoAdmin.displayName.set" as const,
        eventId,
        previousValue,
        nextValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.overlayTitle.set" },
      ({ eventId, previousValue, nextValue }) => ({
        type: "demoAdmin.overlayTitle.set" as const,
        eventId,
        previousValue,
        nextValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.notes.set" },
      ({ eventId, previousValue, nextValue }) => ({
        type: "demoAdmin.notes.set" as const,
        eventId,
        previousValue,
        nextValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.deliveryMode.set" },
      ({ eventId, previousValue, nextValue }) => ({
        type: "demoAdmin.deliveryMode.set" as const,
        eventId,
        previousValue,
        nextValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.assetToggle.set" },
      ({ assetKey, eventId, nextChecked, previousChecked }) => ({
        type: "demoAdmin.assetToggle.set" as const,
        assetKey,
        eventId,
        previousChecked,
        nextChecked,
      }),
    ),
    Match.when(
      { type: "demoAdmin.draft.reset" },
      ({ eventId, previousDraft, nextDraft }) => ({
        type: "demoAdmin.draft.reset" as const,
        eventId,
        previousDraft: cloneDemoAdminDraft(previousDraft),
        nextDraft: cloneDemoAdminDraft(nextDraft),
      }),
    ),
    Match.exhaustive,
  );
};

const createHistoryEntry = (
  metadataFactory: HistoryMetadataFactory,
  commands: readonly AppCommand[],
  event: AppEvent,
): HistoryEntry => ({
  timestamp: metadataFactory.createTimestamp(),
  commands: [...commands],
  event: cloneEvent(event),
});

const createInvertedEvent = (
  event: Exclude<AppEvent, { type: "app.bootstrapped" }>,
  metadataFactory: HistoryMetadataFactory,
): AppEvent => {
  const eventId = metadataFactory.createEventId();

  return Match.value(event).pipe(
    Match.when(
      { type: "demoAdmin.displayName.set" },
      ({ previousValue, nextValue }) => ({
        type: "demoAdmin.displayName.set" as const,
        eventId,
        previousValue: nextValue,
        nextValue: previousValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.overlayTitle.set" },
      ({ previousValue, nextValue }) => ({
        type: "demoAdmin.overlayTitle.set" as const,
        eventId,
        previousValue: nextValue,
        nextValue: previousValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.notes.set" },
      ({ previousValue, nextValue }) => ({
        type: "demoAdmin.notes.set" as const,
        eventId,
        previousValue: nextValue,
        nextValue: previousValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.deliveryMode.set" },
      ({ previousValue, nextValue }) => ({
        type: "demoAdmin.deliveryMode.set" as const,
        eventId,
        previousValue: nextValue,
        nextValue: previousValue,
      }),
    ),
    Match.when(
      { type: "demoAdmin.assetToggle.set" },
      ({ assetKey, previousChecked, nextChecked }) => ({
        type: "demoAdmin.assetToggle.set" as const,
        assetKey,
        eventId,
        previousChecked: nextChecked,
        nextChecked: previousChecked,
      }),
    ),
    Match.when(
      { type: "demoAdmin.draft.reset" },
      ({ previousDraft, nextDraft }) => ({
        type: "demoAdmin.draft.reset" as const,
        eventId,
        previousDraft: cloneDemoAdminDraft(nextDraft),
        nextDraft: cloneDemoAdminDraft(previousDraft),
      }),
    ),
    Match.exhaustive,
  );
};

const createResolvedEntryForRequest = (
  history: readonly HistoryEntry[],
  request: AppCommandRequest,
  metadataFactory: HistoryMetadataFactory,
): HistoryEntry | null => {
  const currentState = replayHistory(history);
  const currentDraft = currentState.demoAdmin;

  return Match.value(request).pipe(
    Match.when({ type: "demoAdmin.displayName.set" }, ({ value }) => {
      if (currentDraft.displayName === value) {
        return null;
      }

      return createHistoryEntry(
        metadataFactory,
        [{ type: "demoAdmin.displayName.set", value }],
        {
          type: "demoAdmin.displayName.set",
          eventId: metadataFactory.createEventId(),
          previousValue: currentDraft.displayName,
          nextValue: value,
        },
      );
    }),
    Match.when({ type: "demoAdmin.overlayTitle.set" }, ({ value }) => {
      if (currentDraft.overlayTitle === value) {
        return null;
      }

      return createHistoryEntry(
        metadataFactory,
        [{ type: "demoAdmin.overlayTitle.set", value }],
        {
          type: "demoAdmin.overlayTitle.set",
          eventId: metadataFactory.createEventId(),
          previousValue: currentDraft.overlayTitle,
          nextValue: value,
        },
      );
    }),
    Match.when({ type: "demoAdmin.notes.set" }, ({ value }) => {
      if (currentDraft.notes === value) {
        return null;
      }

      return createHistoryEntry(
        metadataFactory,
        [{ type: "demoAdmin.notes.set", value }],
        {
          type: "demoAdmin.notes.set",
          eventId: metadataFactory.createEventId(),
          previousValue: currentDraft.notes,
          nextValue: value,
        },
      );
    }),
    Match.when({ type: "demoAdmin.deliveryMode.set" }, ({ value }) => {
      if (currentDraft.deliveryMode === value) {
        return null;
      }

      return createHistoryEntry(
        metadataFactory,
        [{ type: "demoAdmin.deliveryMode.set", value }],
        {
          type: "demoAdmin.deliveryMode.set",
          eventId: metadataFactory.createEventId(),
          previousValue: currentDraft.deliveryMode,
          nextValue: value,
        },
      );
    }),
    Match.when(
      { type: "demoAdmin.assetToggle.set" },
      ({ assetKey, checked }) => {
        if (currentDraft.assetToggles[assetKey] === checked) {
          return null;
        }

        return createHistoryEntry(
          metadataFactory,
          [{ type: "demoAdmin.assetToggle.set", assetKey, checked }],
          {
            type: "demoAdmin.assetToggle.set",
            eventId: metadataFactory.createEventId(),
            assetKey,
            previousChecked: currentDraft.assetToggles[assetKey],
            nextChecked: checked,
          },
        );
      },
    ),
    Match.when({ type: "demoAdmin.draft.reset" }, () => {
      const nextDraft = createDefaultDemoAdminDraft();

      if (isSameDraft(currentDraft, nextDraft)) {
        return null;
      }

      return createHistoryEntry(
        metadataFactory,
        [{ type: "demoAdmin.draft.reset" }],
        {
          type: "demoAdmin.draft.reset",
          eventId: metadataFactory.createEventId(),
          previousDraft: cloneDemoAdminDraft(currentDraft),
          nextDraft,
        },
      );
    }),
    Match.when({ type: "history.undo" }, () => {
      const targetEntry = getLatestUndoableEntry(history);

      if (!targetEntry || !isUndoableEvent(targetEntry.event)) {
        return null;
      }

      return createHistoryEntry(
        metadataFactory,
        [{ type: "history.undo", targetEventId: targetEntry.event.eventId }],
        createInvertedEvent(targetEntry.event, metadataFactory),
      );
    }),
    Match.exhaustive,
  );
};

export const createHistoryMetadataFactory = (): HistoryMetadataFactory => {
  let eventSequence = 0;

  return {
    createEventId: () => {
      eventSequence += 1;
      return `event-${eventSequence}`;
    },
    createTimestamp: () => new Date().toISOString(),
  };
};

export const createInitialHistory = (
  metadataFactory: HistoryMetadataFactory,
): readonly [HistoryEntry] => {
  const draft = createDefaultDemoAdminDraft();

  return [
    createHistoryEntry(
      metadataFactory,
      [{ type: "app.bootstrap.requested", draft: cloneDemoAdminDraft(draft) }],
      {
        type: "app.bootstrapped",
        eventId: metadataFactory.createEventId(),
        draft,
      },
    ),
  ];
};

export const getLatestUndoableEntry = (
  history: readonly HistoryEntry[],
): HistoryEntry | null => {
  const openEntries = [] as HistoryEntry[];

  for (const entry of history) {
    const undoCommand = entry.commands.find(
      (command): command is Extract<AppCommand, { type: "history.undo" }> => {
        return command.type === "history.undo";
      },
    );

    if (undoCommand) {
      const targetIndex = openEntries.findIndex(
        (candidate) => candidate.event.eventId === undoCommand.targetEventId,
      );

      if (targetIndex !== -1) {
        openEntries.splice(targetIndex, 1);
      }

      continue;
    }

    if (isUndoableEvent(entry.event)) {
      openEntries.push(entry);
    }
  }

  return openEntries.at(-1) ?? null;
};

export const appendCommandRequest = (
  history: readonly HistoryEntry[],
  request: AppCommandRequest,
  metadataFactory: HistoryMetadataFactory,
): readonly HistoryEntry[] => {
  const nextEntry = createResolvedEntryForRequest(
    history,
    request,
    metadataFactory,
  );

  if (!nextEntry) {
    return history;
  }

  return [...history, nextEntry];
};
