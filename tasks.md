# Tasks

## In Progress
- [ ] Publish the first release with a loud not-usable-yet warning and correct first-tag versioning



## To Do
- [ ] Harden the first event-sourced state milestone around a future admin flow
- [ ] Expand focused tests around replay, undo, and selector-driven projections
- [ ] Drive `/render/:mode?` from projected `AppState` instead of an empty placeholder
- [ ] Add a history and audit surface that shows command suites and accepted events
- [ ] Prepare the admin and render surfaces for real-time synchronization from a shared domain model


## Backlog
- [ ] Persist linear history to SQLite through the Bun backend
- [ ] Decide the backend API and real-time transport shape for local-first synchronization
- [ ] Add config and database bootstrap behavior for the packaged single executable
- [ ] Add replay and snapshot optimization for larger histories


## Done
- [x] Run a behavior-preserving cleanup pass on the release upload packaging files
- [x] Fix the failed first-release upload by packaging blocked executable assets before publish
- [x] Run a scoped post-validation cleanup pass on the first-release automation files
- [x] Review the repo-instructions and release-automation touched files for a worthwhile post-validation cleanup pass
- [x] Add repo commit-cadence instructions and trigger releases automatically every 10 commits
- [x] Run a behavior-preserving post-validation cleanup pass on the GitHub release automation files
- [x] Add GitHub release automation that bumps the version, builds binaries, and publishes changelog-based release notes
- [x] Run a behavior-preserving post-validation cleanup pass on build-watcher and its focused docs/tests
- [x] Make the build watcher derive the runtime executable path from package build scripts
- [x] Run a behavior-preserving cleanup pass on the remaining route and server files after the demo-admin removal
- [x] Tighten the demo-admin removal React route files with lightweight cleanup
- [x] Remove the demo-admin stack and leave `/` as an empty dashboard drawer shell
- [x] Remove the `/demo` page and promote `/` as the main admin surface
- [x] Run a post-validation lightweight React cleanup pass on the route-promotion React files
- [x] Reorganize the project into a first-pass domain-driven structure
- [x] Run a behavior-preserving post-validation cleanup pass on the domain-reorg source modules
- [x] Run a post-validation lightweight React cleanup pass on the domain-reorg files
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
- [x] Review targeted test coverage for the HTML font-size hook changes
- [x] Fix the HTML font-size hook cleanup so it restores the prior root font size on unmount
- [x] Add focused Bun tests for HTML font-size storage and inline-style restoration
- [x] Run compile and smoke validation for the HTML font-size hook changes
- [x] Audit which repo functions still lack worthwhile unit-test coverage
- [x] Add focused tests for createProcess lifecycle sequencing
- [x] Add focused tests for server port parsing and fallback behavior
- [x] Add isolated reducer tests for app-state event application
- [x] Run the post-validation refactor review for `createProcess`, `server-port`, and the Bun server entrypoint
- [x] Add focused tests for app-state helper factories and cloning helpers
- [x] Add focused tests for APITester shared selector helpers
- [x] Add focused tests for background and settings selector projections
- [x] Extend reducer coverage with direct replay assertions
- [x] Add app-state history edge-case tests for no-op requests, reset undo, and metadata generation
- [x] Add repo instructions for maintaining a root CHANGELOG.md
- [x] Capitalize the root changelog filename to CHANGELOG.md
- [x] Backfill CHANGELOG.md with prior significant milestones
- [x] Rewrite README.md with concise project-specific documentation
- [x] Review and refresh the PRD against the current codebase
- [x] Promote the PRD to a root project-wide PRD.md
- [x] Execute the PRD creation prompt against the current project context
- [x] Redefine PRD requirements away from demo-specific cosmetic behavior
- [x] Clean remaining PRD demo-derived wording
- [x] Replace tool-specific wording in docs
- [x] Capture the overlay domain concept explicitly in the PRD
- [x] Capture the widget domain concept explicitly in the PRD
- [x] Add a first-pass domain model section to the PRD
