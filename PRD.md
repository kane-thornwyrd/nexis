# NEXIS: the Product Requirements Document

## 1. Product overview

### 1.1 Document title and version

- NEXIS: the Product Requirements Document

- Version: 7.4.1

### 1.2 Product summary

NEXIS is a local-first stream enhancer with widgets and data. It is built on Bun, React, and TypeScript and is intended to give streamers a fast local control UI for configuring stream enhancements, previewing output, and delivering future render UIs for streaming software able to compose a web source.

Today the product provides a main admin UI and the first shared-state foundation for local experimentation. For almost all end users, the primary entrypoint should be the bundled executable rather than a Bun-driven developer workflow.

The current product direction assumes one effective local operator profile on one machine rather than active multi-user account management. Multi-user support may exist later, but it is not a current priority.

The longer-term direction is to turn the project into a packaged single executable that lets users create NEXIS projects, define enhancement configurations inside them, bind widgets to manual inputs and data flow resources, preview the result, publish consistent render UIs, synchronize updates locally, persist state safely, inspect change history when needed, and serve the local UI over HTTPS with automatically bootstrapped self-signed local TLS assets when none already exist or the existing pair has expired.

In this document, a NEXIS project is the main aggregate root for all user-managed configuration.

In this document, an enhancement configuration means the operator-facing editable setup inside a NEXIS project, spanning one or more overlays together with all widget instances those overlays contain and all data sources, data scrapers, and data retrievers needed by the data flow resources used by those widget instances.

### 1.3 First-pass domain model

- **NEXIS project**: The main aggregate root for all user-managed configuration. It owns the current enhancement configuration together with the user-managed assets and records around it, such as reusable widgets, overlays, Art Directions, recipes, and credentials or auth grants. It is the top-level thing the application creates, opens, duplicates, resets, saves, or persists for a user.

- **Overlay**: A configuration of widget instances meant to be composed on top of a video stream. It is not a single isolated panel or one-off component. A representative overlay might combine a chat widget instance that merges Twitch and YouTube chat toward the right side of the overlay, a now-listening widget instance that shows the current track title and artist near the bottom of the overlay, and a donation-goal widget instance that displays progress toward an Ulule campaign goal. The overlay configuration also carries the widget-instance-specific configuration and an overlay dependency list for the widgets used to create those instances.

- **Enhancement configuration**: The operator-facing editable setup inside a NEXIS project, spanning one or more overlays together with all widget instances those overlays contain and all data sources, data scrapers, and data retrievers needed by the data flow resources used by those widget instances.

- **Widget**: A reusable, importable, and exportable source object that proposes to the person creating or modifying an overlay a way to access visual elements or data in that overlay. A widget can hold reusable resources, styles, event reactions, and other reusable behavior that will be shared by the widget instances created from it. Each widget provides the template used to create and configure its widget instances. Widgets should support both full-configuration save or restore and data-flow-resource-only save or restore, with pipeline import or export using only the latter, and each serialized widget form should carry its own serialized format version string.

- **Widget resource**: A reusable resource exposed by a widget. Current examples include visual resources, sound resources, animated resources, and data flow resources. A resource may come from static code, local files, or another resource-specific storage shape, and each resource kind may define how it is saved when the widget is exported.

- **Art Direction**: A reusable package of overlays plus design-oriented widget resources, such as images, animated assets, and sounds, that can be imported, exported, and reapplied as one archive so users can reuse or share a coherent visual style.

- **Widget resource tag**: A core-standardized classification attached to a widget resource to describe what workflows that resource can participate in. The allowed tags are `art`, `data`, and Art Direction provenance tags derived from Art Direction names, with reserved-name collisions such as `art` or `data` escaped by turning the provenance tag into `[name] + Art Direction`.

- **Data scraper**: A source-side ingestion component that collects data from a concrete upstream input, formats that collected data into events, and creates exactly one single-domain data source from those events. That data source should contain events from a single coherent event domain. Typical upstream inputs include local processing, watched file contents, commands, APIs, RSS or Atom feeds, and external event streams such as MQTT. A scraper should also be able to emit fake events that follow the same downstream event shape so users and developers can test data flows without waiting for live upstream activity. Each scraper should report its own health using source-specific checks that matter for its concrete upstream input, should judge whether the data source it produces is still healthy enough to be useful, and should emit a recovery health event in that same event stream when the source becomes healthy enough again.

- **Data retriever**: A selective aggregation component that subscribes to one or more data sources in a non-destructive way, always depends on at least one upstream data source, and always produces exactly one new downstream data source from the resulting derived event stream. Its filtering and transformation logic should apply only to the targeted ordinary events it is meant to process. Health, halt, and recovery propagation downstream is automatic pipeline behavior rather than retriever-specific transformation logic. If any upstream data source it depends on remains halted or unhealthy, the retriever process should itself be halted until that upstream source emits a recovery health event again.

- **Data source**: A source of events created by a data scraper or a data retriever. A data source should represent a single coherent event domain. Data sources are the event-stream abstraction that downstream data retrievers and data flow resources can listen to. Each data source has one event stream rather than a separate health-status channel beside its ordinary events. When a scraper judges the health of its produced data source to be too poor for useful operation, that data source should be considered halted and should emit a health or halt event in that event stream so widgets can surface understandable degraded behavior. If that source later becomes healthy enough again, it should emit a recovery health event in that same event stream. When automatic propagation carries an upstream health, halt, or recovery event through a data retriever, it should do so through the downstream data source's same event stream.

- **Widget instance**: An overlay-scoped instantiation of a widget. A widget instance keeps a reference to its source widget and updates when that source widget changes. It holds only the configuration that is specific to its use in an overlay, such as opacity, placement, or instance-specific filtering or event-selection rules, and that configuration is saved inside the overlay configuration rather than as a standalone artifact.

- **Overlay dependency**: A widget dependency recorded by an overlay because one of its widget instances was created from that widget. Overlay import or activation should surface the overlay dependency list and still allow the user to continue when some referenced widgets are unavailable.

- **Recipe**: A reusable application-configuration starter that orchestrates one or more overlays, widgets, data scrapers, data retrievers, and related configuration through the app-level shared state so users can begin from guided scenarios instead of from scratch. Recipe imports and exports should use a recipe archive format centered on a main TypeScript recipe file that builds the next app state by issuing commands comparable to the ones the UI would trigger.

- **Data flow resource**: A widget-facing resource that listens to the events of a data source, extracts or transforms those events into values that can hydrate widget fields or other widget inputs, and provides that widget-usable data without creating a new data source. In the admin pipeline editor, only widget fields backed by data flow resources participate as dots.

- **Binding**: The first-pass source-selection rule that a widget field listens to a specific data flow resource or source. Binding identifiers persist on the owning data flow resources rather than as separate diagram-only connection objects, and pipeline import or export uses an archive of each element's own serialized format plus a lightweight manifest rather than inventing a separate whole-diagram binding schema. Manual inputs, fallback values, and degraded behavior are outside the meaning of binding.

- **Pipeline archive manifest**: A lightweight index file included in a whole-diagram pipeline configuration zip archive. In the first pass it should be stored as `manifest.json` at the root of that archive. It should declare `archiveFormatVersion`, `exportedAt`, `sourceAppVersion`, and one entry per participating exported element, where each entry includes `id`, `type`, `name`, archive-relative `file` path, `serializer`, serialized `formatVersion`, `dependencies`, and widget save or restore `mode` when relevant.

- **Serialized format version**: A version string carried by any importable or exportable artifact to describe the structure of its serialized data independently from the app version. Widgets, data scrapers, data retrievers, data flow resources, plugin-provided artifacts, and future importable or exportable artifact kinds should each expose one when they support save or restore or import or export. NEXIS should treat that value as an opaque compatibility label rather than assuming semantic versioning or monotonic ordering, and migration remains the responsibility of the artifact or plugin author rather than the core app. When an artifact loader or plugin rejects an unsupported serialized format version string, the import UI should surface that as a version-mismatch form error and may supplement that required form error with a toast or browser notification when appropriate.

- **Template**: The widget-provided blueprint that defines what a widget contributes when creating its widget instances. A template defines the render or behavior structure used by those instances and the instance-side configuration form used to configure them.

- **Overlay placement**: The placement rules that determine where a widget instance appears inside an overlay. Overlay placement should support named snapping zones, free placement, stored offsets with units, and remembered snapped zones so widget instances remain stable when overlay dimensions change.

- **Layer**: The ordered compositing level that determines how widget instances stack inside an overlay. Higher layer numbers should render above lower layer numbers, with layer numbering starting at `0`.

- **Transform**: The widget-instance-specific geometry state that controls resizing and rotation around a rotation center. The rotation center should default to the center of the widget instance, stay relative to the widget instance position, and be movable by the user.

- **Permission**: An explicit authorization for a concrete plugin-provided element to call a specific core-defined command. Plugin authors declare which core-defined commands their elements request, and commands that alter application state must provide human-readable descriptions so operators can understand the permission they are granting.

