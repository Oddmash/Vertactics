---
name: vertactics-map-rendering
description: Implement Vertactics map schemas, world coordinates, terrain geometry, picking, and shared 2D and 3D camera views.
---

1. Read the relevant requirements in `SPEC.md` and the coordinate rules in `AGENTS.md`. Update the domain schema and its validation before changing maps that depend on it.
2. Preserve X as horizontal, Y as height and Z as depth. In the 2D view north is −Z. Distinguish a terrain object's minimum corner, mesh center and walkable surface elevation.
3. Keep domain calculations renderer-independent. Share scene data, geometry, terrain IDs and selections between camera modes. Switch mode without modifying persisted positions.
4. Check stair direction and top elevation, overlapping surfaces, invalid inputs and legacy schema versions. Use `u` for world units until a real-world conversion is verified.
5. Document the source and verification status of real-map geometry. Keep the synthetic elevation lab available for reproducible tests.

[Korean guide](guide.ko.md)
