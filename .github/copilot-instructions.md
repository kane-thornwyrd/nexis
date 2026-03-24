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
- Skip churn if none of the configured follow-up agents finds a worthwhile improvement.

When planning and executing work in this repository:

- Use `tasks.md` as the persistent task tracker for the current effort.
- Add or update the todo items you plan to execute in `tasks.md` before or during substantial work, and keep that list complete for the work in progress.
- As work advances, maintain `tasks.md` so in-progress, remaining, and completed items reflect the current state of execution.