- **Overlay revision and publication state**: A distinction between in-progress, staged, and live overlay states. In the current direction, `/staging/:OVERLAY_ID` should expose the staged version of an overlay for validation, while `/render/:OVERLAY_ID` should expose the live version intended for actual use.

- **Preview projection**: The staged overlay output exposed at `/staging/:OVERLAY_ID` for validation without wrapping the overlay in the Admin UI.

- **Render projection**: The finalized published overlay output exposed at `/render/:OVERLAY_ID` for read-only consumption without wrapping the overlay in the Admin UI.

- **Credential or auth grant**: The stored authorization material that lets a data scraper or external-platform adapter access a user's upstream account or API on that user's behalf. It may represent OAuth2 tokens, API keys, or other provider-specific authorization artifacts, should be linkable and revocable from the UI, and should prefer OAuth2-style authorization when the upstream provider supports it.

- **Local TLS asset**: The locally scoped private key and certificate pair the packaged runtime uses to serve the local UI over HTTPS on the same machine. It should not expand to adjacent metadata such as expiry, fingerprint, or generation provenance. If the existing local TLS assets are expired, the runtime should delete them and regenerate a fresh local pair rather than introducing separate operator-facing renewal or trust-management UX.

- **Validation issue**: An explicit warning, error, or blocking issue attached to a user-managed element, field, or workflow state when the application detects invalid configuration, degraded behavior, or another condition the operator should understand. Validation issues should support at least warning, error, and blocking levels, should be shown with clear explanations, may offer a direct fix action when possible, should appear near the relevant form field when they are form-bound, should appear in the data-flow UI when they concern pipeline state, and may be supplemented by toast or browser-notification feedback when appropriate without replacing the primary in-context display.

## 2. Goals

### 2.1 Business goals

- Establish NEXIS as a dependable local-first control UI for stream-facing widgets and overlay workflows.

- Reduce the time required to tune stream-related content and preview it safely before use in render UIs.

- Create a reusable product foundation that supports admin tools and future render routes for streaming software able to compose a web source without parallel implementations.

- Support a packaged binary workflow that can run locally without a hosted backend dependency.

- Keep the product architecture testable and stable so future synchronization and persistence work can land without repeated rewrites.

### 2.2 User goals

- Configure stream enhancements without needing direct code edits.

- Bind widgets to relevant manual inputs and local or connected data flow resources, and preview the result before publishing.

- Publish a render-safe output that matches the operator-approved preview.

- Link upstream accounts securely when external data scrapers need user authorization.

- Start from bundled widgets, data scrapers, and guided recipes instead of an empty system whenever possible.

- Recover safely from mistakes through undo, reset, and future persisted recovery.

- Run the tool locally with minimal setup and predictable behavior.

### 2.3 Non-goals

- Building a cloud-hosted multi-tenant product in the current iteration.

- Supporting branching history or destructive undo behavior.

- Finalizing the long-term backend API or transport contract before the product needs it.

- Prioritizing multi-user account management or concurrent-user workflows in the current local-first phase.

- Delivering a broad visual redesign unrelated to operator workflows and product direction.

- Treating the current placeholder render-route implementation as the final render and staging experience.

## 3. User personas

### 3.1 Key user types

- Streamers

- Visual designers and technical producers

- Render consumers and users of streaming software able to compose a web source

- Local maintainers and integrators

### 3.2 Basic persona details

- **Streamers**: Need a fast local UI for assembling stream enhancements, configuring behavior, and validating output during setup or live preparation.

- **Visual designers and technical producers**: Need to preview widgets, typography, theme tokens, and UI states quickly while evaluating how the overlay feels in context.

- **Render consumers**: Need stable overlay-specific render routes that reflect the operator-approved projected state without exposing editing controls.

- **Local maintainers and integrators**: Need to launch, configure, package, and eventually persist the application safely on supported host machines.

- **Plugin developers**: Need a developer-oriented workflow such as `bun dev` while still targeting the same packaged-runtime behavior end users will rely on.

### 3.3 Role-based access

- **Streamers/Admins**: Can access admin-oriented UIs under `/admin`, manage the current NEXIS project and its enhancement configuration, use undo and reset, and eventually inspect history or audit information.

- **Render viewers**: Can load render routes intended for viewing output only and should not be able to modify the underlying state.

- **Maintainers**: Can configure runtime behavior, ports, packaging, persistence, local bootstrap behavior, and credential or account-linking policies. They may also manage any future access configuration.

- **Plugin developers**: Can use development-oriented workflows, validate plugin behavior against the local app, and rely on the packaged runtime as the target user environment.

- **Guests**: Are not a primary current product role. If public or semi-public routes are introduced later, they should default to read-only behavior.

## 4. Functional requirements

- **NEXIS project and enhancement configuration management** (Priority: High)

  - Allow users to create, open, duplicate, reset, and eventually save NEXIS projects.

  - Keep a clear distinction between the current enhancement configuration being edited inside a NEXIS project and any published render output.

  - Provide a safe default starting state for first-time usage.

  - Surface validation issues clearly when the current NEXIS project or enhancement configuration contains invalid, degraded, or blocked state.

  - Display the overlay dependency list for an overlay configuration.

  - When a user imports or activates an overlay configuration, present the overlay dependency list and allow the user to continue even if some referenced widgets are unavailable.

- **Packaged runtime bootstrap and local HTTPS** (Priority: High)

  - Treat the bundled executable as the primary launch path for end users, while keeping `bun dev` as a developer-oriented workflow for NEXIS maintainers and plugin authors.

  - Serve the local UI over HTTPS by default in the packaged runtime.

  - Detect whether local TLS assets already exist in the system folders used by the application.

  - If the existing local TLS assets are expired, delete them and regenerate a fresh local pair instead of renewing them in place.

  - If local TLS assets are missing, offer to generate them automatically by using whatever certificate-generation capability is available on the host platform.

  - Store generated local TLS assets in the system folders used by the application.

  - Warn clearly that any auto-generated local TLS certificate is self-signed, intended only for strictly local-machine use, and should not be used to expose the application on any network.

  - Keep that expiration handling inside the local HTTPS bootstrap path rather than adding separate operator-facing renewal or trust-management UX.

- **UI action ergonomics** (Priority: Medium)

  - Prefer clear icons over always-visible text labels for action buttons where the icon meaning remains understandable.

  - Provide a user preference that allows operators to keep labels visible alongside icons when they prefer a more textual UI.

  - When labels are hidden, require tooltips or equivalent accessible names so actions remain understandable and discoverable.

- **Admin UI information architecture** (Priority: High)

  - Treat the main admin UI as a structured operator workspace rather than one undifferentiated screen.

  - Treat the Admin UI as the explicit configuration-management workspace where operators manage the current NEXIS project, its enhancement configuration, plugins, overlays, Art Directions, recipes, permissions, and history.

  - Make `/admin` the canonical admin entrypoint and redirect `/` to `/admin`.

  - At launch, provide distinct Admin UI sections for the Welcome page, General settings, Plugin management, Permissions Manager, Overlay Studio, Overlay Manager, Data Flow Admin UI, History log, and Art Direction Manager.

  - At launch, map those sections to the Admin UI subsection routes `/admin/start`, `/admin/settings`, `/admin/plugins`, `/admin/permissions`, `/admin/overlay/edit/:overlayId`, `/admin/overlay`, `/admin/data`, `/admin/log`, and `/admin/arts`.

  - Resolve `/admin` to `/admin/start` for first-time users and to the last Admin UI address that was stored when an event was appended to the history log for returning users.

  - Keep the exact section-navigation form open for now, such as tabs, menus, or another navigation pattern, while preserving those launch-time responsibilities.

  - Make the Welcome page the first destination on first launch.

  - Allow later development to make section order user-reorderable if that does not weaken first-time onboarding.

  - Keep the Welcome page pinned as the first section even if later versions allow other sections to be reordered.

- **General application settings** (Priority: Medium)

  - Allow users to configure user-facing app settings such as language, system folders, and local server settings from the UI.

  - When server-facing settings such as the local port are changed, signal the local server to restart in a controlled way instead of requiring manual restarts.

  - During that restart, show a blocking reconnecting modal until the UI becomes available at its new address.

  - After reconnecting, return the user to the same application location they were using before the restart.

  - The reconnecting modal may optionally contain a small easter-egg interaction, but that interaction must not weaken the clarity of the restart flow and should remain explicitly exitable.

- **Plugin management** (Priority: Medium)

  - Let users inspect installed plugins, install plugins from a local file or URL, update plugins, and remove plugins from the UI.

  - Require plugins to expose a version string and changelog information for their updates.

  - Let plugins declare pure, composable migration functions between adjacent supported versions so skipped-version upgrades can compose those migrations safely.

  - Preserve enough plugin-version lineage information that the app can migrate plugin-owned data without forcing users through each intermediate plugin release manually.

