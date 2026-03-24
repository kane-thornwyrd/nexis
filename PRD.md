# PRD: NEXIS

## 1. Product overview

### 1.1 Document title and version

- PRD: NEXIS

- Version: 0.1.0

### 1.2 Product summary

NEXIS is a local-first stream enhancer with widgets and data. It is built on Bun, React, and TypeScript and is intended to give streamers a fast local control surface for configuring stream enhancements, previewing output, and delivering future render views for streaming software able to compose a web source.

Today the product provides a main admin surface and the first shared-state foundation for local experimentation. The current admin experience can still be used to validate presentation patterns, but it should not be treated as the authoritative source of long-term product functionality.

The longer-term direction is to turn the project into a packaged single executable that lets users define enhancement configurations, bind widgets to data, preview the result, publish consistent render surfaces, synchronize updates locally, persist state safely, and inspect change history when needed.

### 1.3 First-pass domain model

- **Overlay**: A configuration of widgets meant to be composed on top of a video stream. It is not a single isolated panel or one-off component. A representative overlay might combine a chat widget that merges Twitch and YouTube chat on the right side of the viewport, a now-listening widget that shows the current track title and artist at the bottom of the viewport, and a donation-goal widget that displays progress toward an Ulule campaign goal.

- **Widget**: An element that belongs to an overlay and can be positioned on the rendering viewport. A widget will typically render a template filled with data, but it can also be non-renderable while still remaining part of the overlay definition.

- **Data source**: Any input that can drive a widget. Data sources may come from in-house processing such as simple mathematical operations, file contents, or command results, as well as from third-party APIs or scraped sources such as RSS or Atom feeds.

- **Template**: The rendering or behavior definition a widget uses to turn its data into visible output or other widget behavior. In most cases, a renderable widget displays a template filled with current data.

- **Viewport placement**: The placement rules that determine where a renderable widget appears in the output viewport. Typical placements include a right-side chat rail, a bottom now-listening bar, or a floating donation-goal module.

- **Permission**: An explicit capability granted to a widget. Permissions may allow access to protected inputs or controlled actions, such as altering the current overlay or switching which overlay is displayed.

## 2. Goals

### 2.1 Business goals

- Establish NEXIS as a dependable local-first control surface for stream-facing widgets and overlay workflows.

- Reduce the time required to tune stream-related content and preview it safely before use in render surfaces.

- Create a reusable product foundation that supports admin tools and future render routes for streaming software able to compose a web source without parallel implementations.

- Support a packaged binary workflow that can run locally without a hosted backend dependency.

- Keep the product architecture testable and stable so future synchronization and persistence work can land without repeated rewrites.

### 2.2 User goals

- Configure stream enhancements without needing direct code edits.

- Bind widgets to relevant local or connected data and preview the result before publishing.

- Publish a render-safe output that matches the operator-approved preview.

- Recover safely from mistakes through undo, reset, and future persisted recovery.

- Run the tool locally with minimal setup and predictable behavior.

### 2.3 Non-goals

- Building a cloud-hosted multi-tenant product in the current iteration.

- Supporting branching history or destructive undo behavior.

- Finalizing the long-term backend API or transport contract before the product needs it.

- Delivering a broad visual redesign unrelated to operator workflows and product direction.

- Treating the current `/render/:mode?` placeholder as the final render experience.

## 3. User personas

### 3.1 Key user types

- Streamers

- Visual designers and technical producers

- Render consumers and users of streaming software able to compose a web source

- Local maintainers and integrators

### 3.2 Basic persona details

- **Streamers**: Need a fast local surface for assembling stream enhancements, configuring behavior, and validating output during setup or live preparation.

- **Visual designers and technical producers**: Need to preview widgets, typography, theme tokens, and UI states quickly while evaluating how the overlay feels in context.

- **Render consumers**: Need stable render routes that reflect the operator-approved projected state without exposing editing controls.

