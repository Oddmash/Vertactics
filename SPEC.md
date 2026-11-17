# Vertactics implementation checklist

[한국어](SPEC.ko.md)

See [the product brief](PROMPT.md), [repository instructions](AGENTS.md), and [the development guide](development.md). Check an item when its stated scope has been verified. Track implementation, browser behavior, CI and deployment separately.

**Current phase** Phase 4. Continue with ramps, map schema migration, and the first objective of King’s Row.

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
- [ ] 1.11b Prepare issue and PR templates and a release process
- [ ] 1.12 Choose a source licence and document third-party assets

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
- [ ] 4.03b Model walkable ramps and their sloped surfaces
- [x] 4.04a Add rotation, material, and walkability controls with validated collision and sight flags
- [ ] 4.04b Consume collision and sight flags in spatial analysis
- [x] 4.05 Share the renderer between map editing and tactical planning
- [x] 4.06a Create and open maps and add, delete and duplicate blocks
- [x] 4.06b Select multiple objects
- [x] 4.07a Edit terrain dimensions and type
- [x] 4.07b Edit positions and layer assignments, rotate and snap terrain, and manage layer definitions
- [x] 4.08a Support undo and redo, validated JSON import and export, and immediate preview
- [ ] 4.08b Migrate map documents across schema versions
- [ ] 4.09 Record acceptable references for the first objective of King's Row
- [ ] 4.10 Build and compare approaches, high ground, cover, objective, floors and placement areas
- [x] 4.11 Verify floor switching, overlapping selection and map registration, editing and import
- [ ] 4.12 Evaluate GLB and glTF and define loading boundaries if needed

## Phase 5 · Heroes and abilities

- [ ] 5.01 Source hero IDs, roles, names, abilities and update criteria
- [ ] 5.02 Confirm icon rights and create neutral fallbacks
- [ ] 5.03 Model ability direction, range, shape, source and verification state
- [ ] 5.04 Render circles, spheres, cones, lines, rectangles, vectors and areas
- [ ] 5.05 Select, place, move, turn, hide and remove abilities
- [ ] 5.06 Share ability position, direction and elevation in 2D and 3D
- [ ] 5.07 Distinguish verified numbers from custom and estimated ranges
- [ ] 5.08 Unit test shapes and verify ability editing in a browser

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
