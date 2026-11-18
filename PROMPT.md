# Vertactics product brief

[한국어 상세 원본](PROMPT.ko.md) · [Implementation checklist](SPEC.md)

Vertactics is an independent fan project for exploring Overwatch maps and planning team movement. Players should be able to view routes, elevation, cover, sightlines, and hero abilities in a shared 2D and 3D workspace. The application models tactical positioning and timing. Combat simulation and damage calculation fall outside the product scope.

## Editor and data

- Use a shared world coordinate system with Y as elevation. Keep hero placements, routes, markers, and selected objects consistent when switching views.
- Keep the renderer separate from validated, versioned map and strategy data. Capture transient input and camera state separately.
- Use fictional layouts as test fixtures. Develop public map references from the Overwatch catalogue and record verification status.
- Keep public terrain in the maintained catalogue. Support tactical editing, layer visibility and strategy import and export, including saved terrain snapshots.
- Provide hero placement and team controls, tactical annotations, ability previews, visibility analysis, and distance and height measurements. Show which ability values are verified or approximate.
- Support a strategy timeline, local persistence, validated imports, and read-only sharing. Make failures and recoverable edits visible.

## Delivery

Build a responsive, dark-first editor around the shared map view. Support keyboard navigation, readable team indicators, accessible alternatives to map actions where practical, and Korean and English. Keep project identity independent and use third-party assets only within their permissions.

Implement in nine phases. Start with project setup and rendering, then deliver the tactical editor, map tools, hero abilities, spatial analysis, strategy features, product polish, and release verification. Record verified behavior in [SPEC.md](SPEC.md). Verify actual browser behavior and capture screenshots before documenting completed features. Keep the README focused on the product and put contributor setup in [development.md](development.md).

The [Korean source brief](PROMPT.ko.md) retains the complete original requirements and acceptance criteria.