- **Widget composition and layout** (Priority: High)

  - Allow users to create, remove, enable, disable, and reorder widget instances or other overlay modules.

  - Treat an overlay as a composition of multiple widget instances arranged within the overlay surface rather than as a single widget.

  - Treat widget instances as positionable overlay elements, while still allowing some widgets to remain non-renderable reusable sources for those instances.

  - Keep reusable widget configuration separate from widget-instance-specific overlay configuration.

  - Support configuring widget placement, grouping, and visibility rules for render UIs.

  - Support placements such as a right-side chat rail, a bottom now-listening bar, or a floating donation-goal module.

  - Reflect composition changes in preview before publication.

  - Provide an Overlay Studio as the WYSIWYG editing surface for a single overlay.

  - Let users drag widgets from a widget palette into the overlay to create widget instances.

  - Let users reposition widget instances directly in the overlay surface and also edit widget-instance configuration, including position, through modal forms.

  - Support Overlay placement snapping zones at top-left, top-center, top-right, middle-left, middle-center, middle-right, bottom-left, bottom-center, and bottom-right.

  - Show visual snapping hints while dragging widget instances and allow temporary snapping bypass with a modifier such as `Shift`.

  - Let widget instances snap both to overlay zones and to nearby widget instances.

  - Allow free placement while still snapping to the closest target when it falls within a configurable snapping distance defined in General settings.

  - Store widget-instance position as number-plus-unit offsets from the top-left corner, with pixels and percentages supported and percentages used by default.

  - Remember which snapping zone a widget instance used so placement remains semantically stable when overlay dimensions change.

  - Provide a layer system where widget instances render in ascending layer order, with higher layers displayed above lower ones.

  - Let the Overlay Studio show a layer list, reorder layers by drag and drop, and highlight the pending drop position while dragging.

  - Let operators lock or hide layers in the Overlay Studio.

  - Let operators change a widget instance layer through the layer list, through the widget-instance configuration form, or through shortcuts such as `Alt+PageUp` and `Alt+PageDown`.

  - If a widget instance is dragged above another widget instance in the overlay surface, promote it to the upper layer; if no higher layer exists yet, create one.

  - Let widget instances be resized with square corner handles.

  - Let widget instances be rotated with a dedicated rotation handle placed on the side closest to the overlay center.

  - Let operators move the center of rotation through a dedicated handle.

  - Treat resizing and rotation as Transform behavior, while ordinary dragging changes overlay placement without altering the current rotation.

  - Keep the rotation center relative to the widget instance position so moving the widget instance does not change where its transform origin sits inside that widget instance.

  - Allow rotation around a moved rotation center even when that changes both the final rotation and the final displayed position of the widget instance.

  - Let the Overlay Studio expose a toggle for displaying EBU R 95 safe areas.

  - Show temporary pixel alignment guides while dragging widget instances so users can align edges and centers relative to nearby widget instances.

  - Let users open widget-editing forms from the widget palette to configure reusable widget resources.

  - Require a user-editable overlay name, but generate a default name from the current date and time when the user leaves the name blank.

  - Let the overlay edit flow configure dimensions and orientation, with portrait chosen automatically when validated dimensions are taller than wide.

  - Show a simple publication-state indicator for whether an overlay is saved, staged, or live.

  - Provide an Overlay Manager separate from the Overlay Studio so users can browse existing overlays, create new ones, inspect them, edit them, delete them with confirmation, and change publication state with confirmation.

  - Let overlay inspection surface lower-level details such as widget instances used by the overlay and the data sources that currently feed it.

- **Widget library and portability** (Priority: Medium)

  - Allow users to configure widgets as reusable assets outside a specific overlay.

  - Ship a default set of widgets with the application so new users have a usable starting library without installing plugins first.

  - Allow users to export a widget as a zip package containing its configuration and whatever save format each widget resource exposes.

  - Allow users to import a widget package so it becomes available in the admin interface for future widget instances.

  - Keep the widget concept extensible so new resource kinds can be introduced in code without redefining the import and export workflow.

  - Let widget resources carry only the core-standardized tags `art`, `data`, and Art Direction provenance tags so the UI can determine which resources are eligible for Art Direction packaging or data-flow workflows.

  - Keep widget resource tags under core and system control rather than user-edited freeform metadata or plugin-defined custom tag vocabularies.

- **Art Directions and reusable style packs** (Priority: Medium)

  - Allow users to create, import, export, and reapply an Art Direction as a single archive.

  - Let an Art Direction package overlays together with design-oriented widget resources such as images, animated assets, and sounds.

  - Structure that archive around a manifest with the usual archive metadata plus the selected widget resources tagged as `art`, with each selected resource exported through its own settings-export mechanism.

  - Require Art Directions to declare their dependencies so the UI can show which widgets and resource types they support.

  - When applying an Art Direction, allow users to choose which current widget resources to override.

  - Even when a specific override is skipped, keep imported Art Direction resources available for compatible resource field types covered by that Art Direction.

  - If an imported Art Direction includes overlays whose names already exist, append or increment a numeric suffix rather than overwriting the existing overlays implicitly.

  - Do not introduce Art Direction revision management by default.

  - Re-applying an Art Direction should open a modal flow that lists the impacted widgets and lets the user choose with one checkbox per widget which ones receive the Art Direction settings.

- **Data pipelines and input mapping** (Priority: High)

  - Allow data scrapers to collect and format events from local processing, watched file contents, commands, APIs, RSS or Atom feeds, and external event streams such as MQTT, and create exactly one single-domain data source from those events.

  - Keep the data source created by a data scraper scoped to a single coherent event domain, such as chat-message events or follow-notification events rather than a mixed upstream bundle.

  - Require each data scraper to report health using source-specific checks that matter for its concrete upstream input.

  - Let each data scraper decide when the health of its produced data source has become too poor for that source to remain useful.

  - When scraper health becomes too poor, treat the produced data source as halted and emit a health or halt event in that data source's event stream so widgets can use it to surface understandable degraded behavior.

  - When a halted or unhealthy data source becomes healthy enough again, emit a recovery health event in that same event stream.

  - Let data scrapers expose fake-event generation so users and developers can test data flows, widgets, and retrievers without waiting for real upstream events or consuming API credits.

  - Use stable persisted identifiers and faithful names for diagram-addressable scrapers, data sources, data retrievers, data flow resources, widgets, and widget instances.

  - Allow data retrievers to subscribe to one or more data sources in a non-destructive way, require at least one upstream data source per retriever, and produce exactly one new downstream data source per retriever.

  - Make propagation of upstream health, halt, and recovery events through data retrievers automatic pipeline behavior rather than retriever-specific transformation logic.

  - Halt a data retriever's processing while any upstream data source it depends on remains halted or unhealthy.

  - Resume that retriever only after the affected upstream data source emits a recovery health event.

  - Provide an admin-UI pipeline editor where data scrapers are the origins of flows, data retrievers are nodes that can sit on one flow or across multiple flows, and retrievers always create one new downstream flow without consuming the upstream ones.

  - Use that pipeline editor as the primary configuration UI for event-driven widget hydration, while keeping the persisted shared configuration on the underlying data scrapers, data retrievers, data flow resources, widgets, and widget instances rather than in a separately saved diagram artifact.

  - Let the pipeline editor go beyond inspection into direct manipulation and configuration.

  - Compute retriever-node positions dynamically from the data sources they depend on and the next downstream dependency or end of the diagram, with a default midpoint placement between those dependency boundaries rather than persisting retriever positions as part of retriever configuration.

  - Allow operators to enable or disable data scrapers from that pipeline editor.

  - Allow operators to trigger scraper-provided fake events from the UI, with those events flowing through the same downstream pipeline paths as live events.

  - Allow operators to route upstream flows into retriever nodes and create, update, or delete retrievers through node-driven modal dialogs.

  - Allow operators to assign data flow resources by dragging and dropping them from a palette of widgets that expose data flow resources.

  - Allow import and export of individual retriever configurations using each retriever's own serialized format.

  - Allow data flow resources to listen to data source events, extract or transform those events into widget-usable values, and provide those values without creating new data sources.

  - Allow operators to browse and search the current widget-instance list below the diagram, showing only widget instances that expose at least one data flow resource field and representing each such field as a dot.

  - Allow those widget-field dots to be placed directly on the relevant flows so operators can configure bindings that determine which field is hydrated from which data source, with the resulting binding identifiers persisted on the owning data flow resources rather than as separate connection objects.

  - Allow operators to enable or disable retrievers, propagate disabled state to downstream retrievers, grey out affected flows and nodes, and show red warning indicators on affected widget-field dots when disabled upstream flows break those bindings.

  - Allow import and export of whole-diagram pipeline configurations as a zip archive containing a lightweight manifest plus the serialized import or export formats used by the participating data scrapers, data retrievers, data flow resources, and widgets.

  - Use a `manifest.json` file at the root of that zip archive that declares `archiveFormatVersion`, `exportedAt`, `sourceAppVersion`, and one entry per participating exported element with `id`, `type`, `name`, archive-relative `file` path, `serializer`, serialized `formatVersion`, `dependencies`, and widget save or restore `mode` when relevant.

  - Let each participating element keep its own serialized import or export format and its own serialized format version string, and use archive composition rather than inventing a separate whole-diagram binding schema.

  - Surface form-related validation issues near the field that caused them.

  - Surface data-flow-related validation issues in the Sankey or alluvial pipeline interface as the primary in-context display and optionally supplement them with toast or browser-notification feedback when appropriate.

  - Require any importable or exportable artifact, including plugin-provided artifacts, to carry its own serialized format version string so structural compatibility checks can be delegated to the relevant artifact or plugin author when data structures evolve.

  - When an artifact loader or plugin rejects an unsupported serialized format version string, surface the mismatch as a version-mismatch form error in the import UI and optionally supplement that required form error with a toast or browser notification when appropriate.

  - Require widgets to support both full-configuration save or restore and data-flow-resource-only save or restore, with the pipeline editor using only the data-flow-resource-only mode.

  - Allow widgets to consume manual inputs and local or connected data flow resources.

  - Let users link upstream accounts or credentials to data scrapers through the UI, with clear explanations of requested permissions and the resulting access.

  - Prefer OAuth2-style account-linking flows when the upstream provider supports them.

  - Let users revoke linked accounts or credentials from the UI.

  - Store linked-account credentials and grants securely in the system folders used by the application and warn users that those credentials are sensitive.

  - Make data scraper, data retriever, data source, and data flow resource support available as early as possible in the implementation phase because multiple widget behaviors depend on them.

  - Support widgets whose templates define widget-instance creation, widget-instance configuration forms, and rendering of processed data rather than only static content.

  - Support mapping data from data flow resources into widget properties without requiring direct code edits.

  - Support widgets driven by multi-source and service-specific data flow resources, such as merged Twitch and YouTube chat, music metadata, and Ulule campaign progress.

  - Support in-house processed event pipelines such as simple mathematical operations, watched file contents, and command results.

  - Support external event pipelines such as third-party APIs, chats, subscriptions, RSS and Atom feeds, and MQTT-like servers.

  - Handle missing, stale, or invalid data gracefully.

  - Ship a default set of data scrapers with the application so common starter scenarios work without requiring immediate plugin installation.

