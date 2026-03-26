When adding or updating unit tests in this repository:

- Place repo-owned unit tests under `__tests__/` and mirror the source path from the workspace root.
- Use `.test.ts` by default.
- Use `.test.tsx` only when the test itself needs JSX or TSX syntax.
- Keep one primary test file per source module when practical.
- Examples:
  - `createProcess.ts` -> `__tests__/createProcess.test.ts`
  - `src/server.ts` -> `__tests__/src/server.test.ts`
  - `src/components/HtmlFontSizeSlider/HtmlFontSizeSlider.tsx` -> `__tests__/src/components/HtmlFontSizeSlider/HtmlFontSizeSlider.test.tsx`
- The automatic functional-consistency policy does not apply to React component files such as `*.tsx`, `*.jsx`, or modules under `src/components/` unless the user explicitly asks for component-test enforcement.
- Write unit tests with `bun:test` and run targeted files with `bun test <path-to-test-file>` whenever possible.

When code changes in this repository are already working and tested:

- Automatically invoke the configured post-validation refactor agents before finishing.
- The follow-up pass registry lives in `.github/hooks/post-validation-refactors.config.json`.
- Treat those follow-up refactors as behavior-preserving cleanup passes on already working code.
- Keep each follow-up cleanup pass scoped to the files touched by the validated change, and skip unrelated churn even if other cleanup opportunities exist.
- Skip churn if none of the configured follow-up agents finds a worthwhile improvement.

When planning and executing work in this repository:

- Use `tasks.md` as the persistent task tracker for the current effort.
- Add or update the todo items you plan to execute in `tasks.md` before or during substantial work, and keep that list complete for the work in progress.
- As work advances, maintain `tasks.md` so in-progress, remaining, and completed items reflect the current state of execution.

When making significant codebase changes in this repository:

- Maintain `CHANGELOG.md` at the repository root.
- Add an entry for each significant change made to the codebase.
- For each entry, include a concise summary of the change and a short explanation of the goal behind it.

When evolving the domain model or domain vocabulary in this repository:

- Maintain `GLOSSARY.md` at the repository root as the source of truth for the domain glossary.
- Keep `GLOSSARY.md` easy to browse with stable section anchors and internal links when practical.
- When adding, renaming, or reclassifying glossary entries, keep the browse sections synchronized with the corresponding headings.
- Prefer updating `GLOSSARY.md` instead of leaving domain terminology only in chat responses.

When laying out new architecture or moving code across layers in this repository:

- Prefer hexagonal architecture principles.
- Keep domain and application code independent from React, Bun HTTP, WebSocket, SQLite, filesystem watchers, MQTT clients, and provider-specific APIs and SDKs.
- Define ports in core-facing layers and implement adapters in presentation or infrastructure layers.
- Avoid provider-specific ports in the core; prefer a shared plugin contract plus capability-oriented ports.
- Treat Discord, Twitch, YouTube, PeerTube, ActivityPub, TikTok, PayPal, and Tipeee or TipeeeStream as external platform adapters rather than domain concepts.

When working in this repository:

- Changes to `tasks.md` are always pre-approved.
- Do not ask for confirmation before updating `tasks.md` when maintaining the task list for planned, in-progress, or completed work.
- After roughly every 10 completed tasks that materially change code, create a git commit; keep codependent tasks together instead of splitting them mechanically just to hit the count.
- Use a very short commit message that summarizes what changed since the previous commit.
- Treat every 10 commits on the default branch as the next release boundary and keep the release automation aligned with that cadence.