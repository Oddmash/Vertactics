---
name: vertactics-editor-design
description: Design and verify the Vertactics tactical editor, its navigation, viewport, responsive panels, selection tools, visual tokens, and accessibility states.
---

1. Read the product brief and UI checklist in SPEC. Map the user flow from choosing a map to placing, inspecting, saving, and restoring a strategy. Keep the viewport visible while completing that flow.
2. Use the tactical whiteboard pattern as a reference for hierarchy. Keep map and strategy actions in one header, recurring tools within easy reach of the canvas, and selection-specific controls in a contextual inspector. Use Vertactics typography, tokens, assets, and wording.
3. Treat 2D and 3D as two views of one workspace. Keep selection, placement, tool intent, and coordinate readouts stable as views change. Put camera and visibility controls next to the viewport.
4. Keep controls predictable. Use visible labels or accessible names for icon controls, distinct active states, explicit confirmation for draft replacement, and status text for errors and save feedback. Use text or shape in addition to color for teams and analysis results. Honor reduced motion.
5. Define shared colors, typography, spacing and sizing in the JSON tokens. Organize desktop, narrow-screen and touch layouts around canvas space and readable controls. Collapse secondary panels into drawers or sections where space is limited.
6. Compare real browser captures on desktop and narrow screens. Verify keyboard and focus behavior, Korean and English label lengths, selection in both views, drag versus camera controls, and the strategy save and restore flow. Record uncaptured or unverified behavior in SPEC.
