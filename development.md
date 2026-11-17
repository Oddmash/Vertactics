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

1. Find the relevant requirements and checks in [SPEC.md](SPEC.md), then branch from the latest `origin/main`.
2. Keep commits focused. Open a pull request for each independently reviewable change and record the related SPEC IDs, verification, and remaining gaps.
3. Verify both views in a browser after changing terrain or map interactions. Attach screenshots for visual changes.
4. Wait for the `verify` check and review before merging.

## GitHub Actions

| Trigger | Checks |
| --- | --- |
| Pull request with only root, `docs/` or `skills/` Markdown, or the PR template | Check the diff for whitespace errors |
| Pull request with other changes | Check the diff, then install from the lockfile and run type checking, lint, unit tests, the production build, and Chromium |
| Push to `main` or manual run | Run the full application checks |

The `verify` job reports the result in every case. A newer revision cancels older runs of the same PR.

## Releases

1. Land the release changes on `main` and verify that CI is green for the release commit.
2. Update the package version and the reader-facing guides. Record changes to the map and strategy formats.
3. Tag the verified commit as `vMAJOR.MINOR.PATCH` and publish release notes in GitHub Releases. Include compatibility changes and the verification run.

## Map references and assets

The source code is available under the [MIT licence](LICENSE). Vertactics uses original schematic terrain meshes and no Blizzard or community textures, icons, models or overhead images in the application. Overwatch and King's Row are Blizzard Entertainment marks. Linked reference material remains subject to its own terms.

The King's Row Point A blockout uses the [StatBanana overhead survey](https://overwatch.statbanana.com/images) to cross-check the approach and plaza, the [Overwatch Wiki entry](https://overwatch.fandom.com/wiki/King%27s_Row) for the statue and Alderworth Hotel, and the [Point A breakdown](https://seesaawiki.jp/overwatchwiki/d/KING%27S%20ROW) for the choke, hotel bypass and balconies. The blockout has a separate objective surface, cover, and a selectable upper layer. An in-game screenshot corroborates the statue and hotel sharing the same plaza. [In-game screenshot](https://altertime.es/article/date-un-paseo-por-el-pasado-con-overwatch-clasico) Its dimensions, elevation and hero clearance have not been measured against the current game client.

Map editing and analysis use validated JSON and procedural geometry. GLB and glTF are deferred because the current map workflow needs editable collision and walkable surfaces. If a visual asset workflow is needed, import curated self-contained GLB files through a separate render-only boundary with byte and resource limits. Keep external resource fetching disabled and retain JSON as the source for editing, placement and analysis. The [Khronos specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) allows external references even in GLB containers.

### Check King’s Row Point A in the game client

Record the game build and compare the default map variant with the Vertactics blockout. Use **Distance measurement** in Vertactics to record both endpoints and the map-unit value. Keep game measurements in a separate column, with the in-game unit or observation method.

- Approach: check the main arch and the hotel bypass from the attacking side.
- High ground: record the relative height and access paths to the two balconies from the plaza.
- Clearance: record whether the same hero can walk through the arch and hotel entrance and where cover cuts sightlines. Include the hero and screenshots for any mismatch.

Keep the map status unverified until these comparisons are recorded.

## Hero catalogue

Keep hero IDs stable so older drafts can still resolve their placements. When adding a hero or reviewing a balance patch, compare roles and base ability names with the official hero page and update the source link if needed. The catalogue covers the 54 heroes listed by Blizzard on November 17, 2026. Each entry records the official role and the abilities listed under Abilities on its source page. Perks, Stadium powers and ability measurements are outside the catalogue. The editor uses text labels and original geometric team markers. Third-party portraits and ability icons require permission before bundling. [Official hero roster](https://overwatch.blizzard.com/en-us/heroes/) · [November live patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/11/)
