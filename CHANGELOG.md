# CHANGELOG

This file tracks significant changes to the codebase and the goal behind each change.

## Entries

Add new entries in reverse chronological order.

### 2026-03-27
- Tightened the Art Direction, widget-resource-tag, bundled starter-content, and guided-recipe-onboarding wording by renaming the glossary's opening concept section to `Core concepts`, aligning recipe terminology around bundled starter recipes and guided recipe wizards, and bumped `PRD.md` to `1.1.1` for this non-normative cleanup.
  Goal: reduce small terminology drift across the glossary, PRD, changelog, and task tracker without changing the documented feature set.
- Defined Art Direction archives, widget resource tags, bundled starter widgets and data scrapers, and recipe-based welcome-page onboarding with a guided recipe wizard, and bumped `PRD.md` to `1.1.0` for this additive requirements expansion.
  Goal: make NEXIS easier to start, easier to style, and easier to share by bundling reusable visual direction and guided starter configurations into the product model.
- Added the direct `releases/latest` GitHub link to the end-user README so streamers can jump straight to the newest packaged release notes and downloads.
  Goal: reduce friction between discovering NEXIS and actually reaching the latest packaged build.
- Tightened the README and developer guide wording by removing a duplicated README status section and aligning the developer guide with the executable-first user-facing messaging.
  Goal: reduce small wording drift between the end-user and Bun-focused documentation without changing project guidance.
- Reoriented the main README toward streamers and end users, moved Bun/dev workflow details into `DEVELOPER_README.md`, and rewrote the public-facing README tone around the product's value and direction.
  Goal: make the front page sell the product vision to creators instead of reading like internal development notes.
- Tightened the icon-first-action, scraper fake-event, overlay publication-state, and account-linking terminology by promoting overlay revision and credential or auth grant into explicit glossary concepts, aligning the PRD's staging-route wording, and bumping `PRD.md` to `1.0.1` for this non-normative cleanup.
  Goal: reduce residual terminology drift across the glossary, PRD, changelog, and task tracker without changing the documented product behavior.
- Defined icon-first UI action guidance, fake-event-capable data scrapers, overlay-specific staging and live routes, and secure account-linking requirements with OAuth2-style guidance where supported, and bumped `PRD.md` to `1.0.0` for this incompatible route and workflow change.
  Goal: make operator workflows more testable and ergonomic while separating staged overlay validation from live render output and clarifying how upstream account access should be linked and secured.
- Tightened the executable-first onboarding and packaged-runtime local HTTPS wording by defining the local TLS asset term in the glossary, removing a duplicate packaged-runtime bootstrap user-story description, normalizing the TLS asset phrasing across the tracker and requirements, and bumped `PRD.md` to `0.5.1` for this non-normative cleanup.
  Goal: reduce small terminology drift around packaged-runtime HTTPS bootstrap without changing the documented onboarding or local HTTPS behavior.
- Documented executable-first onboarding for end users, kept `bun dev` as a developer-oriented workflow, added automatic local HTTPS bootstrap requirements for packaged runtime startup, and bumped `PRD.md` to `0.5.0` for this additive requirements expansion.
  Goal: make the first-time-user path center on the bundled executable while removing manual TLS certificate generation as an expected user responsibility.
- Tightened the source-available licensing docs so the README, license notice, commercial-licensing note, and contributing guide consistently use the full PolyForm license name and the same public-license wording.
  Goal: reduce small terminology drift across the new licensing files without changing the project's licensing model or contribution flow.
- Added a source-available licensing setup around the PolyForm Noncommercial License 1.0.0, a commercial-licensing note, a DCO-based contributing guide, and a README License section.
  Goal: make the project's public licensing and contribution path explicit without opening commercial use by default.
- Added README sections for Contributing and Sponsors so contribution guidance and sponsorship links have clear dedicated entry points as the project grows.
  Goal: make the public-facing project metadata easier to extend without waiting for the full contributing guide or sponsor setup to exist.