- **Local maintainers and integrators**: Need to launch, configure, package, and eventually persist the application safely on supported host machines.

### 3.3 Role-based access

- **Streamers/Admins**: Can access admin-oriented surfaces such as `/`, manage the current enhancement configuration, use undo and reset, and eventually inspect history or audit information.

- **Render viewers**: Can load render routes intended for viewing output only and should not be able to modify the underlying state.

- **Maintainers**: Can configure runtime behavior, ports, packaging, persistence, and local bootstrap behavior. They may also manage any future access configuration.

- **Guests**: Are not a primary current product role. If public or semi-public routes are introduced later, they should default to read-only behavior.

## 4. Functional requirements

- **Enhancement configuration management** (Priority: High)

  - Allow users to create, open, duplicate, reset, and eventually save local stream-enhancement configurations.

  - Keep a clear distinction between the currently edited configuration and any published render output.

  - Provide a safe default starting state for first-time usage.

- **Widget composition and layout** (Priority: High)

  - Allow users to add, remove, enable, disable, and reorder widgets or overlay modules.

  - Treat an overlay as a composition of multiple widgets arranged across the video viewport rather than as a single widget.

  - Treat widgets as positionable overlay elements, while still allowing some widgets to remain non-renderable members of the overlay.

  - Support configuring widget placement, grouping, and visibility rules for render surfaces.

  - Support placements such as a right-side chat rail, a bottom now-listening bar, or a floating donation-goal module.

  - Reflect composition changes in preview before publication.

- **Data input and mapping** (Priority: High)

  - Allow widgets to consume manual inputs, local state, and future connected data sources.

  - Support template-oriented widgets that render processed data rather than only static content.

  - Support mapping data fields to widget properties without requiring direct code edits.

  - Support widgets driven by multi-source and service-specific data, such as merged Twitch and YouTube chat, music metadata, and Ulule campaign progress.

  - Support in-house processed inputs such as simple mathematical operations, file contents, and command results.

  - Support external inputs such as third-party APIs and scraped web content, including RSS and Atom feeds.

  - Handle missing, stale, or invalid data gracefully.

- **Preview and visual sandboxing** (Priority: High)

  - Provide a live preview surface that mirrors the current enhancement state.

  - Keep visual sandboxing subordinate to product requirements rather than letting cosmetic experiments define the product scope.

  - Allow users to validate visual polish, typography, and layout before publishing.

- **Render delivery** (Priority: High)

  - Drive `/render/:mode?` from the shared projected state rather than an isolated implementation.

  - Keep render routes optimized for streaming software able to compose a web source.

  - Support mode-specific render behavior where needed without forking the core model.

- **State history, undo, and audit** (Priority: High)

  - Represent accepted changes as append-only history entries.

  - Support undo through compensating entries rather than destructive rewrites.

  - Provide enough structured history to support a future audit surface and troubleshooting workflow.

- **Widget permissions and control behavior** (Priority: Medium)

  - Allow specific widgets to be granted permission to alter the current overlay state or switch which overlay is currently displayed.

  - Keep widget permissions explicit, auditable, and revocable.

  - Prevent unprivileged widgets from mutating overlay selection or other protected global behavior.

- **Persistence and recovery** (Priority: Medium)

  - Persist accepted configurations and history locally through SQLite or an equivalent storage layer.

  - Rehydrate projected state from stored history on startup.

  - Fail safely if persisted data is missing, outdated, or partially invalid.

- **Real-time synchronization** (Priority: Medium)

  - Propagate accepted admin changes to render surfaces in real time.

  - Keep admin, preview, and render projections consistent.

  - Recover cleanly from temporary synchronization interruptions.

- **Access control and runtime administration** (Priority: Medium)

  - Support clear access boundaries between admin-editing routes and render-only routes.

  - Introduce secure admin access if access restrictions are enabled.

  - Preserve a friction-light local workflow when access restrictions are disabled.

