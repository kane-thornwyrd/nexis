# CHANGELOG

This file tracks significant changes to the codebase and the goal behind each change.

## Entries

Add new entries in reverse chronological order.

### 2026-03-24
- Fixed the first-release publish path by packaging compiled binaries into safe `.tar.gz` archives before upload, so GitHub release creation no longer fails on blocked raw executable extensions such as `.app` and `.exe`.
  Goal: make the first release publish end-to-end instead of failing after the tag is created.
- Tightened the release-upload packaging follow-up pass by deduplicating trimmed asset-path lists during packaging and routing the packaging command through `package.json`, so the workflow and docs share one entrypoint.
  Goal: reduce release automation drift and prevent redundant archive creation from repeated asset-list entries without changing the release flow.
- Tightened the first-release automation cleanup by making `release:prepare` skip a no-op `package.json` rewrite when the release keeps the current version, and clarified that first-release behavior in the README.
  Goal: keep release preparation idempotent for the initial release path and align the documentation with the script's actual behavior.
- Hardened the release automation for the first real project release by keeping the initial tag on the current package version, adding a loud not-usable-yet warning to first-release notes, and allowing the workflow to publish the first release immediately when no prior release tag exists.
  Goal: make the initial release publish the intended `v1.0.0` milestone cleanly while being explicit that the project is still unusable.
- Added some extra mcp
- Tightened the workflow-instruction and release-automation follow-up pass by scoping future cleanup reviews to touched files, making changelog slicing ignore trailing-newline drift, deriving release artifacts from one metadata object, hardening workflow git commands, and documenting manual release dispatch in the README.
  Goal: reduce small release-prep edge cases and keep the instructions, automation, and docs aligned without changing the intended release flow.
- Updated the repo workflow rules so code-changing work is committed in short batches of roughly 10 completed tasks, and the GitHub release automation now auto-publishes after every 10 commits on the default branch.
  Goal: keep the repository history readable for day-to-day work while making releases happen on a predictable commit cadence.
- Hardened the GitHub release automation cleanup path by de-duplicating script-derived asset lists, skipping blank asset entries during release publication, and removing an unused workflow metadata output.
  Goal: keep release publication resilient to small script drift and empty-asset edge cases without changing the intended release flow.
- Added a GitHub release workflow that bumps the leading version number, builds every configured binary, and publishes changelog-based release notes plus downloadable assets.
  Goal: make releases reproducible from the repository itself and keep published binaries, versioning, and release notes aligned.
- Hardened the build watcher cleanup around script-derived executable paths by preserving explicit Windows-style relative `--outfile` values and deriving the static style-watch file list from one source.
  Goal: reduce watcher config drift and keep local restarts aligned with equivalent package-script path notations.
- Updated `build-watcher.ts` to derive the runtime executable path from the configured package build scripts instead of assuming one fixed binary filename pattern.
  Goal: keep local watch-mode restarts aligned with platform-specific output filenames such as `.x64`, `.arm64`, `.exe`, and `.app`.
- Removed the `demo-admin` stack from the live app and left `/` as an empty dashboard drawer shell.
  Goal: clear out the provisional demo-admin implementation before rebuilding the admin flow around the real overlay and widget domain.
- Removed the `/demo` page, promoted the interactive admin experience to `/`, and stopped serving `/demo` as an active SPA route.
  Goal: stop treating the operator UI as a demo-only surface and make the root route the main entrypoint.
- Reorganized the codebase into a first-pass domain-driven structure with explicit domain, application, presentation, and infrastructure layers, while keeping compatibility shims for the old paths.
  Goal: make responsibilities clearer, stop domain logic from depending on UI modules, and give future overlay and widget work a better architectural foundation.
- Renamed the project to NEXIS across package metadata, build outputs, docs, manifests, storage keys, and repo automation.
  Goal: align the product identity across runtime artifacts, documentation, and development tooling.
- Replaced the duplicated template README with concise project-specific documentation.
  Goal: make onboarding accurate, remove stale template guidance, and describe the actual runtime, routes, and development workflow.
- Promoted the narrow event-sourced PRD into a root `PRD.md` and broadened it into a project-wide product document.
  Goal: make the PRD describe the whole product while still preserving state architecture as one important part of the roadmap.
- Executed the PRD creation prompt against the current project context and rewrote `PRD.md` into the template-based format.
  Goal: align the root PRD with the structured product-document format while filling it with the current repo's concrete scope, milestones, and user stories.
- Reframed the PRD requirements and user stories so they describe the product instead of inheriting cosmetic-only details from the `/demo` route.
  Goal: keep the PRD anchored on long-term product capabilities while treating `/demo` as a visual sandbox rather than the feature source of truth.
- Cleaned the remaining demo-derived PRD wording in personas, role descriptions, storage notes, and sequencing text.
  Goal: remove the last traces of cosmetic-sandbox language from sections that should stay product-level and future-facing.
- Replaced tool-specific and browser-source wording in the product docs with the requested neutral phrasing.
  Goal: keep the documentation tool-agnostic and describe render consumption as usage in streaming software able to compose a web source.
- Clarified the overlay domain concept in the PRD as a composition of widgets over a video stream, with concrete chat, now-listening, and donation-goal examples.
  Goal: anchor future product decisions on the actual stream-overlay domain instead of generic dashboard assumptions.
- Clarified the widget domain concept in the PRD as a positionable overlay element that can be renderable or non-renderable, data-driven from local or external sources, and optionally permissioned to alter overlay behavior.
  Goal: make future planning treat widgets as first-class domain objects rather than as generic UI components.
- Added a first-pass PRD domain model section defining overlay, widget, data source, template, viewport placement, and permission.
  Goal: give future product, architecture, and UX work a stable shared vocabulary instead of relying on scattered prose definitions.
- Expanded focused Bun coverage for process lifecycle management, server port resolution, app-state reducers and factories, shared helpers, selectors, and history edge cases.
  Goal: protect the highest-risk pure logic with direct regression tests and reduce the chance of silent behavior drift.
- Fixed the HTML font-size hook cleanup path and validated the result with focused tests plus Linux build and smoke checks.
  Goal: preserve the previous root font-size correctly on cleanup while proving the app still builds and starts cleanly.
- Added repo workflow guidance for maintaining `tasks.md` and a root `CHANGELOG.md`, and backfilled the changelog with prior milestones.
  Goal: keep planning, validation, and release notes synchronized as significant changes land.

### 2026-03-23
- Introduced client-side routes for `/`, `/demo`, and `/render/:mode?`, and served the SPA shell for those routes from the Bun backend.
  Goal: separate the admin, demo, and render surfaces while keeping the packaged app on a single local-first server entrypoint.
- Added the first event-sourced app-state foundation with immutable types, append-only history, replay, undo, provider wiring, and selector-driven `APITester` state consumption.
  Goal: move the demo flow toward a single auditable application model that can later support persistence and real-time synchronization.
- Extracted and hardened the dashboard drawer, restored the `/demo` background under the drawer provider, and fixed the mobile scrollbar regression.
  Goal: stabilize the primary admin surface before more state-architecture work lands.
- Locked the frontend to the current dark theme and added a top-level application error boundary.
  Goal: simplify the visual baseline and improve recovery from unexpected runtime failures.
- Created the Event Sourced State Guard agent and a living PRD for the local-first architecture roadmap.
  Goal: document the target architecture and give future refactors a shared operating model.
