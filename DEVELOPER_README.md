# NEXIS Developer Guide

This file covers local development, testing, builds, and release-oriented workflow details.

Most end users should use the bundled executable release path described in [README.md](./README.md). This guide is for Bun-based local development and repository work.

## Local Development

1. Install dependencies.

```bash
bun install
```

2. Start the local watcher.

```bash
bun dev
```

The watcher rebuilds styles, rebuilds the host-platform binary, and restarts the local process when relevant files change.

It resolves the executable it restarts from the matching `subbuild:bin:*` script `--outfile`, so platform-specific filenames stay aligned with `package.json`.

Default local URL:

```text
https://localhost:8888
```

Override the port when needed:

```bash
PORT=3000 bun dev
```

## Useful Commands

- `bun dev` starts the local build watcher and app process
- `bun test` runs the test suite
- `bun test <path-to-test-file>` runs a focused test file
- `bun run release:prepare` resolves the next release version locally, updates `package.json` when that version changes, and writes release metadata under `.github/.release/`
- `bun run release:package-assets` archives the compiled binaries into safe `.tar.gz` upload artifacts under `.github/.release/upload-assets/`
- `bun run subbuild:style` rebuilds the generated CSS bundle
- `bun run subbuild:bin:linux` builds the Linux x64 binary to `bin/linux-x64/nexis.x64`
- `bun run build` runs the style build plus all configured binary builds

## Project Notes

- The frontend is bootstrapped from `src/frontend.tsx` and now routes through `src/presentation/app/AppRoutes.tsx`.
- The Bun server entrypoint remains `src/server.ts`, with HTTP and realtime helpers under `src/infrastructure/`.
- The active application UI is currently a minimal admin drawer shell plus placeholder route behavior while the broader overlay workflow is being built.
- The current source layout centers on `src/presentation/` for routes and shells plus `src/infrastructure/` for HTTP and realtime server concerns.

## Release Workflow Notes

- The GitHub `Release` workflow keeps the first release on the current `package.json` version, increments the leading release number after that, builds every configured binary, publishes those binaries as GitHub release assets using the changelog slice since the previous release, and can also be triggered manually when an out-of-band release is needed.
- The release workflow archives compiled binaries before upload because GitHub blocks several raw executable filename extensions such as `.app` and `.exe` for release assets.
- The release workflow also auto-runs on default-branch pushes, publishes the very first release immediately when no release tag exists yet, and otherwise waits until at least 10 commits have landed since the previous release tag.