- Tightened the manifest and terminology docs by clarifying that manifest `file` values are archive-relative paths, normalizing a few leftover UI-oriented `surface` phrases in the changelog history, and bumping `PRD.md` to `0.4.1` for this non-normative cleanup.
  Goal: reduce small remaining terminology drift after the manifest, Sankey-example, and UI-language documentation pass without changing product behavior.

### 2026-03-26
- Finalized the first-pass pipeline archive packaging contract by fixing the manifest file to `manifest.json` at the root of a zip archive, treating serialized format versions as opaque strings owned by artifact or plugin authors, adding a fake Mermaid Sankey example for the data-flows admin UI, and replacing several UI-oriented `surface` references with `UI`, then bumped `PRD.md` to `0.4.0` for this additive requirements expansion.
  Goal: make the archive contract concrete, keep import or export compatibility author-owned, and align the product language more directly with UI terminology.
- Tightened the pipeline archive manifest and serialized-format-version wording so the glossary and PRD consistently describe widget save or restore `mode`, participating exported elements, and plugin-provided artifacts, and bumped `PRD.md` to `0.3.1` for this non-normative cleanup.
  Goal: reduce residual terminology drift after the first-pass pipeline archive manifest documentation pass without changing the import or export model.
- Added a first-pass manifest direction for whole-diagram pipeline archives and generalized serialized format versions across importable and exportable artifacts, including plugin-provided ones, and bumped `PRD.md` to `0.3.0` for this additive requirements expansion.
  Goal: make archive import or export more inspectable and compatible without inventing a separate diagram schema, while keeping evolving artifact structures safe to load through explicit per-artifact versions.
- Tightened the PRD versioning wording so the repo instructions, enforcement hook feedback, changelog, and task tracker consistently use approximate semantic versioning and the same bump categories.
  Goal: reduce terminology drift around the PRD version policy without changing the enforcement behavior.
- Added PRD versioning guidance based on approximate semantic versioning, bumped `PRD.md` to `0.2.0` for the current additive requirements expansion, and introduced an enforceable hook that blocks PRD edits without a valid increasing version bump.
  Goal: keep PRD versioning disciplined through a combination of explicit policy and automatic enforcement instead of relying on memory.
- Tightened the archive-based pipeline import/export and widget save/restore wording so the glossary, PRD, changelog, and task tracker consistently describe whole-diagram pipeline-configuration archives, full-configuration widget save/restore, and pipeline import/export using the data-flow-resource-only widget mode.
  Goal: reduce terminology drift after the archive-based pipeline import/export documentation pass without changing the intended pipeline behavior.
- Documented that pipeline import or export uses an archive of the participating elements' own serialized formats, and that widgets expose both full-configuration and data-flow-resource-only save or restore modes with the pipeline editor using the latter.
  Goal: avoid inventing a separate binding wire format while keeping widget-level export behavior explicit for diagram-driven configuration.
- Tightened the derived admin pipeline-editor wording so default retriever placement is consistently described as a dependency-derived midpoint, whole-diagram import/export is consistently described as pipeline configuration, binding persistence is described as element-owned identifiers rather than separate connection objects, and per-user visual preferences use stable accessible color assignments.
  Goal: reduce residual terminology drift after the derived-model documentation pass without changing the intended pipeline-editor behavior.
- Documented the derived admin pipeline-editor model more precisely: stable ids for diagram-addressable elements, dependency-derived midpoint retriever placement, primary-UI status for event-driven configuration, element-owned binding identifiers, per-user local visual preferences, and history-safe undo of propagated downstream effects.
  Goal: capture the pipeline editor as a faithful view over persisted element configuration rather than a separate saved diagram model.
- Tightened the remaining admin pipeline-editor wording so data flow resources are consistently described as widget-field-dot-backed listeners that extract or transform events into widget-usable values, and aligned the implementation tracker with direct-on-flow bindings.
  Goal: reduce residual terminology drift after the direct-on-flow widget-field-dot clarification without changing the intended admin pipeline workflow.
