# Tasks

## In Progress
- [ ] Harden the first event-sourced state milestone around the `/demo` flow
- [ ] Expand focused tests around replay, undo, and selector-driven projections
- [ ] Review targeted test coverage for the HTML font-size hook changes


## To Do
- [ ] Drive `/render/:mode?` from projected `AppState` instead of an empty placeholder
- [ ] Add a history and audit surface that shows command suites and accepted events
- [ ] Prepare the admin and render surfaces for real-time synchronization from a shared domain model


## Backlog
- [ ] Persist linear history to SQLite through the Bun backend
- [ ] Decide the backend API and real-time transport shape for local-first synchronization
- [ ] Add config and database bootstrap behavior for the packaged single executable
- [ ] Add replay and snapshot optimization for larger histories


## Done
- [x] Introduce client-side routes for `/`, `/demo`, and `/render/:mode?`
- [x] Serve the SPA shell from Bun for the admin, demo, and render routes
- [x] Lock the frontend to the current dark theme and remove the light-theme path
- [x] Extract the dashboard drawer and harden its modal behavior
- [x] Fix the `/demo` drawer-context regression by restoring the background content under the drawer provider
- [x] Fix the drawer scrollbar disappearing below 768px by keeping a single shrinkable scroll container
- [x] Add a top-level application error boundary
- [x] Create the Event Sourced State Guard agent for future state-architecture refactors
- [x] Create a living PRD for the event-sourced local-first architecture roadmap
- [x] Introduce immutable `AppState`, `Command`, `Event`, and `HistoryEntry` types
- [x] Add in-memory append-only history with undo represented as appended entries
- [x] Add pure history replay and event-application foundations for projected state
- [x] Expose projected app state through `AppStateProvider` and `useAppState`
- [x] Migrate `APITester` to parent-selected state slices via colocated selectors
- [x] Add focused unit coverage for append-only history replay and undo behavior
- [x] Move task tracking into `tasks.md` as the active project task list
- [x] Require Copilot to keep `tasks.md` synchronized with planned and active work
