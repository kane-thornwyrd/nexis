# NEXIS

Stream enhancer with widgets and data.

NEXIS is a local-first Bun + React application for experimenting with stream-facing widgets, operator controls, and data-driven overlay UIs. The current app serves a root admin UI and a placeholder render route while the project moves toward an event-sourced state model with replay, undo, and future real-time synchronization.

## Current UIs

- `/` empty admin UI with an empty dashboard drawer shell
- `/render/:mode?` render route placeholder for future views in streaming software able to compose a web source

## Stack

- Bun runtime, Bun server, and compiled host binaries
- React 19 and TypeScript
- Wouter routing
- Tailwind plus shadcn/ui primitives
- Effect for domain and state architecture work

## Getting Started

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
- The active application UI is currently a minimal admin drawer shell plus the placeholder render route.
- The current source layout centers on `src/presentation/` for routes and shells plus `src/infrastructure/` for HTTP and realtime server concerns.
- The GitHub `Release` workflow keeps the first release on the current `package.json` version, increments the leading release number after that, builds every configured binary, publishes those binaries as GitHub release assets using the changelog slice since the previous release, and can also be triggered manually when an out-of-band release is needed.
- The release workflow archives compiled binaries before upload because GitHub blocks several raw executable filename extensions such as `.app` and `.exe` for release assets.
- The release workflow also auto-runs on default-branch pushes, publishes the very first release immediately when no release tag exists yet, and otherwise waits until at least 10 commits have landed since the previous release tag.

## Project Docs

- `PRD.md` for product and architecture direction
- `tasks.md` for the active work tracker
- `CHANGELOG.md` for significant project changes
- `CONTRIBUTING.md` for contribution expectations and signoff requirements

## Contributing

Contributions are welcome.

Contribution guidelines will live in [CONTRIBUTING.md](./CONTRIBUTING.md).

Contributors are expected to sign off their commits as described in that guide.

## Sponsors

Sponsorship links will be added here.

Sponsors will be listed here once the project has active supporters.

## License

NEXIS is publicly available under the source-available [PolyForm Noncommercial License 1.0.0](./LICENSE).

Commercial use is not granted under that public license. If you want to use NEXIS commercially, see [COMMERCIAL-LICENSING.md](./COMMERCIAL-LICENSING.md).

## Current Status

- The admin UI is intentionally empty while the next overlay-driven admin flow is defined
- Persistence, real-time sync, and final render routes are still in progress