# Vertactics implementation checklist

[한국어](SPEC.ko.md)

See [the product brief](PROMPT.md), [repository instructions](AGENTS.md), and [the development guide](development.md). Check an item when its stated scope has been verified. Track implementation, browser behavior, CI and deployment separately.

**Current work** Public preview on GitHub Pages. Live-game geometry and clearance, third-party icon rights, and manual screen-reader verification remain open. The map and strategy catalogues, settings, and help are available inside the workspace. The product introduction is available from Help and the README.

## Phase 1 · Project setup

- [x] 1.01 Confirm the project name and personal GitHub repository
- [x] 1.02 Compare the public features of five existing tools
- [x] 1.03 Declare React, TypeScript, Vite, Three.js, R3F and project scripts
- [x] 1.04 Set up directories for domain logic, maps, rendering, editor, tokens and tests
- [x] 1.05 Configure strict TypeScript, ESLint, Vitest and Playwright
- [x] 1.06 Set up Actions for installation, type checks, lint, unit tests, build and E2E
- [x] 1.07 Create JSON tokens for colour, spacing, typography and radii
- [x] 1.08 Validate map schema version, terrain IDs, positions and dimensions
- [x] 1.09 Write product README, contributor guide, agent instructions and phase checklist
- [x] 1.10 Commit the pnpm lockfile and verify a frozen CI install
- [x] 1.11a Document installation, execution, testing and contribution
- [x] 1.11b Prepare issue and PR templates and a release process
- [x] 1.12 Choose a source licence and document third-party assets

## Phase 2 · Rendering foundation

- [x] 2.01 Implement a shared Y-up coordinate system with −Z north
- [x] 2.02 Create demo terrain with floors, walls, platforms and stairs
- [x] 2.03 Verify mesh centres and map bounds
- [x] 2.04 Verify stair direction and top elevation on ±X and ±Z
- [x] 2.05 Build R3F terrain geometry, outlines, materials and grid
- [x] 2.06 Implement top-down orthographic and perspective cameras
- [x] 2.07 Implement pan, zoom, orbit and reset
- [x] 2.08 Implement terrain lists, selection, coordinate and elevation details and WebGL fallback
- [x] 2.09 Add Chromium scenarios and 2D and 3D captures
- [x] 2.10 Pass full type checks, lint, unit tests and production build
- [x] 2.11 Verify floors, walls, platforms and stairs in both Chromium views
- [x] 2.12 Verify pan, orbit, wheel zoom, reset and selection and elevation retention
- [x] 2.13 Record real 2D and 3D captures, browser and viewport size
- [x] 2.14 Verify the remote default branch and first CI run

## Phase 3 · Basic tactical editor

- [x] 3.01 Version strategy documents and validate teams, heroes and placements
- [x] 3.02 Separate input, strategy and camera state and initialize a draft
- [x] 3.03 Validate versions, teams, coordinates, headings and duplicate IDs
- [x] 3.04 Provide team colours and explicit team text and shapes
- [x] 3.05 Select a hero and place it on a valid surface
- [x] 3.06a Verify 2D placement and high ground movement, then 3D rotation and deletion
- [x] 3.06b Verify placement, movement and direct hero picking separately in both views
- [x] 3.07a Apply floor and high-ground elevation and reject wall placement
- [x] 3.07b Verify stair tread placement and elevation above the base floor
- [x] 3.07c Verify selection between independently walkable stacked floors
- [x] 3.08 Show selection, coordinates, elevation, heading and team controls
- [x] 3.09 Add, edit and delete tactical routes and waypoints
- [x] 3.10 Edit and display line, circle, area and note markers
- [x] 3.11 Support snapping, locking, visibility and keyboard actions
- [x] 3.12a Unit test undo and redo for placement, update and deletion
- [x] 3.12b Verify undo and redo restores placement elevation in the editor
- [x] 3.12c Verify that a continuous drag creates a single history entry
- [x] 3.13 Verify that team, position and elevation survive switching to 3D

## Phase 4 · Map system