- **Starter content and recipe-based onboarding** (Priority: High)

  - Provide a welcome page that offers beginner-friendly bundled recipes as well as import paths for more advanced recipe archives.

  - Let the welcome page expose a recipe-import drop zone as an onboarding path for more advanced users.

  - Let recipes orchestrate app-level configuration through the shared state rather than through ad hoc one-off setup logic.

  - Use a recipe archive format so a recipe can be imported or exported as a single file.

  - Center that recipe archive on a main TypeScript recipe file that builds the next app state by issuing commands comparable to the ones the UI would trigger.

  - Support beginner, intermediate, and advanced recipe shapes, including multi-source and multi-overlay examples.

  - Loading a recipe should run a guided recipe wizard that prompts for any required data-scraper configuration before the recipe is considered ready.

  - When a recipe requires multiple account links, group those links into a single checklist-style wizard step when practical.

  - Applying a recipe should always create new overlays, using the existing numeric-suffix naming rule when overlay names collide.

  - Applying or re-applying a recipe should override data scrapers, data retrievers, and widget configurations with the recipe-defined configuration rather than attempting to merge user customizations.

  - Re-applying a recipe after the user customizes the generated configuration should restore the recipe-defined configuration as the sane default.

- **Preview and visual sandboxing** (Priority: High)

  - Provide a live preview UI that mirrors the current enhancement state.

  - Keep visual sandboxing subordinate to product requirements rather than letting cosmetic experiments define the product scope.

  - Allow users to validate visual polish, typography, and layout before publishing.

- **Render delivery** (Priority: High)

  - Give each overlay its own live Render projection route at `/render/:OVERLAY_ID`.

  - Give each overlay its own staged Preview projection route for validation at `/staging/:OVERLAY_ID`.

  - Drive both route families from the shared projected state rather than from isolated implementations.

  - Keep render routes optimized for streaming software able to compose a web source.

  - Keep the staging route separate from the live route so operators can validate the staged Preview projection without replacing the live Render projection immediately.

- **State history, undo, and audit** (Priority: High)

  - Represent accepted changes as append-only history entries.

  - Support undo through compensating entries rather than destructive rewrites.

  - Treat changes to data scrapers, data retrievers, data flow resources, and their dependencies as history-tracked edits whose propagated downstream effects are also reverted when the originating change is undone.

  - Provide enough structured history to support a future audit UI and troubleshooting workflow.

  - Present history restoration with unusually strong warnings so users understand that restoring past state is not a harmless time-travel preview.

- **Plugin-provided permissions and command authorization** (Priority: Medium)

  - Let plugin authors declare which core-defined commands their widgets, data scrapers, and other plugin-provided elements request.

  - Treat a permission as authorization to call a specific core-defined command.

  - Require commands that alter application state to expose a human-readable and understandable description.

  - Show requested permissions when the user adds a widget to an overlay, activates a plugin, or otherwise activates a permission-bearing element.

  - Show current permissions in an element-specific configuration UI, including the widget-instance configuration UI, so the user can review and change them.

  - Provide a Permissions Manager in the Admin UI that shows commands on one axis, permission-bearing elements on the other axis, and the current permission state at each intersection.

  - Let operators grant or revoke command permissions from that Permissions Manager through explicit checkbox controls.

  - Allow specific plugin-provided elements, including widget instances, to be granted permission to alter the current overlay state or switch which overlay is currently displayed.

  - Keep plugin-provided permissions explicit, auditable, and revocable.

  - Keep command permissions as granular as practical.

  - Prevent unprivileged elements from mutating overlay selection or other protected global behavior.

- **Persistence and recovery** (Priority: Medium)

  - Persist accepted configurations and history locally through SQLite or an equivalent storage layer.

  - Rehydrate projected state from stored history on startup.

  - Fail safely if persisted data is missing, outdated, or partially invalid.

- **Real-time synchronization** (Priority: Medium)

  - Propagate accepted admin changes to render UIs in real time.

  - Keep the admin UI, Preview projection, and Render projection consistent.

  - Recover cleanly from temporary synchronization interruptions.

- **Admin UI local persistence** (Priority: Medium)

  - Persist preferences by default when they affect application state or application configuration.

  - Delegate preferences that affect only the Admin UI layout to browser-local storage unless a stronger persistence requirement is specified.

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

- End users start the app primarily through the bundled executable and arrive at the admin UI.

- The root route `/` should redirect to `/admin` rather than acting as the long-term operator home.

- NEXIS maintainers and plugin developers may also use `bun dev`, but that workflow should not be treated as the primary first-time-user path.

- First-time users are guided toward a starter enhancement configuration rather than raw technical controls.

- The welcome page should offer bundled starter recipes so new users can begin from recognizable streaming scenarios rather than a blank configuration.

- If no local TLS key and certificate are available, or the existing pair has expired, the app handles local HTTPS bootstrap by generating or regenerating a fresh self-signed local pair and explains that the generated certificates are self-signed and only suitable for strictly local-machine use.

- The main admin UI is the primary operator-facing configuration-management workspace.

- `/admin` should be the canonical admin entrypoint.

- At launch, the admin UI should be split into distinct sections for the Welcome page, General settings, Plugin management, Permissions Manager, Overlay Studio, Overlay Manager, Data Flow Admin UI, History log, and Art Direction Manager.

- At launch, those sections should use the Admin UI subsection routes `/admin/start`, `/admin/settings`, `/admin/plugins`, `/admin/permissions`, `/admin/overlay/edit/:overlayId`, `/admin/overlay`, `/admin/data`, `/admin/log`, and `/admin/arts`.

- First-time users should land on `/admin/start`, while returning users should land on the last Admin UI address that was stored when an event was appended to the history log.

- When external data scrapers need account access, the UI should guide users through linking those accounts with clear permission explanations and revocation paths.

- Users create or open a NEXIS project, work on the current enhancement configuration inside it, connect or enter the data it needs, and preview the result.

- Users can open `/staging/:OVERLAY_ID` to validate a staged Preview projection and `/render/:OVERLAY_ID` to inspect the live Render projection.

- Users discover reset, undo, and future save/load affordances early so experimentation feels safe.

### 5.2. Core experience

- **Launch the app**: Operators start the local app and open the browser UI.

  - Startup should be predictable and should clearly expose the available product UIs.

  - If the operator opens `/`, the app should redirect them to `/admin`.

  - The first-launch landing experience should resolve to `/admin/start` with onboarding and starter-recipe entry points.

  - Returning operators should be sent to the last Admin UI address that was stored when an event was appended to the history log.

- **Create or open a NEXIS project**: Operators begin from a saved project, a bundled starter recipe, or a new blank project.

  - Bundled widgets, bundled data scrapers, and bundled recipes should make the first useful setup reachable without extra plugin installation.

  - The first working UI should feel approachable and should not require code knowledge to begin.

- **Manage global app behavior**: Operators configure language, system folders, and local runtime settings through General settings rather than through raw files or environment variables.

  - Changing server-facing settings should feel controlled and reversible, even when it requires a restart.

