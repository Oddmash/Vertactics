# Vertactics repository instructions

## Start work

- Read [PROMPT.md](PROMPT.md) for product direction and [SPEC.md](SPEC.md) for verification and the next task.
- Inspect the worktree, current branch, and remote HEAD. Preserve user edits and history. Include only relevant files in each commit.
- Branch from the current remote `main` for each independently reviewable change. Use descriptive kebab-case branch names such as `feat/ability-placement` or `ci/pr-verification`.
- Continue with the next unfinished item. Record environmental blockers in SPEC and proceed with independent work.
- Track product changes in GitHub issues and link each implementation PR to its issue. Keep partially resolved issues open with the remaining verification or implementation work recorded.
- Write repository documentation in English. Maintain Korean translations for reader-facing documents such as README, the development guide and SPEC. Keep agent instructions and skill guides in English.

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
- Make one reviewable change per commit. Push the topic branch with a fast-forward and open a PR for each independently reviewable change. Include its SPEC IDs, verification evidence, and known gaps.
- Confirm that all CI workflows for the current PR head have passed and that the PR can merge. Merge the verified head, preserving logical commits. If CI fails or the PR is blocked, resolve what you can and continue independent work on a separate branch.

| Work | Instructions |
| --- | --- |
| Phase delivery and SPEC updates | [phase-delivery](skills/phase-delivery/SKILL.md) |
| Coordinate systems, terrain, cameras and assets | [map-rendering](skills/map-rendering/SKILL.md) |
| Browser verification, screenshots and CI | [browser-verification](skills/browser-verification/SKILL.md) |
| Editor layout, controls, design tokens and accessibility | [editor-design](skills/editor-design/SKILL.md) |
| Landing, product visuals, visual identity and design QA | [vertactics-design](skills/vertactics-design/SKILL.md) |