- Clarified that widget-field dots in the admin alluvial-diagram workflow are placed directly on flows, so the represented data flow resource ingests events from the flow the dot is placed on.
  Goal: remove ambiguity between direct-on-flow placement and separate wiring interactions in the pipeline editor model.
- Tightened the richer admin alluvial-diagram workflow wording across the glossary, PRD, changelog, and task tracker so bindings, widget-instance scope, and individual retriever versus whole-diagram pipeline configuration import/export stay aligned.
  Goal: reduce terminology drift after the workflow-doc expansion without changing the intended admin pipeline behavior.
- Documented the richer admin alluvial-diagram pipeline workflow: scrapers as flow origins, retrievers as configurable nodes, widget-field dots as data flow resources, downstream disable warnings, and retriever or whole-diagram pipeline configuration import and export.
  Goal: turn the earlier pipeline-visualization direction into a concrete admin workflow for configuring and inspecting event-driven widget hydration.
- Clarified that data retrievers can subscribe to multiple upstream data sources non-destructively, and documented the admin pipeline visualization direction as a dynamic Sankey or alluvial view with direct D3.js integration.
  Goal: make multi-source pipeline derivations understandable and configurable in the admin UI without hiding the actual flow topology.
- Refined the data-scraper definition so each scraper creates exactly one single-domain data source.
  Goal: keep scraper boundaries explicit enough that chat, follows, and similar upstream domains do not get bundled into ambiguous mixed sources.
- Tightened the glossary, PRD, changelog, and task tracker wording so overlay-scoped behavior consistently refers to widget instances, data flow resources are described as widget-facing listeners on data sources, and the latest event-pipeline tracking copy names upstream data sources explicitly.
  Goal: reduce residual terminology drift after the data-source creation refinement without changing the intended event-pipeline model.
- Refined the event-pipeline vocabulary so data scrapers create single-domain data sources directly, while data retrievers listen to one or more upstream data sources and derive new downstream data sources.
  Goal: align the terminology with the intended pipeline shape before implementation starts hardening around the wrong source-creation boundary.
- Stepped the normalized capability event envelope and actor/chat subshape docs back from exact low-level field lists to concern-level guidance.
  Goal: avoid premature schema lock-in while keeping the normalization model and invariants clear enough for early implementation.
- Tightened the glossary and PRD wording so the normalized event and actor/chat schema guidance stays explicitly concern-level, and aligned the tracking terminology around actor/chat schema.
  Goal: reduce terminology drift after the schema-doc rollback without reintroducing fixed low-level field lists.
- Refined the actor model so normalized capability events use provider-account-scoped normalized actor account references with optional canonical actor identity references for cross-provider matching, instead of treating observed actor accounts as already person-level identities.
  Goal: keep event provenance precise while allowing multiple provider accounts to resolve to the same person or entity in NEXIS.

### 2026-03-25
- Documented the normalized actor account reference and normalized chat source context for chat events, and made the chat event shape use `sourceContext` as the canonical field for chat source context instead of a separate `roomContext` concept.
  Goal: reduce overlap in the chat event schema and give adapters one precise actor-account shape and one chat-source-context shape to normalize against.
- Documented the initial normalized capability event envelope and the first normalized event shapes for the chat events, subscription events, payment events, and social activity events capability ports.
  Goal: give future core ports and external platform adapters a shared event shape to implement instead of normalizing payloads ad hoc.
- Documented the shared external platform plugin contract in the glossary and PRD with identity, configuration, lifecycle, and declarations of which capability-oriented ports a plugin supports, and documented the first capability-oriented ports for chat events, subscription events, payment events, and social activity events.
  Goal: give future plugin and adapter implementation a concrete shared contract instead of only an abstract architectural preference.
- Refined the hexagonal-architecture guidance so external platform integrations use a shared plugin contract and capability-oriented ports instead of introducing provider-specific ports in the core.
  Goal: keep new platform adapters extensible without baking provider names into the core architecture.