- **Manage plugins**: Operators inspect installed plugins, install or remove them, and understand plugin version and migration information from the UI.

  - Plugin updates should not feel like opaque binary swaps that risk silent data loss.

- **Configure widgets and data mappings**: Operators choose reusable widgets, create widget instances from them, define how those instances are arranged, and decide which manual inputs or data flow resources drive those widget instances.

  - Configuration changes should be understandable, reversible, and safely validated before publication.

  - Event-pipeline configuration should remain legible through a visual flow editor where scrapers originate flows, retrievers derive new flows, and widget-field dots expose field hydration points.

  - When upstream activity is unavailable, scraper-provided fake events should make pipeline and widget behavior testable from the same UI.

- **Edit overlays visually**: Operators use the Overlay Studio to lay out widget instances directly on an overlay and open modal forms for lower-level configuration.

  - Direct manipulation and form-based editing should complement each other instead of competing.

- **Manage overlays as assets**: Operators use the Overlay Manager to browse, inspect, edit, publish, or delete overlays with clear state indicators and confirmations for risky actions.

  - Saved, staged, and live state should stay legible at a glance.

- **Load recipes and starter scenarios**: Operators can choose a guided recipe that provisions overlays, widgets, scrapers, and related pipeline state as a starting point.

  - Recipe loading should feel like a guided wizard rather than a raw import of opaque configuration.

- **Preview and refine presentation**: Operators use preview and sandbox UIs to validate visual polish, layout, and readability.

  - Visual feedback should feel immediate, stable, and clearly connected to the current enhancement configuration.

- **Publish to render UIs**: Operators open or embed overlay-specific staging and live routes that consume the approved shared state.

  - Render views should remain lightweight, read-only, and suitable for streaming software able to compose a web source.

- **Recover, save, and inspect changes**: Operators undo, reset, save, reload, or inspect history as needed.

  - Recovery and persistence flows should make experimentation safe instead of risky.

  - History restoration warnings should be dramatic enough that users understand the consequences before they proceed.

### 5.3. Advanced features & edge cases

- Missing or stale data should fall back gracefully rather than breaking the preview or render output.

  - Data scrapers should report source-specific health clearly, and widgets should be able to surface understandable degraded behavior when a required data source is halted for health reasons through that source's event stream.

- Non-renderable widget instances should remain configurable and visible in the overlay list even when they do not draw directly into the viewport.

- Plugin-provided elements that can alter overlay state or active-overlay selection should be permission-gated and auditable.

- Widget configurations should validate before publication.

- Validation issues should support at least warning, error, and blocking levels.

- Widgets backed by local or external event pipelines should fail safely when their data scrapers, data retrievers, data sources, or data flow resources are unavailable or malformed.

- Account-linking flows should explain requested permissions clearly and allow revocation without forcing users into manual secret-file management.

- Importing or activating an overlay should surface missing widgets from the overlay dependency list clearly and still allow the user to continue when partial recovery is acceptable.

- Widget export should include the saveable output exposed by each widget resource rather than assuming one universal storage format.

- No-op updates should not create meaningless history entries.

- Undo should remain correct across multi-step edits and reset events.

- Render routes should degrade gracefully if synchronization is temporarily unavailable.

- Local startup should still communicate clear errors when config or database bootstrap fails.

- Port overrides should work when the default port is unavailable or already in use.

- Access restrictions should protect editing UIs without breaking render-only usage.

### 5.4. UI/UX highlights

- Dark-first control-room aesthetic that favors focused operator workflows.

- Preview-first workflow that keeps user intent visible while editing.

- Action-heavy UIs should prefer recognizable icons, while still allowing users to keep visible labels or rely on tooltips.

- Clear separation between editing UIs, visual sandbox UIs, and render-only UIs.

- Flexible widget and data composition matters more than any one sandbox layout.

- A dynamic Sankey or alluvial-style pipeline editor can make scrapers, multi-source data-retriever subscriptions, derived downstream data sources, and widget-field hydration dots legible in the admin UI.

### 5.5. Example Sankey-style admin UI sketch

The following fake Mermaid example illustrates the intended shape of the Data Flow Admin UI, with scraper-created flows, retriever nodes, and widget-field dots fed by derived data sources.

```mermaid
---
config:
  sankey:
    showValues: false
    linkColor: source
---
sankey
  Twitch Chat Scraper,Twitch Chat Source,1
  YouTube Chat Scraper,YouTube Chat Source,1

  Twitch Chat Source,Chat Data Retriever,1
  YouTube Chat Source,Chat Data Retriever,1
  Chat Data Retriever,Twitch Chat Source end,1
  Chat Data Retriever,YouTube Chat Source end,1
  Chat Data Retriever,Merged Chat Data Source,1
  Merged Chat Data Source,Chat Data Flow Resource,1
  Chat Data Flow Resource,Merged Chat Data Source end,1

```

- Widget-instance stickers or cards below the diagram can keep data-flow-resource dots visually grouped by widget ownership and reduce placement ambiguity.

- Disabled flows and retriever nodes should grey out clearly, while affected widget-field dots should carry explicit warning signals.

- Accessible semi-random colors that remain stable per user can improve flow recognition without turning color choice into a primary operator task.

- Fast feedback for changes, validation, and recovery actions reduces ambiguity.

- Reset and undo affordances reduce fear of experimentation.

## 6. Narrative

A streamer wants to assemble an on-brand set of stream enhancements before going live because the show context, upstream event data, and visual priorities change from session to session. They open NEXIS locally, start from a bundled recipe or reusable configuration, link any needed upstream accounts, configure widgets and data mappings, test flows with fake events when live activity is unavailable, refine the presentation in preview and staging, and publish a render-safe live output for streaming software able to compose a web source. The tool works for them because it keeps onboarding, composition, account linking, preview, staged validation, recovery, and future synchronization in one local workflow instead of scattering those steps across ad hoc edits in streaming software able to compose a web source.

## 7. Success metrics

### 7.1. User-centric metrics

- At least 90% of first-time operators can create or open a NEXIS project and produce a first working preview within 5 minutes of launch.

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

- Wouter-based client routes for admin, staging, and render UIs.

- Future SQLite persistence for accepted history and startup rehydration.

- Future WebSocket or similar push-based synchronization for admin-to-render propagation.

- Future external platform adapters for Discord, Twitch, YouTube, PeerTube, ActivityPub, TikTok, PayPal, and Tipeee or TipeeeStream.

- Direct D3.js integration for a future admin pipeline visualization or configuration view, without a wrapper layer between React and D3.

- Consumption of `/render/:OVERLAY_ID` routes by streaming software able to compose a web source.

- Consumption of `/staging/:OVERLAY_ID` routes for operator-side validation before going live.

- Local configuration files, TLS assets, and packaged binary bootstrap behavior.

- Platform-specific local certificate-generation capabilities or equivalent fallback commands for automatic self-signed HTTPS bootstrap.

### 8.2. Data storage & privacy

- Store operator-facing configuration and accepted history locally by default.

- Store generated local TLS key and certificate assets in the system folders used by the application.

- Store linked-account credentials, OAuth2 tokens, and other auth grants securely in the system folders used by the application.

- Persist only the minimum required configuration state, history, and audit context necessary for product behavior.

- Keep pipeline-editor layout derived from shared element configuration, while allowing local browser storage to retain per-user visual preferences such as stable accessible color assignments or constrained layout nudges.

- Avoid external data transmission by default in the local-first model.

- Treat admin and render routes as distinct access UIs when access restrictions are enabled.

- Plan for redaction or omission of sensitive values from future audit or persisted history views if needed.

- Warn clearly that automatically generated TLS certificates are self-signed and intended only for strictly local-machine use, not for serving the application on any network.

- Warn clearly that linked-account credentials are sensitive and should not be shared outside the local machine context.

### 8.3. Scalability & performance

- Keep edit-to-preview latency low on local hardware.

- Add snapshotting or replay optimization as history grows.

- Use selector-driven reads to avoid unnecessary rerenders of unrelated UI.

- Keep render routes lightweight and stable for streaming software able to compose a web source.

- Maintain acceptable binary build, startup, and restart behavior during local development and packaged usage.

### 8.4. Potential challenges

- Designing the synchronization contract without overcoupling the product to one transport shape.

- Keeping admin and render projections fully consistent as more UIs are added.

- Handling certificate generation and storage safely across supported host platforms without requiring manual cryptographic setup from end users.

- Handling OAuth2 and other provider-auth flows securely while keeping account linking understandable for non-technical users.

- Managing SQLite persistence, migration, and rehydration without destabilizing the local-first model.

- Adding access control without hurting local simplicity or operator speed.

- Handling HTTPS, certificate, and runtime quirks across host platforms.

### 8.5. Architecture direction

- Use hexagonal architecture principles so the domain and application core stay independent from frameworks, transports, and provider APIs and SDKs.

- Keep domain and application logic free of direct dependencies on React, Bun HTTP, WebSocket, SQLite, filesystem watchers, MQTT clients, or provider-specific APIs and SDKs.