- **Packaged local runtime** (Priority: Medium)

  - Run through the development watcher and host-platform compiled binaries.

  - Respect local configuration and `PORT` override behavior.

  - Bootstrap required local runtime assets, config, and database dependencies predictably.

## 5. User experience

### 5.1. Entry points & first-time user flow

- Operators start the app locally through `bun dev` or a packaged binary and arrive at the admin shell.

- First-time users are guided toward a starter enhancement configuration rather than raw technical controls.

- The main admin surface can be used to evaluate layout, theming, and interaction polish, but it is not the product definition by itself.

- Users define or open the current enhancement configuration, connect or enter the data it needs, and preview the result.

- Users can open a render route to validate how the published output will appear in streaming software.

- Users discover reset, undo, and future save/load affordances early so experimentation feels safe.

### 5.2. Core experience

- **Launch the app**: Operators start the local app and open the browser UI.

  - Startup should be predictable and should clearly expose the available product surfaces.

- **Create or open an enhancement configuration**: Operators begin from a saved setup, a starter preset, or a new blank state.

  - The first working surface should feel approachable and should not require code knowledge to begin.

- **Configure widgets and data mappings**: Operators define which widgets appear, how they are arranged, and which inputs drive them.

  - Configuration changes should be understandable, reversible, and safely validated before publication.

- **Preview and refine presentation**: Operators use preview and sandbox surfaces to validate visual polish, layout, and readability.

  - Visual feedback should feel immediate, stable, and clearly connected to the current enhancement configuration.

- **Publish to render surfaces**: Operators open or embed render routes that consume the approved shared state.

  - Render views should remain lightweight, read-only, and suitable for streaming software able to compose a web source.

- **Recover, save, and inspect changes**: Operators undo, reset, save, reload, or inspect history as needed.

  - Recovery and persistence flows should make experimentation safe instead of risky.

### 5.3. Advanced features & edge cases

- Missing or stale data should fall back gracefully rather than breaking the preview or render output.

- Non-renderable widgets should remain configurable and visible in the overlay list even when they do not draw directly into the viewport.

- Widgets that can alter overlay state or active-overlay selection should be permission-gated and auditable.

- Widget configurations should validate before publication.

- File, command, API, and feed-backed widgets should fail safely when their data sources are unavailable or malformed.

- No-op updates should not create meaningless history entries.

- Undo should remain correct across multi-step edits and reset events.

- Render routes should degrade gracefully if synchronization is temporarily unavailable.

- Local startup should still communicate clear errors when config or database bootstrap fails.

- Port overrides should work when the default port is unavailable or already in use.

- Access restrictions should protect editing surfaces without breaking render-only usage.

### 5.4. UI/UX highlights

- Dark-first control-room aesthetic that favors focused operator workflows.

- Preview-first workflow that keeps user intent visible while editing.

- Clear separation between editing surfaces, visual sandbox surfaces, and render-only surfaces.

- Flexible widget and data composition matters more than any one sandbox layout.

- Fast feedback for changes, validation, and recovery actions reduces ambiguity.

- Reset and undo affordances reduce fear of experimentation.

## 6. Narrative

A streamer wants to assemble an on-brand set of stream enhancements before going live because the show context, data sources, and visual priorities change from session to session. They open NEXIS locally, start from a reusable configuration, configure widgets and data mappings, refine the presentation in preview, and publish a render-safe output for streaming software able to compose a web source. The tool works for them because it keeps composition, preview, recovery, and future synchronization in one local workflow instead of scattering those steps across ad hoc edits in streaming software able to compose a web source.

## 7. Success metrics

### 7.1. User-centric metrics

- At least 90% of first-time operators can create or open an enhancement configuration and produce a first working preview within 5 minutes of launch.

- At least 95% of accepted edits are reflected in the preview in under 1 second on target local hardware.

- At least 80% of recovery attempts using undo or reset complete without requiring a manual refresh.

