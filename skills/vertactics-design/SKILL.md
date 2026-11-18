---
name: vertactics-design
description: Design, implement, and review Vertactics landing pages, product visuals, visual tokens, and tactical editor interfaces. Apply to Vertactics branding, map previews, responsive interaction, Korean and English copy, and design QA in the browser.
---

# Vertactics Design

## Start with a tactical decision

1. Read the current product brief, SPEC, and affected UI. Review the actual editor or its latest captures before changing product claims or visuals. In the Vertactics repository, start with `PROMPT.md`, `SPEC.md`, and `AGENTS.md`.
2. Pick a concrete decision the page helps someone make. Lead the landing with how elevation, sightlines, and approach routes change the plan. Use the same terrain or scenario across comparable views. Connect the example to an editor entry point.
3. On workspace changes, follow `skills/editor-design/SKILL.md`. Prioritize map area and group selection-dependent actions next to the selected entity. Preserve map state, tactical objects, and tool intent across camera modes.

## Express the product through the map

- Use real editor captures or verified map data for product visuals. A tight crop can establish terrain shape. Keep interface frames for moments when the control itself matters. Use the same map for view comparisons and label a capture as a preview.
- Use dark slate, the Vertactics lime action color, and quiet grid lines to evoke the map canvas. Keep mint for focus, and use map and team colors alongside a text label or shape. Define reusable values in JSON alongside the affected app. Look up current tokens in `apps/landing/app/landing-tokens.json` and `apps/editor/src/theme/tokens.json`.
- Set a strong display hierarchy and keep compact labels legible. Give each region one primary action. Write the benefit in terms of the decision being made. When editing Korean copy, check natural phrasing, word breaks, and the effect of the longest labels in the supported UI languages.
- Base feature and map-status claims on the latest shipped behavior. Describe approximate maps as approximate and distinguish an available catalogue entry from editable terrain. Keep the independent fan-project credit visible.

## Check the real flow

- At desktop and narrow widths, check the first useful action, page and panel overflow, readable map details, keyboard focus, touch controls, and active states. Check contrast and honor reduced motion for any motion introduced.
- On the landing, test each 2D/3D control with keyboard and touch, confirm its caption and pressed state match the visual, and open the editor from the main CTA. Verify the static build at the repository's production base path, including images, canonical metadata, and share metadata.
- For workspace visuals, exercise the feature on the canvas and capture representative states from the current build. Record verified results and any limits in SPEC when the repository requires them.