- Define ports in the core-facing layers for persistence, synchronization, runtime services, and external event ingestion.

- Avoid provider-specific ports in the core. External platform integrations should use a shared plugin contract plus a small set of capability-oriented ports.

- The shared plugin contract should declare plugin identity, configuration, lifecycle, and which capability-oriented ports the plugin supports so new external platform adapters can be added as plugins without changing the core.

- If a plugin exposes importable or exportable artifacts, the shared plugin contract should also declare their serializers and serialized format version strings so NEXIS can identify compatibility and hand migration responsibility to the plugin author for plugin-provided data.

- The first capability-oriented ports should cover at least chat events, subscription events, payment events, and social activity events.

- Capability-oriented ports should emit normalized event shapes built on the normalized capability event envelope.

- The normalized event and actor/chat schema guidance below is intentionally concern-level for now, so exact first-class field names can follow real adapter constraints instead of being frozen prematurely.

- The normalized capability event envelope should cover concerns around stable event identity, capability kind, provider and plugin provenance, occurrence and observation timing, and a normalized `sourceContext` reference describing where the event happened.

- The initial chat events shape should cover concerns around an observed actor account, message payload, a `sourceContext` field carrying normalized chat source context, message kind, reply linkage, and moderation or visibility state where relevant.

- The normalized actor account reference should cover concerns around provider-account-scoped identification, provider-native identification, actor kind, presentation-oriented account fields, role or verification signals when relevant, and an optional canonical actor identity link.

- The canonical actor identity reference should cover concerns around stable NEXIS identity identification, identity kind, presentation fields, and the ability to aggregate multiple provider accounts without collapsing the observed account carried by the event.

- The normalized chat source context should cover concerns around stable chat-context identification, context kind, required room-level context, and optional higher-level space, thread, stream, or owner context.

- Observed actors in normalized capability events should remain provider-account-scoped, while cross-provider matching should happen through canonical actor identity references rather than by merging observed accounts into one event actor record.

- The initial subscription events shape should cover the observed actor account, support kind, tier or level information, tenure or streak information, gifting context when relevant, and an optional support message or note.

- The initial payment events shape should cover the observed actor account when available, payment kind, amount and currency, transaction state, an optional note, and any relevant target or transaction references.

- The initial social activity events shape should cover the observed actor account, activity kind, object or target reference, content summary or payload, audience or visibility context, and related actor accounts where relevant.

- Implement adapters in presentation and infrastructure layers rather than letting those technologies define the core model.

- Treat admin and render UIs as presentation adapters around the same core model.

- Treat Discord, Twitch, YouTube, PeerTube, ActivityPub, TikTok, PayPal, and Tipeee or TipeeeStream as external platform adapters around the core rather than as domain-defining concepts.

- Let external platform adapters feed data scrapers or adjacent ingestion paths that create single-domain data sources, which data retrievers can then turn into additional data sources before data flow resources expose widget-usable data.

- Let new external platform adapters be added by implementing the shared plugin contract and any relevant capability-oriented ports, rather than requiring new provider-named ports in the core.

## 9. Milestones & sequencing

### 9.1. Project estimate

- Large: 8-16 weeks from the current foundation to reach a persistence-backed, render-synchronized, packaged operator-ready milestone.

### 9.2. Team size & composition

- Medium Team: 3-5 total people

  - Product manager, 2-3 engineers, 1 designer, and part-time QA support

### 9.3. Suggested phases

- **Phase 1**: Expand shared-state UIs beyond the current sandbox and foundation work (2-3 weeks)

  - Key deliverables: data scraper, data retriever, data source, and data flow resource foundations, projected live and staging overlay routes, improved admin shell behavior, additional selector-driven integrations

- **Phase 2**: Add history and audit product UIs (1-2 weeks)

  - Key deliverables: operator-visible history view, accepted command and event display, undo context in the UI

- **Phase 3**: Implement real-time synchronization between admin and render UIs (2-3 weeks)

  - Key deliverables: transport contract, push-based updates, render consistency checks

- **Phase 4**: Add SQLite persistence and startup rehydration (2-4 weeks)

  - Key deliverables: stored history, local database bootstrap, replay on startup, failure handling

- **Phase 5**: Harden packaged runtime and access boundaries (1-2 weeks)

  - Key deliverables: config bootstrap, admin-vs-render access protection, startup and recovery polish

## 10. User stories

### 10.1. Launch the admin UI

- **ID**: US-001

- **Description**: As a streamer, I want to open the local admin UI so that I can manage my stream enhancement setup from one place.

- **Acceptance criteria**:

  - The local app exposes a browser-accessible admin route at `/admin` after startup.

  - Navigating to `/` redirects to `/admin`.

  - For first-time users, `/admin` resolves to `/admin/start`.

  - For returning users, `/admin` resolves to the last Admin UI address that was stored when an event was appended to the history log.

  - The admin UI loads without requiring a hosted backend.

  - A usable starting configuration or entry point is visible when the UI opens.

  - The route works in both development and packaged runtime flows.

  - The launch-time Admin UI subsection routes are reachable at `/admin/start`, `/admin/settings`, `/admin/plugins`, `/admin/permissions`, `/admin/overlay/edit/:overlayId`, `/admin/overlay`, `/admin/data`, `/admin/log`, and `/admin/arts`.

### 10.2. Create or open a NEXIS project

- **ID**: US-002

- **Description**: As a streamer, I want to create or open a NEXIS project so that I can work on a reusable stream setup instead of starting from scratch every time.

- **Acceptance criteria**:

  - I can start from a new project, a starter preset, or a previously saved project.

  - The app clearly shows which NEXIS project is open and which enhancement configuration is currently being edited.

  - Opening a project restores its editable state.

  - Resetting to a safe baseline is available when needed.

### 10.3. Add and configure widgets

- **ID**: US-003

- **Description**: As a streamer, I want to add and configure widgets so that I can assemble the enhancement experience I need for a specific show or scene.

- **Acceptance criteria**:

  - I can create widget instances from widgets that are available in the admin interface.

  - When I add a widget to an overlay, I can see the permissions that widget instance will request before I accept it.

  - Those requested permissions are presented as core-defined commands with human-readable descriptions.

  - I can configure reusable widget settings separately from widget-instance-specific overlay settings.

  - Widget-instance creation and the widget-instance configuration form are driven by the template provided by the source widget.

  - I can configure renderable widget instances and also keep non-renderable widgets available as reusable sources when they serve a supporting role.

  - I can edit the main settings for reusable widgets and widget instances without direct code changes.

  - The widget-instance configuration form shows the current permissions for that instance so I can review and change them.

  - Invalid widget configurations are rejected or surfaced clearly.

  - Widget changes update the current working state immediately.

### 10.4. Arrange widget layout and visibility

- **ID**: US-004

- **Description**: As a streamer, I want to arrange widget layout and visibility so that the rendered output matches the intended composition.

- **Acceptance criteria**:

  - I can reorder widget instances or modules within the current configuration.

  - I can enable, disable, or hide widget instances without deleting them.

  - Layout and visibility changes are reflected in preview before publication.

  - The resulting composition remains stable across refresh or reload after persistence is implemented.

### 10.5. Provide manual inputs or event-driven widget data

- **ID**: US-005

- **Description**: As a streamer, I want widgets to consume manual inputs or data flow resources built from event streams so that the enhancement output can reflect the current context.