- Operators can reliably distinguish editing routes, sandbox routes, and render-only routes during validation sessions.

### 7.2. Business metrics

- Reduce the time needed to assemble a usable stream enhancement layout by at least 50% compared with manually editing isolated values in streaming software able to compose a web source.

- Reach a stable packaged-binary workflow across supported local development targets.

- Reuse one shared product model across admin, sandbox, and render flows rather than maintaining parallel state implementations.

- Lower regression risk for core operator workflows through shared-state coverage and documented product requirements.

### 7.3. Technical metrics

- At least 95% of replayed state histories reconstruct projected state without divergence from expected outcomes.

- Target local render synchronization latency below 250 ms once real-time propagation is implemented.

- Keep packaged startup under 5 seconds on target hardware after binary launch.

- Keep projected-state replay within 500 ms for expected near-term session histories before optimization work is required.

## 8. Technical considerations

### 8.1. Integration points

- Bun server for local routing, runtime behavior, and future synchronization endpoints.

- Wouter-based client routes for admin, demo, and render surfaces.

- Future SQLite persistence for accepted history and startup rehydration.

- Future WebSocket or similar push-based synchronization for admin-to-render propagation.

- Consumption of `/render/:mode?` routes by streaming software able to compose a web source.

- Local configuration files, TLS assets, and packaged binary bootstrap behavior.

### 8.2. Data storage & privacy

- Store operator-facing configuration and accepted history locally by default.

- Persist only the minimum required configuration state, history, and audit context necessary for product behavior.

- Avoid external data transmission by default in the local-first model.

- Treat admin and render routes as distinct access surfaces when access restrictions are enabled.

- Plan for redaction or omission of sensitive values from future audit or persisted history views if needed.

### 8.3. Scalability & performance

- Keep edit-to-preview latency low on local hardware.

- Add snapshotting or replay optimization as history grows.

- Use selector-driven reads to avoid unnecessary rerenders of unrelated UI.

- Keep render routes lightweight and stable for streaming software able to compose a web source.

- Maintain acceptable binary build, startup, and restart behavior during local development and packaged usage.

### 8.4. Potential challenges

- Designing the synchronization contract without overcoupling the product to one transport shape.

- Keeping admin and render projections fully consistent as more surfaces are added.

- Managing SQLite persistence, migration, and rehydration without destabilizing the local-first model.

- Adding access control without hurting local simplicity or operator speed.

- Handling HTTPS, certificate, and runtime quirks across host platforms.

## 9. Milestones & sequencing

### 9.1. Project estimate

- Large: 8-16 weeks from the current foundation to reach a persistence-backed, render-synchronized, packaged operator-ready milestone.

### 9.2. Team size & composition

- Medium Team: 3-5 total people

  - Product manager, 2-3 engineers, 1 designer, and part-time QA support

### 9.3. Suggested phases

- **Phase 1**: Expand shared-state surfaces beyond the current sandbox and foundation work (2-3 weeks)

  - Key deliverables: projected render route, improved admin shell behavior, additional selector-driven integrations

- **Phase 2**: Add history and audit product surfaces (1-2 weeks)

  - Key deliverables: operator-visible history view, accepted command and event display, undo context in the UI

- **Phase 3**: Implement real-time synchronization between admin and render surfaces (2-3 weeks)

  - Key deliverables: transport contract, push-based updates, render consistency checks

- **Phase 4**: Add SQLite persistence and startup rehydration (2-4 weeks)

  - Key deliverables: stored history, local database bootstrap, replay on startup, failure handling

- **Phase 5**: Harden packaged runtime and access boundaries (1-2 weeks)

  - Key deliverables: config bootstrap, admin-vs-render access protection, startup and recovery polish

## 10. User stories

### 10.1. Launch the admin surface

- **ID**: US-001

- **Description**: As a streamer, I want to open the local admin surface so that I can manage my stream enhancement setup from one place.

