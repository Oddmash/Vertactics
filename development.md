# Develop and contribute to Vertactics

[한국어](development.ko.md)

## Run locally

Use Node.js 24 and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by Vite. The map needs a browser with WebGL 2 support.

Run `pnpm dev:landing` in a separate terminal and open `http://localhost:3000/about/` to develop the landing page. The landing uses the editor dev server for shared images and the editor link.

The pnpm workspace keeps the Vite editor in `apps/editor` and the Next.js landing in `apps/landing`. They share a lockfile and release, and the shared build preserves public editor URLs and tools. Add a shared package when both apps need a stable API. Split deployments or introduce a task orchestrator when independent releases or build caching justify the extra setup.

`pnpm build` assembles the two apps in `dist`. GitHub Pages serves the editor from the project root and the static landing from `/about/`. The legacy `about.html` navigates to the canonical landing. The sitemap is published at the project root. Domain-wide crawler directives come from the host’s root `robots.txt`, so submit the project sitemap directly when using a search console.

Hero portraits and map thumbnails are reused from the OWKR balance project. Ability icons are WebP conversions of the images already referenced in the official catalogue. The editor serves all three sets from `apps/editor/public/images`. The original attribution applies.

## Run checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm --filter @vertactics/editor exec playwright install chromium
pnpm test:e2e
```

Playwright serves the production build from `dist`. Screenshots appear in `apps/editor/test-results` locally and as the `editor-screenshots` artifact on the GitHub Actions run.

| Path | Purpose |
| --- | --- |
| `apps/editor/src/domain` | Map and strategy validation, coordinates, terrain geometry, and history |
| `apps/editor/src/map` | Demo map data |
| `apps/editor/src/render` | Terrain scene, cameras, and map picking |
| `apps/editor/src/editor` | Editor UI and interaction state |
| `apps/editor/src/theme` | JSON design tokens and styles |
| `apps/editor/tests` | Chromium scenarios |

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

Keep the map status unverified until geometric measurements, physical passage, and sightlines have been compared in the live client.

In a private custom match, record matching endpoints with Workshop’s `Position Of (Event Player)` HUD or the ray-hit position when a surface cannot be stood on. Keep Y as elevation. Record the hero and whether each route passes, and capture the game build, map variant, and screenshot references. [Workshop coordinate capture](https://us.forums.blizzard.com/en/overwatch/t/how-can-i-record-my-spots-coordinates/614247)

Run `node scripts/check-map-survey.mjs apps/editor/src/map/kings-row-point-a.json <survey.json>` to compare horizontal distances and signed rises in game units. The survey contains `mapId`, `gameBuild`, `variant`, `scaleReference`, `gameUnitsPerEditorUnit`, `tolerance`, and `segments`. Each segment contains `id`, `editor`, and `game`, with two ordered `[X, Y, Z]` points in each pair. Calibrate the scale using a separate measured distance. Use `main-arch-width`, `main-arch-height`, `hotel-entry-width`, `hotel-bypass-length`, `attack-balcony-rise`, and `defense-balcony-rise` for the Point A checks. The tool reports missing checkpoints and excess error. Record clearance and obstruction observations alongside its output.

### Audit an extracted objective against geometry

```sh
python3 scripts/audit-owmap-catalogue.py "$MAPS_ROOT" \
  --game-build 2.25.1.0.155284 --objectives "$OBJECTIVES_ROOT/MapObjectives/Areas.json" \
  --check-objective-centers kings-row --output /tmp/owmap-audit.json
```

The report matches records by the exact map and variant, counts coverage by mode, and checks the requested objective centers against the decoded model bounds in X, Y and Z. Repeat the option to check other map IDs. An incomplete catalogue still produces a report and returns exit status 1. Center containment is a coordinate sanity check. Scale and walkability require separate in-game measurements.

OWLib documents an MIT licence for its tooling. Track the rights for any geometry or artwork separately before including it in a public build. [OWLib](https://github.com/overtools/OWLib) · [Blizzard EULA](https://www.blizzard.com/en-us/legal/bfbbb648-bcc6-4b78-a5c7-e2fe20c135df/blizzard-end-user-license-agreement)

## Hero catalogue

Keep hero IDs stable so older drafts can still resolve their placements. When adding a hero or reviewing a balance patch, compare roles and base ability names with the official hero page and update the source link if needed. The catalogue covers the 54 heroes listed by Blizzard on November 17, 2026. Each entry records the official role and the abilities listed under Abilities on its source page. Perks, Stadium powers and ability measurements are outside the catalogue. The editor uses text labels and original geometric team markers. Third-party portraits and ability icons require permission before bundling. [Official hero roster](https://overwatch.blizzard.com/en-us/heroes/) · [November live patch notes](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/11/)

## OWKR catalogue

The hero IDs, Korean names, roles, and standard scrim map pool come from the OWKR Match catalogue snapshot, version `owkr-custom-2026-10-20`. Vertactics pairs that snapshot with official hero ability profiles. The map library lists 31 OWKR maps and opens the existing King's Row Point A schematic under the saved document ID `kings-row-a`. The other entries await a terrain document. [OWKR catalogue source](https://github.com/Overwatch-KR/owkr-balance/blob/91d786313399dad137b16efba21ad91c7388e05a/domains/draft/shared/default-catalog.ts)