- **Acceptance criteria**:

  - I can supply manual input for widgets when no live data flow resource is connected.

  - Data scrapers can collect and format events from local processing, watched file contents, commands, APIs, RSS or Atom feeds, or external event streams such as MQTT, and create exactly one single-domain data source from those events.

  - The data source created by a scraper contains events from a single coherent event domain, such as chat-message events or follow-notification events.

  - Each data scraper reports its own health using source-specific checks that matter for its concrete upstream input.

  - If a scraper judges the health of its produced data source to be too poor for useful operation, that data source is treated as halted.

  - A halted data source emits a health or halt event in its event stream so widgets can use it to surface understandable degraded behavior.

  - If that data source becomes healthy enough again, it emits a recovery health event in that same event stream.

  - Data scrapers can expose fake-event generation so I can test data flows and widgets without waiting for real upstream events or consuming API credits.

  - Data retrievers can subscribe to one or more data sources in a non-destructive way, always depend on at least one upstream data source, and always produce exactly one new downstream data source.

  - When a data retriever depends on an upstream data source that remains halted or unhealthy, that retriever's processing is halted until that upstream source emits a recovery health event.

  - Upstream health, halt, and recovery events are propagated automatically through the downstream data source's event stream rather than by retriever-specific filtering or transformation logic.

  - I can enable or disable data scrapers from the visual flow editor.

  - I can trigger scraper-provided fake events from the UI and see them travel through the same downstream flow as live events.

  - I can add data retrievers that sit on one flow or across multiple flows and route upstream flows into them.

  - Data-retriever node placement is calculated dynamically from its current upstream and downstream dependencies, with a default midpoint placement between those dependency boundaries rather than being saved on the retriever itself.

  - Clicking a retriever node opens a modal dialog where I can create, edit, or delete that retriever.

  - I can import or export an individual retriever configuration using that retriever's own serialized format.

  - The visual flow editor is the primary UI for configuring event-driven widget hydration, even though the visible diagram is derived from persisted element configurations rather than stored separately.

  - I can inspect and configure data sources and data retrievers through a visual flow editor in the admin UI, where retrievers create new downstream flows without consuming the upstream ones.

  - Data flow resources can listen to data source events, extract or transform those events into widget-usable values, and provide those values to widgets.

  - Only widget fields backed by data flow resources participate in the visual flow editor.

  - I can browse and search the current widget-instance list below the diagram, showing only widget instances that expose at least one data flow resource field and representing each such field as a dot.

  - I can place widget-field dots directly on the relevant flows so I can configure bindings that determine which field is hydrated from which data source, and the represented data flow resource then ingests events from that flow with the binding identifier persisted on that resource rather than as a separate connection object.

  - Disabling a retriever disables the downstream retrievers that depend on it, greys out the affected flows and nodes, and places red warning indicators on affected widget-field dots.

  - I can import or export a whole-diagram pipeline configuration as a zip archive of the participating elements' own serialized formats plus a lightweight manifest.

  - The archive manifest is stored as `manifest.json` at the root of that zip archive and includes `archiveFormatVersion`, `exportedAt`, `sourceAppVersion`, and one entry per participating exported element with `id`, `type`, `name`, archive-relative `file` path, `serializer`, serialized `formatVersion`, `dependencies`, and widget save or restore `mode` when relevant.

  - Each importable or exportable artifact involved in that archive carries its own serialized format version string, including plugin-provided artifacts when they participate.

  - I can link upstream accounts or credentials to data scrapers from the UI with clear permission explanations, and revoke those links later.

  - OAuth2-style account-linking is used when the upstream provider supports it.

  - When pipeline import or export involves widgets, the diagram-side operation uses only the widgets' data-flow-resource-only save or restore mode rather than their full-configuration save or restore mode.

  - The system can map widget properties to local or connected data flow resources.

  - Undoing a pipeline-configuration change also reverts the downstream enable or disable effects that change triggered.

  - Missing, stale, or invalid upstream event data does not crash the preview or render output.

  - Widgets surface a predictable fallback state when valid upstream event data is unavailable.

### 10.6. Preview the current enhancement state live

- **ID**: US-006

- **Description**: As a streamer, I want a live preview of the current enhancement state so that I can validate the result before publishing it to render UIs.

- **Acceptance criteria**:

  - Accepted configuration changes appear in preview without manual refresh.

  - Preview behavior stays consistent with the currently edited configuration.

  - Preview remains visible while I continue editing.

  - Preview rendering stays stable when multiple fields or widgets change in sequence.

### 10.7. Use the admin UI as a visual sandbox

- **ID**: US-007

- **Description**: As a designer or technical producer, I want the main admin UI to support visual sandboxing so that I can refine cosmetics and interaction polish without confusing that work with final product requirements.

- **Acceptance criteria**:

  - The main admin UI supports visual experimentation without becoming a separate product definition.

  - The sandbox can be used to validate layout, theme, and interaction polish.

  - Cosmetic experiments do not redefine the canonical product scope by themselves.

  - The sandbox remains useful without becoming the only supported workflow.

### 10.8. Publish to a render UI

- **ID**: US-008

- **Description**: As a render consumer, I want `/render/:OVERLAY_ID` to reflect the live Render projection of a specific overlay, and `/staging/:OVERLAY_ID` to reflect its staged Preview projection, so that live output stays stable while validation remains separate.

- **Acceptance criteria**:

  - `/render/:OVERLAY_ID` renders the live Render projection for that overlay instead of a placeholder page.

  - `/staging/:OVERLAY_ID` renders the staged Preview projection for that overlay instead of sharing the live route output.

  - Render routes remain read-only from the perspective of editing workflows.

  - Changes promoted to the live revision appear in the render UI, while staged-only changes appear in the staging UI until they are promoted.

  - Render behavior remains stable when different overlay IDs are requested or when a staging revision is missing.

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

  - The UI exposes a history or audit UI for accepted entries.

  - Each entry shows when it happened and which command suite produced which event.

  - Undo-related entries are distinguishable from ordinary changes.

  - The history view reflects the same append-only model used for replay.

### 10.12. Synchronize admin changes to render UIs in real time

- **ID**: US-012

- **Description**: As a streamer, I want accepted changes to propagate to render UIs in real time so that live output stays in sync with the control UI.

- **Acceptance criteria**:

  - Accepted admin changes are pushed to connected render UIs without manual refresh.

  - Render UIs apply updates in order and remain consistent with the current projected state.

  - Temporary transport interruptions recover without duplicating or losing accepted changes.

  - The domain model remains usable even if the final transport protocol changes later.

### 10.13. Handle missing or invalid data gracefully

- **ID**: US-013

- **Description**: As a streamer, I want missing or invalid data to fail gracefully so that the product stays usable during imperfect runtime conditions.

- **Acceptance criteria**:

  - Missing or stale data produces a fallback state instead of a broken UI.

  - Invalid data mappings are surfaced clearly to the user.

  - The projected state remains deterministic after ignored or invalid inputs.

  - Render output continues operating in a degraded but understandable state where possible.

### 10.14. Protect admin access while preserving render access

- **ID**: US-014

- **Description**: As a maintainer, I want admin-editing routes to be protected when access restrictions are enabled so that control UIs are not modified by unauthorized viewers.

- **Acceptance criteria**:

  - The product can distinguish admin-editing UIs from render-only UIs.

  - When access protection is enabled, unauthorized users cannot change admin state.

  - Render-only consumers can still access the UIs intended for viewing.

  - Authentication or access controls do not block local operator workflows when explicitly disabled.

### 10.15. Link external accounts to data scrapers securely

- **ID**: US-015

- **Description**: As a streamer, I want to link and revoke upstream accounts from the UI so that data scrapers can work without forcing me to manage secrets manually.

- **Acceptance criteria**:

  - The UI can start an account-linking flow for a scraper that requires upstream authorization.

  - The UI explains the granular account access and permissions being requested before the user approves the link.

  - OAuth2-style authorization is used when the upstream provider supports it.

  - The resulting credentials or auth grants are stored securely in the system folders used by the application.

  - The user can revoke or disconnect a previously linked account from the UI.

### 10.16. Choose icon-first or label-visible action controls

- **ID**: US-016

- **Description**: As an operator, I want action-heavy controls to be icon-first by default while still allowing visible labels when I prefer them, so that the UI can stay efficient without becoming unclear.

- **Acceptance criteria**:

  - Action-heavy buttons and controls prefer recognizable icons by default.

  - I can enable a setting that keeps labels visible alongside those icons.

  - When labels are hidden, the controls still expose tooltips or equivalent accessible names.

  - The icon-first presentation does not remove clarity for destructive or high-risk actions.

### 10.15. Launch the packaged runtime with local bootstrap behavior

- **ID**: US-015

- **Description**: As a streamer, maintainer, or plugin developer, I want the packaged application to initialize its config, local TLS assets, and local database cleanly so that end users can run it without manual setup steps and developers can still target the same runtime behavior.

- **Acceptance criteria**:

  - The packaged binary starts on supported host platforms.

  - The bundled executable is the primary supported launch path for end users.

  - Development workflows such as `bun dev` remain available for NEXIS maintainers and plugin developers without redefining the end-user entrypoint.

  - Required config and database files are created or discovered automatically.

  - If local TLS assets are missing, the app offers to generate a self-signed local TLS certificate and matching key automatically by using whatever certificate-generation capability is available on the host platform.

  - If the existing local TLS assets are expired, the app deletes them and regenerates a fresh self-signed local TLS certificate and matching key instead of renewing them in place.

  - Generated TLS assets are stored in the system folders used by the application.

  - The app warns clearly that any generated local TLS certificate is self-signed and suitable only for strictly local-machine use, not for serving the application on any network.

  - The packaged runtime does not add separate operator-facing renewal or trust-management UX beyond that local HTTPS bootstrap flow.

  - The local UI is served over HTTPS once valid local TLS assets are available.

  - Startup failures surface actionable errors instead of silent exits.

  - Runtime behavior remains consistent with the development experience where applicable.

### 10.16. Allow privileged widgets to alter overlay behavior

- **ID**: US-016

- **Description**: As a streamer or maintainer, I want specific widgets to be able to alter the current overlay or switch which overlay is displayed so that overlay behavior can react to runtime conditions without giving every widget global control.

- **Acceptance criteria**:

  - Widget capabilities that can alter overlay behavior are explicitly permission-gated.

  - Those protected-command permissions are declared by the plugin author against core-defined commands and remain reviewable from the widget-instance configuration form.

  - Authorized widgets can request changes to the current overlay or the displayed overlay.

  - Unauthorized widgets cannot mutate protected overlay-selection behavior.

  - Widget-triggered overlay changes are auditable through the same history model used for other accepted changes.

