# Event-Sourced State PRD

## Document Status
- Status: Draft, living product and architecture document
- Repository: nexis
- Date: 2026-03-23
- Scope: Product requirements plus implementation roadmap for the local-first overlay application and its evolving state architecture

## Product Summary
nexis is evolving into a local-first single-file executable that serves an admin interface, a render surface, and real-time synchronization between them. The immediate product direction is to replace ad hoc UI-local state with a single immutable application model derived from an append-only linear history of commands and events.

The long-term objective is not merely shared state. The application must support:
- deterministic replay of state
- full auditability of how state changed
- infinite undo represented as new history entries
- future SQLite persistence through the Bun backend
- future real-time synchronization between the admin route and the render route, likely through a push channel such as WebSocket

## Current Implemented State

### Application Shell
- The frontend is a React application bootstrapped from [src/frontend.tsx](../src/frontend.tsx).
- Client-side routing uses wouter in [src/App.tsx](../src/App.tsx).
- Current routes:
  - `/` -> admin shell with an empty dashboard drawer
  - `/demo` -> APITester demo surface
  - `/render/:mode?` -> empty render surface placeholder

### Server and Runtime
- The Bun server serves the SPA shell for `/`, `/demo`, and `/render/*` from [src/server.ts](../src/server.ts).
- The current runtime model is local-first and already includes a Bun WebSocket surface in [src/server.ts](../src/server.ts), but backend synchronization is still placeholder-level.
- The repository builds host-native single-file binaries through the `subbuild:bin:*` scripts in [package.json](../package.json).

### UI and Interaction Work Completed So Far
- A dashboard drawer component exists and has been extracted into [src/components/DashboardDrawer/DashboardDrawer.tsx](../src/components/DashboardDrawer/DashboardDrawer.tsx).
- The drawer uses a compound component shape with `DashboardDrawerBackground` and `DashboardDrawerPanel` slots.
- The drawer logic is colocated in [src/components/DashboardDrawer/useDashboardDrawer.ts](../src/components/DashboardDrawer/useDashboardDrawer.ts).
- Client routes were introduced so the admin surface, demo surface, and render surface are separate entry views in the SPA.
- The light theme path and ThemeModeToggle were removed; the app now boots into a fixed dark shell.
- APITester remains the current interactive stateful demo and still manages local React state directly in [src/APITester.tsx](../src/APITester.tsx).

### Current Technical Stack
- Bun runtime and Bun server
- React 19
- Wouter for client-side routing
- shadcn and Radix-based UI primitives
- Tailwind-based styling pipeline
- Effect added as an available dependency for domain and composition work

## Problem Statement
The current frontend still relies on localized React state in the demo flow. That model is insufficient for the target product because it does not provide:
- a single canonical application state
- deterministic replay of state transitions
- audit trails that explain how state moved from one snapshot to another
- undo as append-only history
- a backend-ready model for local persistence and real-time synchronization

The application needs a domain-level state architecture that is transport-agnostic, persistence-ready, and UI-friendly.

## Product Vision
The final product should behave like a local control room application packaged as a single executable that:
- creates or uses a local config file
- creates or uses a local SQLite database file
- serves a browser-based admin interface for editing overlay state
- serves one or more render routes suitable for OBS browser sources
- propagates changes from the admin route to render routes immediately
- records enough history to support undo and auditing across sessions

## Goals
- Introduce one immutable `AppState` projection for the whole application.
- Make state transitions replayable from a linear append-only history.
- Separate commands from events in the saved history structure.
- Support infinite undo by appending new inverse or compensating entries to history.
- Keep the first implementation fully in memory while designing it for later persistence.
- Move React components toward parent-selected immutable state slices.
- Keep the architecture compatible with future SQLite persistence and real-time server push.

## Non-Goals For The First Iteration
- No SQLite persistence yet.
- No final backend protocol decision yet between REST, GraphQL, or another API shape.
- No branching history model.
- No destructive history rewriting for undo.
- No broad visual redesign unrelated to the state architecture.

## Functional Requirements

### Canonical State
- There must be one canonical immutable `AppState` snapshot.
- `AppState` must be derived from replaying history, not mutated in place.
- The app should expose one top-level hook for reading the current projected snapshot.

### History Model
- History must remain linear and append-only.
- The in-memory history entry shape should separate commands from the accepted event.
- The baseline target shape is:

```ts
type HistoryEntry = {
  timestamp: string;
  event: Event;
  commands: Command[];
};
```

- A history entry must make it possible to inspect which command suite produced which event.

