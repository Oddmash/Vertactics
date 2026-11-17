# Develop and contribute to Vertactics

[한국어](development.ko.md)

## Run locally

Use Node.js 24 and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by Vite. The map needs a browser with WebGL 2 support.

## Run checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright serves the production build from `dist`. Screenshots appear in `test-results` locally and as the `editor-screenshots` artifact on the GitHub Actions run.

| Path | Purpose |
| --- | --- |
| `src/domain` | Map and strategy validation, coordinates, terrain geometry, and history |
| `src/map` | Demo map data |
| `src/render` | Terrain scene, cameras, and map picking |
| `src/editor` | Editor UI and interaction state |
| `src/theme` | JSON design tokens and styles |
| `tests` | Chromium scenarios |

Map JSON is validated on import. The editor opens v1 and v2 files and exports v2. Strategy documents use their own version.

## Contribute

1. Find the relevant requirements and checks in [SPEC.md](SPEC.md).
2. Follow [AGENTS.md](AGENTS.md) and run the checks affected by your change.
3. Verify both views in a browser after editing terrain or map interactions.
4. Open a pull request explaining the change and its verification. Include screenshots for visual changes.