- **Acceptance criteria**:

  - The local app exposes a browser-accessible admin route after startup.

  - The admin surface loads without requiring a hosted backend.

  - A usable starting configuration or entry point is visible when the surface opens.

  - The route works in both development and packaged runtime flows.

### 10.2. Create or open an enhancement configuration

- **ID**: US-002

- **Description**: As a streamer, I want to create or open an enhancement configuration so that I can work on a reusable stream setup instead of starting from scratch every time.

- **Acceptance criteria**:

  - I can start from a new configuration, a starter preset, or a previously saved setup.

  - The app clearly shows which configuration is currently being edited.

  - Opening a configuration restores its editable state.

  - Resetting to a safe baseline is available when needed.

### 10.3. Add and configure widgets

- **ID**: US-003

- **Description**: As a streamer, I want to add and configure widgets so that I can assemble the enhancement experience I need for a specific show or scene.

- **Acceptance criteria**:

  - I can add supported widgets or modules to the current configuration.

  - I can configure renderable widgets and also keep non-renderable widgets in the overlay definition when they serve a supporting role.

  - I can edit the main settings for each widget without direct code changes.

  - Invalid widget configurations are rejected or surfaced clearly.

  - Widget changes update the current working state immediately.

### 10.4. Arrange widget layout and visibility

- **ID**: US-004

- **Description**: As a streamer, I want to arrange widget layout and visibility so that the rendered output matches the intended composition.

- **Acceptance criteria**:

  - I can reorder widgets or modules within the current configuration.

  - I can enable, disable, or hide widgets without deleting them.

  - Layout and visibility changes are reflected in preview before publication.

  - The resulting composition remains stable across refresh or reload after persistence is implemented.

### 10.5. Provide manual or connected data inputs

- **ID**: US-005

- **Description**: As a streamer, I want widgets to consume manual inputs or connected data so that the enhancement output can reflect the current context.

- **Acceptance criteria**:

  - I can supply manual data for widgets when no live source is connected.

  - Widgets can consume in-house processed data such as simple mathematical operations, file contents, or command results.

  - The system can map widget properties to future connected data inputs.

  - Widgets can consume external inputs such as third-party APIs or scraped RSS and Atom feeds.

  - Missing, stale, or invalid data does not crash the preview or render output.

  - Widgets surface a predictable fallback state when valid data is unavailable.

### 10.6. Preview the current enhancement state live

- **ID**: US-006

- **Description**: As a streamer, I want a live preview of the current enhancement state so that I can validate the result before publishing it to render surfaces.

- **Acceptance criteria**:

  - Accepted configuration changes appear in preview without manual refresh.

  - Preview behavior stays consistent with the currently edited configuration.

  - Preview remains visible while I continue editing.

  - Preview rendering stays stable when multiple fields or widgets change in sequence.

### 10.7. Use the admin surface as a visual sandbox

- **ID**: US-007

- **Description**: As a designer or technical producer, I want the main admin surface to support visual sandboxing so that I can refine cosmetics and interaction polish without confusing that work with final product requirements.

- **Acceptance criteria**:

  - The main admin surface supports visual experimentation without becoming a separate product definition.

  - The sandbox can be used to validate layout, theme, and interaction polish.

  - Cosmetic experiments do not redefine the canonical product scope by themselves.

  - The sandbox remains useful without becoming the only supported workflow.

### 10.8. Publish to a render surface

- **ID**: US-008

- **Description**: As a render consumer, I want `/render/:mode?` to reflect the approved shared state so that output for streaming software able to compose a web source stays consistent with operator intent.

- **Acceptance criteria**:

  - `/render/:mode?` renders from shared projected state instead of a placeholder page.

  - Render routes remain read-only from the perspective of editing workflows.

  - Changes accepted in admin surfaces appear in the render surface.

  - Render behavior remains stable when a route mode is omitted or changed.

### 10.9. Undo or reset recent changes