- [x] 4.01 Add metadata, verification states, map registration and selection
- [x] 4.02 Add layers and selection and visibility rules for non-active floors
- [x] 4.03a Add buildings, columns, railings, doorway openings, and drop-zone markers
- [x] 4.03b Model walkable ramps and their sloped surfaces
- [x] 4.04a Add rotation, material, and walkability controls with validated collision and sight flags
- [x] 4.04b Consume collision and sight flags in spatial analysis
- [x] 4.05 Share the renderer between map editing and tactical planning
- [x] 4.06a Create and open maps and add, delete and duplicate blocks
- [x] 4.06b Select multiple objects
- [x] 4.07a Edit terrain dimensions and type
- [x] 4.07b Edit positions and layer assignments, rotate and snap terrain, and manage layer definitions
- [x] 4.08a Support undo and redo, validated JSON import and export, and immediate preview
- [x] 4.08b Migrate map documents across schema versions
- [x] 4.09 Record acceptable references for the first objective of King's Row
- [x] 4.10a Build the schematic Point A map, compare its landmarks with public references and verify it in the editor
- [ ] 4.10b Verify dimensions, elevations and hero clearance against the live game client
- [ ] 4.10c Compare the Point A Workshop survey with the editor using the [survey checker](development.md#check-kings-row-point-a-in-the-game-client). The live survey is pending.
- [ ] 4.10d Survey all 31 competitive maps in the catalogue and build playable 2D layouts. The catalogue links to public overhead references where the source has coverage.
- [ ] 4.10e Verify the 31 single-surface 2D schematics and whole-map/location camera presets in the editor. Schematic coordinates are placeholders for planning, and the existing King’s Row Point A survey remains a separate map.
- [x] 4.11 Verify floor switching, overlapping selection and map registration, editing and import
- [x] 4.12 Evaluate GLB and glTF and define loading boundaries if needed

## Phase 5 · Heroes and abilities

- [x] 5.01a Source IDs, roles and base abilities for the three starter heroes and document update criteria
- [x] 5.01b Expand and verify the hero roster
- [ ] 5.02 Confirm icon rights and create neutral fallbacks
- [x] 5.03a Model custom preview direction, range, shape and provenance
- [x] 5.03b Store a user-measured or estimated range with its source and game version
- [x] 5.04a Render circle, sphere, cone, line, rectangle, vector and ground area outlines
- [x] 5.04b Represent persistent areas and their durations
- [x] 5.05a Select, rotate, show and hide a hero-anchored preview
- [x] 5.05b Place, move, rotate and remove independent ability objects
- [x] 5.06a Share preview position, direction and elevation across 2D and 3D
- [x] 5.06b Share independent ability placement across 2D and 3D
- [x] 5.07a Label custom range values and their map units
- [x] 5.07b Label user-measured and estimated ranges with their sources and units
- [x] 5.08a Test preview shape geometry and browser view switching
- [x] 5.08b Verify saved ability editing in a browser

## Phase 6 · Spatial analysis

- [x] 6.01 Use terrain geometry and hero or terrain endpoints for sightline and collision queries
- [x] 6.02a Show hero-to-hero sightlines and mark the first blocking surface in both views
- [x] 6.02b Pick arbitrary terrain endpoints and verify sightlines across walls, cover and elevation
- [x] 6.03 Evaluate partial exposure and describe model limitations
- [x] 6.04 Show horizontal and straight-line distances, elevations and route length
- [x] 6.05 Switch to a selected hero view and restore the original camera
- [x] 6.06 Test blocked and clear paths, boundaries and stairs
- [x] 6.07 Measure raycasting and decide whether to use a BVH

## Phase 7 · Strategy tools

- [x] 7.01 Model phases, timing, hero positions, abilities and durations
- [x] 7.02a Edit phases, capture hero poses, and schedule ability events
- [x] 7.02b Share playback, pause, seeking and speed controls across both views
- [x] 7.03 Verify interpolation, playback boundaries and restoration at an intermediate point
- [x] 7.04 Create, list, reopen, clone and delete strategies in IndexedDB
- [x] 7.05 Handle autosave, errors, close recovery, migration and corrupt documents
- [x] 7.06 Support validated JSON import and export and PNG export
- [x] 7.07 Support share links, size limits, read-only views, duplication and validation
- [x] 7.08 Verify save, reload, restore, export and re-import end to end

## Phase 8 · Product polish

- [x] 8.01 Build product, map, strategy, settings and help screens
- [x] 8.02 Add onboarding, empty states, errors, recovery and input help
- [x] 8.03 Check panels, shortcuts, drag and drop and context menus
- [x] 8.04 Verify Korean and English UI, accessible names, dates and numbers
- [ ] 8.05 Verify keyboard, focus, contrast, screen readers, team cues and reduced motion
- [x] 8.06 Check desktop workflows and touch layouts for clipping and wrapping
- [x] 8.07 Ship independent branding, favicon, social card and fan-project notice
- [x] 8.08a Capture the current workspace on desktop and narrow screens and record the layout and interaction baseline
- [x] 8.08b Define a canvas-first workspace with one map and strategy header, a compact tool rail, and a contextual inspector
- [x] 8.08c Rework typography, spacing, surfaces, focus, and semantic colors through shared JSON tokens
- [x] 8.08d Rebuild hero, ability, terrain, and analysis controls around active tool and selection states
- [x] 8.08e Adapt tool and inspector access for narrow screens and verify touch targets and canvas space
- [x] 8.08f Verify keyboard, responsive layouts, 2D and 3D view continuity, and save and restore in a browser, then capture the redesigned workspace
- [ ] 8.08g Add patch-verified ability descriptions and statistics across the hero roster. The sidebar links to official hero profiles and shows sourced descriptions and statistics where verified. Portrait URLs come from the OWKR manifest and point to Blizzard's CDN.
- [x] 8.09a After reviewing the integrated Phase 8 UI, open a separate PR to refactor workspace state and module boundaries around the verified workflows
- [x] 8.09b Keep map and strategy switching, restoration, and document commands under workspace ownership. Give UI panels the data and actions they need
- [x] 8.09c Keep world rules and document validation independent of React, rendering, and browser storage. Verify existing editor, playback, and save and restore flows after the refactor

## Phase 9 · Quality and release

- [x] 9.01 Unit test coordinate, elevation, distance, visibility, abilities, serialization, history and timeline logic
- [x] 9.02 Integrate map, floor, hero, ability, sightline and saving flows and test end to end
- [x] 9.03 Verify Chromium, Firefox, WebKit and WebGL fallback
- [x] 9.04 Review render quality, picking, panels, occlusion and responsive layouts
- [x] 9.05 Record measurement environment, draw calls, memory, input latency and load performance
- [x] 9.06 Apply instancing, resource reuse, disposal and lazy loading where measured
- [x] 9.07 Add real captures to the product README and link usage, development, contribution and licence information
- [x] 9.08 Verify CI, production build, static paths, errors and metadata
- [x] 9.09 Deploy to an approved public URL and check WebGL, console and core flows

## Verification record

| Checkpoint | Result |
| --- | --- |
| Initial rendering work | Local map and strategy unit checks ran through development. GitHub Actions later verified frozen installation, type checks, lint and the production build. |
| CI #13 | Chromium 158 at 1440 × 900. 22 unit tests and two Chromium scenarios passed. Checked terrain picking, hero placement, team, coordinates, elevation and undo/redo. [Screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44028807455/artifacts/14304237794) |
| Routes and markers | 24 unit tests and four Chromium scenarios passed. Verified route waypoint editing and undo, marker creation, note editing, and switching views. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44030502710) |
| Editor controls | 26 unit tests and five Chromium scenarios passed. Verified grid snapping on platforms and stairs, edit lock, keyboard shortcuts and layer visibility. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44031144923) |
| Phase 3 and map editing | 28 unit tests and nine Chromium scenarios passed. Verified stacked surface picking, 2D and 3D hero editing, a single history entry per drag, map switching and JSON transfer, and block editing with undo and redo. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44032978306) |
| Layer and multi-selection editing | 30 unit tests and 11 Chromium scenarios passed. Verified layer creation, renaming and deletion, rotation, grid snapping, and batched duplication and undo. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44033821083) |
| Terrain structures | 31 unit tests and 11 Chromium scenarios passed. Doorway geometry preserves an opening and map JSON validates terrain properties. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44034026109) |
| Ramps and map schema | 37 unit tests and 12 Chromium scenarios passed. Verified ramp placement, dragging and elevation after snapping. Legacy v1 imports export as v2. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44034705436) |
| Phase 1–4 audit | 39 unit tests and 14 Chromium scenarios passed, including Point A placement, floor switching and hero obstruction. GitHub issue and PR templates, release steps, licensing and the optional GLB loading boundary are in place. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44035786865) |
| Terrain measurement | 40 unit tests and 15 Chromium scenarios passed. A two-point measurement reports horizontal distance, signed elevation change, and straight-line distance in map units across views. Live game comparison remains open. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44036751794) |
| Starter hero catalogue | 42 unit tests and 16 Chromium scenarios passed. Verify grouped roles, placement, and sourced ability names in the inspector. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44037981117) |
| Hero ability previews | 45 unit tests and 17 Chromium scenarios passed. Verified custom ranges and view switching using a hero-anchored cone. Type checks, lint and the production build passed. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44039103823) · [2D and 3D screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44039103823/artifacts/14309061041) |
| Independent ability placement | 47 unit tests and 18 Chromium scenarios passed. Verified high-ground placement, moving, rotation, view switching, visibility, removal, and undo. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44040575157) · [2D and 3D screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44040575157/artifacts/14308738616) |
| Custom area durations | Verified duration validation, placement, editing, switching views, clearing and undo. Strategy playback timing remains in Phase 7. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44041404112) · [Screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44041404112/artifacts/14309283253) |
| Ability range references | 49 unit tests and 20 Chromium scenarios passed. Verified source, game version, measured and estimated labels, separate meters and map units, view switching, clearing and undo. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44042312699) · [Screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44042312699/artifacts/14310001845) |
| Local strategy draft | Verified manual saving, reloading, restoring and editing an ability with its reference. Empty and malformed storage leave the workspace usable. Multiple drafts and autosave remain open in Phase 7. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44043379399) · [Restored editor screenshot](https://github.com/qtaghdi/Vertactics/actions/runs/44043379399/artifacts/14310311989) |
| Hero sightlines | 50 unit tests and 21 Chromium scenarios passed. Checked the first blocking surface, an elevated clear ray, blocked overlay in both views and target reset. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44044442148) · [2D and 3D screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44044442148/artifacts/14311166558) |
| Terrain point sightlines | 50 unit tests and 22 Chromium scenarios passed. Verified a blocked wall, low cover, a clear elevation change, view switching and clearing the probe. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44045214843) · [Browser screenshots](https://github.com/qtaghdi/Vertactics/actions/runs/44045214843/artifacts/14311187263) |
| Partial hero exposure | Verified the three-height sampling model, partial exposure behind cover, and the in-app explanation of fixed heights. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44045878353) · [Screenshot](https://github.com/qtaghdi/Vertactics/actions/runs/44045878353/artifacts/14312225037) |
| Route and endpoint measurements | 52 unit tests and 23 Chromium scenarios passed. Verified both waypoint length totals and point heights, view switching and undo. Route lengths sum the drawn segments. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44046212660) · [Screenshot](https://github.com/qtaghdi/Vertactics/actions/runs/44046212660/artifacts/14310374904) |
| Hero eye-level camera | Verified the modeled heading, Escape, and exact canvas restoration after adjusting the 2D and 3D cameras. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44047235106) · [Hero eye-level screenshot](https://github.com/qtaghdi/Vertactics/actions/runs/44047235106/artifacts/14312660585) |
| Spatial boundaries | 55 unit tests and 25 Chromium scenarios passed. Verified wall boundaries, clear door openings, stair seams and the blocked and open sections of the training map stairs. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44047549788) |
| Sightline CPU timing | One eye-level ray and three exposure rays per observation, 1,000 warm-ups and 5,000 seeded pairs per case. Local arm64 with Node.js 24.14.0. P95 was 0.002 ms for Courtyard (4 blocks), 0.008 ms for Elevation Lab (21), 0.011 ms for King's Row Point A (39), and 0.318 ms for a synthetic 32-copy Point A layout (1,248). The sample measures domain CPU time. Defer BVH for the current maps and remeasure if live updates or larger maps are introduced. |
| Sightline inputs and visibility layers | 56 unit tests and 26 Chromium scenarios passed. Hero placements supply eye-height endpoints. Segment intersection uses the full terrain map with independent sight and collision flags, including when a layer is hidden. Viewport picking uses Three.js; sightline analysis uses the validated terrain geometry. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44048791767) · [Screenshot](https://github.com/qtaghdi/Vertactics/actions/runs/44048791767/artifacts/14312971060) |
| Strategy timeline editing | 58 unit tests and 27 Chromium scenarios passed. Validated timed events and IDs, placement dependencies, phase edits, undo, and restoring phases from a browser draft. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44049905226) |
| Strategy playback | 60 unit tests and 27 Chromium scenarios passed. Verified position and heading interpolation, phase and event boundaries, viewing a sought point in both cameras, and returning to the editable strategy. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44051109069) |
| Local strategy library | 60 unit tests and 29 Chromium scenarios passed. Verified named saves, recent order, update, duplication, confirmed deletion, restoration and in-place upgrade of a legacy workspace draft. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44052203062) |
| Workspace autosave and recovery | 60 unit tests and 31 Chromium scenarios passed. Verified autosave, page-hide flush, reload and explicit restoration, malformed recovery and write failure, and preservation of named saves. Legacy named-draft migration is covered by the local strategy library checkpoint. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44053504783) |
| Strategy file transfer and image export | 60 unit tests and 33 Chromium scenarios passed. Verified invalid import handling, saving, reload, restore, export and re-import of a map and timed plan. Decoded both PNG downloads and verified distinct nonblank views. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44054863071) |
| Strategy share links | 62 unit tests and 35 Chromium scenarios passed. Verified read-only view, playback, JSON export, local duplication, malformed links and payload limits. Links carry a compressed snapshot. Strategies over the link limit can be transferred as JSON. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44055871444) |
| Canvas-first workspace | Added workspace navigation, a tool strip next to the canvas, touch sizing, and narrow-screen browser coverage. Local dependency installation is blocked by npm DNS resolution and missing offline packages. Browser evidence and CI are tracked separately. |
| Workspace baseline and narrow-screen reflow | Reviewed the 1440 × 900 and 390 × 844 Chromium captures. The design before compact controls placed the narrow canvas below y=635. The revised test requires its top above y=430, exercises touch targets, and captures both views. [Baseline](https://github.com/qtaghdi/Vertactics/actions/runs/44066432574/artifacts/14321390541) · [Revised captures](https://github.com/qtaghdi/Vertactics/actions/runs/44070388892/artifacts/14321698791) |
| Localized workspace and document boundaries | Korean and English labels, focus, coordinates and saved dates were verified across view switching, reload and restore. A separate PR verified document ownership refactoring through the existing editing, playback, import, sharing and recovery flows. [Locale CI](https://github.com/qtaghdi/Vertactics/actions/runs/44066432574) · [Architecture CI](https://github.com/qtaghdi/Vertactics/actions/runs/44067153900) |
| OWKR catalogue | All 54 hero IDs, Korean names and roles match OWKR Match. Its 31-map pool is browseable in both languages. King’s Row opens the existing Point A terrain under `kings-row-a`. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44072435978) |
| Browser compatibility | Chromium runs the full suite. Firefox and WebKit verify terrain inspection and selection through both view modes and forced WebGL fallback. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44067292922) |
| Renderer baseline and batching | Linux x64, Chromium 158.0.8127.18, ANGLE SwiftShader at 1440 × 900. Draw calls in each mode changed from 9 to 6 for Courtyard, 43 to 23 for Elevation Lab, and 79 to 41 for King’s Row. First draw was 504.5 ms on Intel Xeon 8573C and 307.1 ms on AMD EPYC 9V74. Selection-event-to-draw samples were 5.9–18.3 ms and 4.8–20.4 ms. JS heap was 11.36 and 10.88 MiB. Timing and heap samples come from different runners. [Baseline](https://github.com/qtaghdi/Vertactics/actions/runs/44066787788) · [Batched renderer](https://github.com/qtaghdi/Vertactics/actions/runs/44069847978) |
| Public preview | The first production deployment passed favicon, metadata, WebGL, 404, shared strategy and local save/restore checks against the public repository path. [Production CI](https://github.com/qtaghdi/Vertactics/actions/runs/44071463018) · [Live editor](https://qtaghdi.github.io/Vertactics/) |
| Amber and mint control refresh | The shared editor controls passed type checks, lint, unit tests, build, Chromium 2D/3D and narrow-screen flows, and Firefox/WebKit compatibility. Chromium verified picker opening, Escape dismissal and keyboard focus. [CI](https://github.com/qtaghdi/Vertactics/actions/runs/44079651733) · [Editor captures](https://github.com/qtaghdi/Vertactics/actions/runs/44079651733/artifacts/14327260355) |
