# Vertactics repository instructions

[한국어](AGENTS.ko.md)

## Start work

- Read [PROMPT.md](PROMPT.md) for product direction and [SPEC.md](SPEC.md) for verification and the next task.
- Inspect the worktree, current branch, and remote HEAD. Preserve user edits and history. Include only relevant files in each commit.
- Continue with the next unfinished item. Record environmental blockers in SPEC and proceed with independent work.
- Write English as the default for repository documentation. Update the linked Korean version in the same change.

## Implement

- Use kebab-case for file and directory names. Follow GitHub and Codex conventions and honor requested document names.
- Declare React components with `const`. Use a default export for the primary component and named exports for multiple types or utilities.
- Keep new code free of comments. Express intent with names and structure, and record design decisions in documentation.
- Share `[X, Y, Z]` between map and strategy code. Y is elevation. Switching 2D and 3D preserves world data and selection.
- Keep domain logic independent of React and Three.js. Validate external JSON and versions. Keep view state separate from map and strategy documents.
- Store shared visual values in JSON tokens. Confirm permissions for external assets and record map verification status.

## Verify and deliver

- Run checks affected by each change. At product checkpoints run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`.
- For rendering changes, verify the real canvas, both modes, and any affected picking or elevation behavior. Capture the actual application.
- Check off only verified requirements in SPEC. Record the command or evidence and distinguish local checks, remote CI, and deployment.
- Make one reviewable change per commit. Verify remote HEAD before updating an approved branch. Use fast-forward updates and preserve any concurrent changes.
- Confirm the resulting remote SHA and CI. Record blockers and continue independent work.

| Work | Instructions |
| --- | --- |
| Phase delivery and SPEC updates | [phase-delivery](skills/phase-delivery/SKILL.md) |
| Coordinate systems, terrain, cameras and assets | [map-rendering](skills/map-rendering/SKILL.md) |
| Browser verification, screenshots and CI | [browser-verification](skills/browser-verification/SKILL.md) |