- **ID**: US-009

- **Description**: As a streamer, I want to undo or reset changes so that I can recover quickly from mistakes while editing the current enhancement setup.

- **Acceptance criteria**:

  - Undo appends a compensating history entry instead of mutating existing history.

  - Reset returns the configuration to a safe baseline when requested.

  - No-op recovery actions do not create meaningless history entries.

  - Recovery actions are clearly available and trustworthy in the UI.

### 10.10. Save and restore local state

- **ID**: US-010

- **Description**: As a streamer, I want my enhancement setup to survive restarts so that I do not lose work between sessions.

- **Acceptance criteria**:

  - Accepted configuration history can be persisted locally.

  - The app can restore projected state from persisted history on startup.

  - Rehydrated state matches the last successfully saved state.

  - Corrupt or unavailable persisted data fails safely without crashing the whole app.

### 10.11. Inspect history and audit context

- **ID**: US-011

- **Description**: As a streamer, I want to inspect accepted commands and events so that I can understand what changed and recover with confidence.

- **Acceptance criteria**:

  - The UI exposes a history or audit surface for accepted entries.

  - Each entry shows when it happened and which command suite produced which event.

  - Undo-related entries are distinguishable from ordinary changes.

  - The history view reflects the same append-only model used for replay.

### 10.12. Synchronize admin changes to render surfaces in real time

- **ID**: US-012

- **Description**: As a streamer, I want accepted changes to propagate to render surfaces in real time so that live output stays in sync with the control surface.

- **Acceptance criteria**:

  - Accepted admin changes are pushed to connected render surfaces without manual refresh.

  - Render surfaces apply updates in order and remain consistent with the current projected state.

  - Temporary transport interruptions recover without duplicating or losing accepted changes.

  - The domain model remains usable even if the final transport protocol changes later.

### 10.13. Handle missing or invalid data gracefully

- **ID**: US-013

- **Description**: As a streamer, I want missing or invalid data to fail gracefully so that the product stays usable during imperfect runtime conditions.

- **Acceptance criteria**:

  - Missing or stale data produces a fallback state instead of a broken surface.

  - Invalid data mappings are surfaced clearly to the user.

  - The projected state remains deterministic after ignored or invalid inputs.

  - Render output continues operating in a degraded but understandable state where possible.

### 10.14. Protect admin access while preserving render access

- **ID**: US-014

- **Description**: As a maintainer, I want admin-editing routes to be protected when access restrictions are enabled so that control surfaces are not modified by unauthorized viewers.

- **Acceptance criteria**:

  - The product can distinguish admin-editing surfaces from render-only surfaces.

  - When access protection is enabled, unauthorized users cannot change admin state.

  - Render-only consumers can still access the surfaces intended for viewing.

  - Authentication or access controls do not block local operator workflows when explicitly disabled.

### 10.15. Launch the packaged runtime with local bootstrap behavior

- **ID**: US-015

- **Description**: As a maintainer, I want the packaged application to initialize its config and local database cleanly so that streamers can run it without manual setup steps.

- **Acceptance criteria**:

  - The packaged binary starts on supported host platforms.

  - Required config and database files are created or discovered automatically.

  - Startup failures surface actionable errors instead of silent exits.

  - Runtime behavior remains consistent with the development experience where applicable.

### 10.16. Allow privileged widgets to alter overlay behavior

- **ID**: US-016

- **Description**: As a streamer or maintainer, I want specific widgets to be able to alter the current overlay or switch which overlay is displayed so that overlay behavior can react to runtime conditions without giving every widget global control.

- **Acceptance criteria**:

  - Widget capabilities that can alter overlay behavior are explicitly permission-gated.

  - Authorized widgets can request changes to the current overlay or the displayed overlay.

  - Unauthorized widgets cannot mutate protected overlay-selection behavior.

  - Widget-triggered overlay changes are auditable through the same history model used for other accepted changes.

