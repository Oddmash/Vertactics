# Vertactics implementation checklist

[한국어](SPEC.ko.md)

See [the product brief](PROMPT.md), [repository instructions](AGENTS.md), and [the development guide](development.md). Check an item when its stated scope has been verified. Track implementation, browser behavior, CI and deployment separately.

**Current phase** Phase 4. The Point A schematic and map-system checks are complete. Live-game geometry and clearance verification remain open before Phase 4 closes.

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
- [x] 4.11 Verify floor switching, overlapping selection and map registration, editing and import
- [x] 4.12 Evaluate GLB and glTF and define loading boundaries if needed

## Phase 5 · Heroes and abilities

- [x] 5.01a Source IDs, roles and base abilities for the three starter heroes and document update criteria
- [ ] 5.01b Expand and verify the hero roster
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

- [ ] 6.01 Connect terrain and heroes to raycasting and blocking rules
- [ ] 6.02 Show sightlines and test walls, cover and elevation between units or arbitrary points
- [ ] 6.03 Evaluate partial exposure and describe model limitations
- [ ] 6.04 Show horizontal and straight-line distances, elevations and route length
- [ ] 6.05 Switch to a selected hero view and restore the original camera
- [ ] 6.06 Test blocked and clear paths, boundaries and stairs
- [ ] 6.07 Measure raycasting and decide whether to use a BVH

## Phase 7 · Strategy tools

- [ ] 7.01 Model phases, timing, hero positions, abilities and durations
- [ ] 7.02 Edit phases and share playback, pause, seeking and speed controls across views
- [ ] 7.03 Verify interpolation, playback boundaries and restoration at an intermediate point
- [ ] 7.04 Create, list, reopen, clone and delete strategies in IndexedDB
- [ ] 7.05 Handle autosave, errors, close recovery, migration and corrupt documents
- [ ] 7.06 Support validated JSON import and export and PNG export
- [ ] 7.07 Support share links, size limits, read-only views, duplication and validation
- [ ] 7.08 Verify save, reload, restore, export and re-import end to end

## Phase 8 · Product polish

- [ ] 8.01 Build product, map, strategy, settings and help screens
- [ ] 8.02 Add onboarding, empty states, errors, recovery and input help
- [ ] 8.03 Check panels, shortcuts, drag and drop and context menus
- [ ] 8.04 Verify Korean and English UI, accessible names, dates and numbers
- [ ] 8.05 Verify keyboard, focus, contrast, screen readers, team cues and reduced motion
- [ ] 8.06 Check desktop workflows and touch layouts for clipping and wrapping
- [ ] 8.07 Ship independent branding, favicon, social card and fan-project notice
- [ ] 8.08a Capture the current workspace on desktop and narrow screens and record the layout and interaction baseline
- [ ] 8.08b Define a canvas-first workspace with one map and strategy header, a compact tool rail, and a contextual inspector
- [ ] 8.08c Rework typography, spacing, surfaces, focus, and semantic colors through shared JSON tokens
- [ ] 8.08d Rebuild hero, ability, terrain, and analysis controls around active tool and selection states
- [ ] 8.08e Adapt tool and inspector access for narrow screens and verify touch targets and canvas space
- [ ] 8.08f Verify keyboard, responsive layouts, 2D and 3D view continuity, and save and restore in a browser, then capture the redesigned workspace

## Phase 9 · Quality and release

- [ ] 9.01 Unit test coordinate, elevation, distance, visibility, abilities, serialization, history and timeline logic
- [ ] 9.02 Integrate map, floor, hero, ability, sightline and saving flows and test end to end
- [ ] 9.03 Verify Chromium, Firefox, WebKit and WebGL fallback
- [ ] 9.04 Review render quality, picking, panels, occlusion and responsive layouts
- [ ] 9.05 Record measurement environment, draw calls, memory, input latency and load performance
- [ ] 9.06 Apply instancing, resource reuse, disposal and lazy loading where measured
- [ ] 9.07 Add real captures to the product README and link usage, development, contribution and licence information
- [ ] 9.08 Verify CI, production build, static paths, errors and metadata
- [ ] 9.09 Deploy to an approved public URL and check WebGL, console and core flows

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