### 10.17. Import or export a widget

- **ID**: US-017

- **Description**: As a streamer or designer, I want to export a configured widget and import it later so that I can reuse it across overlays or share it outside the application.

- **Acceptance criteria**:

  - I can export a widget as a zip package.

  - The export includes the widget configuration and whatever saveable output each widget resource exposes.

  - I can import a compatible widget package through the admin interface.

  - An imported widget becomes available for creating new widget instances.

### 10.18. Import or activate an overlay when some required widgets are unavailable

- **ID**: US-018

- **Description**: As a streamer, I want to see the overlay dependency list for an overlay before importing or activating it so that I can understand what is missing and still choose whether to continue.

- **Acceptance criteria**:

  - The overlay configuration shows its overlay dependency list.

  - Importing or activating an overlay presents the overlay dependency list before proceeding.

  - Missing widgets from that list are clearly identified.

  - I can continue importing or activating the overlay even when some widgets are unavailable.

### 10.19. Import, export, or apply an Art Direction

- **ID**: US-019

- **Description**: As a streamer or designer, I want to import, export, and apply an Art Direction so that I can reuse or share a coherent visual style across overlays and widgets.

- **Acceptance criteria**:

  - I can export an Art Direction as a single archive.

  - The archive can include overlays plus design-oriented widget resources such as images, animated assets, and sounds.

  - The archive includes a manifest with the usual archive metadata plus the selected widget resources tagged as `art`, with each selected resource exported through its own settings-export mechanism.

  - Importing an Art Direction shows which widgets and resource types it supports through its dependency information.

  - When applying an Art Direction, a modal flow lists the impacted widgets and lets me choose with one checkbox per widget which ones receive the Art Direction settings.

  - Imported Art Direction resources remain available for compatible resource field types even when I skip a specific override.

  - If imported overlays would collide by name with existing overlays, the imported overlays receive a numeric suffix or increment an existing numeric suffix instead of overwriting the current ones implicitly.

  - Widget resource tags can identify which resources are eligible for Art Direction packaging or reapplication.

  - If an Art Direction name would collide with the reserved `art` or `data` tags, the resulting provenance tag is turned into `[name] + Art Direction`.

  - Art Directions do not introduce revision management by default.

### 10.20. Start from bundled recipes and guided onboarding

- **ID**: US-020

- **Description**: As a streamer, I want a welcome page with bundled recipes and a guided recipe wizard so that I can reach a useful setup quickly without building everything from scratch.

- **Acceptance criteria**:

  - The application ships with a default set of widgets and data scrapers for basic starter scenarios.

  - The welcome page offers bundled recipes as well as a way to import a more advanced recipe archive.

  - Advanced recipe imports use a recipe archive format centered on a main TypeScript recipe file that builds the next app state by issuing commands comparable to the ones the UI would trigger.

  - Recipes can provision overlays, widgets, data scrapers, data retrievers, and related shared-state configuration as a starting point.

  - Loading a recipe starts a guided recipe wizard rather than applying opaque changes immediately.

  - If a recipe requires multiple data-scraper account links, the wizard can group those links into one checklist-style step when practical.

  - Applying a recipe always creates new overlays, using the numeric-suffix naming rule when overlay names collide.

  - Applying or re-applying a recipe overrides data scrapers, data retrievers, and widget configurations with the recipe-defined configuration.

  - Re-applying a recipe after user customization restores the recipe-defined configuration as the sane default.

  - Beginner, intermediate, and advanced recipe examples can coexist, including multi-source and multi-overlay scenarios.

### 10.21. Configure general application settings from the Admin UI

- **ID**: US-021

- **Description**: As an operator, I want to configure general application settings from the Admin UI so that I do not need to edit raw config files or environment variables for basic behavior.

- **Acceptance criteria**:

  - The Admin UI includes a General settings section.

  - I can edit user-facing settings such as language, system-folder locations, and local server settings there.

  - If I change a server-facing setting such as the local port, the application performs a controlled restart rather than requiring a manual relaunch.

  - During that restart, the UI shows a blocking reconnecting modal until the app is available again.

  - That reconnecting modal should include clear waiting feedback, such as animation, rather than looking frozen.

  - After reconnecting, I am returned to the same application location I was using before the restart.

  - Optional playful easter-egg interaction in that modal is acceptable only if it does not hide the reconnecting state and if the operator can exit it explicitly.

### 10.22. Manage plugins from the Admin UI

- **ID**: US-022

- **Description**: As an operator, I want to inspect, install, update, and remove plugins from the Admin UI so that I can manage integrations without dropping into manual filesystem or command-line workflows.

- **Acceptance criteria**:

  - The Admin UI includes a Plugin management section.

  - I can inspect the installed plugins and their version information.

  - I can install a plugin from a local file or a URL.

  - If a plugin requests command permissions on activation, a modal explains those permissions and lets me approve or cancel activation.

  - If I cancel that permissions modal, the plugin is not activated and the permissions are not granted.

  - I can update or remove an installed plugin from the UI.

  - Plugin entries expose changelog information for their updates.

  - Plugin entries expose their version lineage so users can understand which intermediate versions were skipped.

  - Plugin-owned data can be migrated across skipped versions through pure, composable version-to-version migration functions.

### 10.23. Edit an overlay in the Overlay Studio

- **ID**: US-023

- **Description**: As a streamer or designer, I want a WYSIWYG Overlay Studio so that I can create and edit overlays visually instead of configuring everything through abstract forms alone.

- **Acceptance criteria**:

  - The Admin UI includes an Overlay Studio section for editing a single overlay.

  - The canonical route for editing a specific overlay is `/admin/overlay/edit/:overlayId`.

  - I can drag a widget from the widget palette onto the overlay to create a widget instance.

  - I can reposition widget instances directly on the overlay surface.

  - I can use visible snapping hints to place widget instances against overlay snapping zones or nearby widget instances, and I can temporarily bypass snapping with a modifier such as `Shift`.

  - I can edit widget-instance configuration, including position, through a modal form.

  - I can open widget-editing forms from the palette to configure reusable widget resources.

  - The overlay name is editable even after creation.

  - A default overlay name is generated from the current date and time when I create an overlay without naming it.

  - I can configure the overlay dimensions directly.

  - The overlay orientation updates automatically to portrait when the validated dimensions are taller than wide.

  - Widget-instance placement is stored as top-left offsets with supported units, and snapped placement remains stable when overlay dimensions change.

  - I can reorder layers, lock layers, hide layers, and move widget instances between layers from the Overlay Studio.

  - If I drag a widget instance above another widget instance in the overlay surface, the dragged instance is promoted to the upper layer, creating a new upper layer when needed.

  - I can resize widget instances from corner handles, rotate them from a rotation handle, and reposition their center of rotation.

  - Moving a widget instance changes its placement without altering its rotation, and its rotation center remains relative to the widget instance rather than to the overlay as a whole.

  - The Overlay Studio can show EBU R 95 safe areas.

  - The Overlay Studio can show temporary pixel alignment guides while I drag widget instances.

  - Saved, staged, and live state are visible through a simple publication-state indicator, such as a three-light bar.

### 10.24. Manage overlays outside the studio

- **ID**: US-024

- **Description**: As a streamer, I want an Overlay Manager so that I can browse, inspect, open for editing, publish, or delete overlays without losing track of their current state.

- **Acceptance criteria**:

  - The Admin UI includes an Overlay Manager section with a list or table of overlays.

  - I can create a new overlay from that section and then continue in the Overlay Studio.

  - I can open an existing overlay from that section for editing in the Overlay Studio.

  - I can inspect an overlay's lower-level details, including its widget instances and the data sources that supply it.

  - I can delete an overlay only through an explicit confirmation flow.

  - I can change an overlay's publication state through an explicit confirmation flow and see the current state clearly in the manager.

### 10.25. Manage loaded Art Directions from the Admin UI

- **ID**: US-025

- **Description**: As a streamer or designer, I want an Art Direction Manager so that I can inspect, reapply, and delete loaded Art Directions from one place.

- **Acceptance criteria**:

  - The Admin UI includes an Art Direction Manager section.

  - I can see the list of currently loaded Art Directions.

  - I can inspect the resources contained by an Art Direction.

  - I can reapply an Art Direction through a modal flow that lists the impacted widgets and lets me choose with one checkbox per widget which ones receive the Art Direction settings.

  - I can delete an Art Direction only through an explicit confirmation flow.

### 10.26. Manage permissions from the Admin UI

- **ID**: US-026

- **Description**: As an operator, I want a Permissions Manager so that I can inspect and change which core-defined commands each permission-bearing element is allowed to call.

- **Acceptance criteria**:

  - The Admin UI includes a Permissions Manager section.

  - The Permissions Manager displays commands on one axis and permission-bearing elements on the other axis.

  - Each intersection displays the current permission state for that element-command pair.

  - I can grant or revoke a permission for an element-command pair through a checkbox at that intersection.

  - Commands that alter application state are shown with human-readable and understandable descriptions.