- Added explicit hexagonal architecture guidance to the glossary, PRD, and repo instructions, and documented a first catalog of external platform adapters for Discord, Twitch, YouTube, PeerTube, ActivityPub, TikTok, PayPal, and Tipeee or TipeeeStream.
  Goal: make dependency direction explicit and keep provider-specific adapters outside the core model as the project grows.
- Defined the event-pipeline model more precisely by introducing data scrapers, data retrievers, and data sources as distinct glossary and PRD concepts, clarifying that data flow resources are widget-facing listeners on data sources rather than source creators.
  Goal: give implementation a stable event-ingestion and event-distribution vocabulary instead of overloading data flow resources with upstream retrieval responsibilities.
- Replaced the older overloaded `data source` umbrella term with `data flow resource` across the glossary and PRD, merged that old umbrella definition into the new resource concept, and moved data flow resource foundations earlier in the implementation roadmap.
  Goal: align the vocabulary with the widget-resource model and make data flow resources available early enough for dependent widget behaviors.

### 2026-03-24
- Refined the widget vocabulary in the glossary and PRD by defining widgets as reusable importable and exportable source objects, defining widget instances as overlay-scoped instantiations, introducing widget resources and overlay dependencies, and adding overlay dependency handling plus widget import and export expectations to the product spec.
  Goal: make the reusable-widget model explicit enough to support future implementation without overloading the old "widget" concept.
- Added a root `GLOSSARY.md` for the NEXIS domain vocabulary, organized it with browse sections, internal links, and a Mermaid domain map, and added repo instructions to keep future domain-vocabulary changes synchronized with the glossary.
  Goal: keep domain terminology discoverable and maintainable in the repository instead of letting it drift across chats, instructions, and PRD prose.
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
  Goal: stop treating the operator UI as a demo-only UI and make the root route the main entrypoint.
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
- Added a first-pass PRD domain model section defining overlay, widget, the then-current overloaded `data source` umbrella concept later refined into `data flow resource` plus a narrower `data source` event-stream term, template, viewport placement, and permission.
  Goal: give future product, architecture, and UX work a stable shared vocabulary instead of relying on scattered prose definitions.
- Expanded focused Bun coverage for process lifecycle management, server port resolution, app-state reducers and factories, shared helpers, selectors, and history edge cases.
  Goal: protect the highest-risk pure logic with direct regression tests and reduce the chance of silent behavior drift.
- Fixed the HTML font-size hook cleanup path and validated the result with focused tests plus Linux build and smoke checks.
  Goal: preserve the previous root font-size correctly on cleanup while proving the app still builds and starts cleanly.
- Added repo workflow guidance for maintaining `tasks.md` and a root `CHANGELOG.md`, and backfilled the changelog with prior milestones.
  Goal: keep planning, validation, and release notes synchronized as significant changes land.

### 2026-03-23
- Introduced client-side routes for `/`, `/demo`, and `/render/:mode?`, and served the SPA shell for those routes from the Bun backend.
  Goal: separate the admin, demo, and render UIs while keeping the packaged app on a single local-first server entrypoint.
- Added the first event-sourced app-state foundation with immutable types, append-only history, replay, undo, provider wiring, and selector-driven `APITester` state consumption.
  Goal: move the demo flow toward a single auditable application model that can later support persistence and real-time synchronization.
- Extracted and hardened the dashboard drawer, restored the `/demo` background under the drawer provider, and fixed the mobile scrollbar regression.
  Goal: stabilize the primary admin UI before more state-architecture work lands.
- Locked the frontend to the current dark theme and added a top-level application error boundary.
  Goal: simplify the visual baseline and improve recovery from unexpected runtime failures.
- Created the Event Sourced State Guard agent and a living PRD for the local-first architecture roadmap.
  Goal: document the target architecture and give future refactors a shared operating model.