### Commands and Events
- Commands represent user or system intent.
- Events represent accepted facts that change application state.
- State must be updated by applying events through pure transition logic.
- The system must allow a command suite to map to a resulting event in a transparent and auditable way.

### Undo
- Undo must append a new history entry.
- Undo must never mutate snapshots or delete old history.
- Each reversible transition must provide an inverse computation when practical.
- When exact primitive inversion is not practical, composed reversible transformations should still make it possible to compute a valid undo entry from the original transition path.

### Auditability
- Replay of the history must deterministically reconstruct `AppState`.
- The history must remain human-inspectable enough to show what changed, when, and through which command suite.
- The same model must remain suitable for later database persistence and audit queries.

### React Integration
- Parent or container components may read from the app-state hook.
- Presentational or leaf components must not read global app state directly.
- Every state-consuming component must export a colocated selector that extracts the exact slice it needs.
- Parents must call those selectors and pass only immutable slices through props.
- Children should not receive the entire app state.

### Styling and File Structure
- State-consuming components should keep selectors, helpers, and CSS colocated when practical.
- Component-specific styling should live in a CSS file inside the component folder.
- Component CSS should reference [src/config.css](../src/config.css) with the correct relative path to use shared tokens and variables.

## Technical Principles
- Immutability first
- Pure state transitions
- Pure selectors for derived reads
- Append-only undo
- Linear history
- Incremental migration over rewrite
- Transport-agnostic domain model
- Local-first deployment assumptions
- Use Effect when it materially improves clarity for domain modeling, composition, or pattern matching

## Real-Time Synchronization Direction
The product must eventually support immediate propagation from the admin route to one or more render routes used by OBS Studio. The current PRD does not lock the final transport protocol, but the architecture must assume:
- backend communication will exist later
- real-time push is required
- a WebSocket-capable flow is likely
- the frontend domain model should not be tightly coupled yet to REST, GraphQL, or any single transport choice

## Persistence Direction
The backend is expected to run on Bun and eventually persist application history in SQLite. The first refactor must therefore keep the in-memory history model ready for later storage without requiring a redesign of:
- command types
- event types
- history entry structure
- replay logic
- undo logic

## Current Risks and Gaps
- The current demo still uses component-local React state and is not yet derived from a central `AppState`.
- The render route is still a placeholder and does not yet subscribe to shared application state.
- Real-time synchronization behavior is not implemented yet.
- Database persistence is not implemented yet.
- Command and event types do not yet exist as first-class domain objects in the codebase.

## Delivery Phases

### Phase 0: Current Foundation
- SPA routing for admin, demo, and render surfaces
- Bun server fallback for SPA entry points
- Dark-only shell
- Dashboard drawer extraction and composition structure
- Effect installed and available

### Phase 1: Domain State Foundation
- Introduce `AppState`
- Introduce `Command`, `Event`, and `HistoryEntry` domain types
- Introduce in-memory linear history
- Introduce pure event-application logic
- Introduce undo entry generation based on reversible transformations

### Phase 2: React Integration
- Introduce the top-level app-state hook and provider wiring
- Move parent components to selecting state slices from `AppState`
- Add colocated selectors to state-consuming components
- Remove direct leaf-level dependence on shared state access

### Phase 3: Render Synchronization
- Drive `/render/*` from the same projected state model
- Add push-based synchronization between admin and render surfaces
- Keep the domain model transport-agnostic

### Phase 4: Persistence and Local Executable Behavior
- Persist history to SQLite through the Bun backend
- Rehydrate projected state from stored history on startup
- Add config and database bootstrap behavior for the packaged executable

## Acceptance Criteria For The First Architecture Milestone
- One immutable `AppState` exists.
- One in-memory append-only linear history exists.
- Commands and events are modeled as distinct types.
- The app can derive `AppState` by replaying history.
- Undo is represented as new appended history entries.
- At least one meaningful UI flow reads from the projected state instead of local ad hoc state.
- Parent components, not child components, select state slices.
- The application still builds and starts cleanly.

## Open Decisions
- Exact backend API style is still open.
- The final WebSocket message contract is still open.
- The exact category-theory-inspired transformation helper API is still open, but it must remain practical and readable.
- Snapshotting and replay optimization strategy for large histories is still open.

## Implementation Guidance
- Favor small incremental migrations.
- Preserve runtime behavior whenever possible.
- Keep state transitions and selectors easy to test.
- Avoid broad abstraction layers before the first event-sourced slice is working.
- Use the new Event Sourced State Guard agent to keep future refactors aligned with this PRD.