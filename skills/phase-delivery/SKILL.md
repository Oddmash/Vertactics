---
name: vertactics-phase-delivery
description: Advance Vertactics phases using PROMPT.md and SPEC.md, update verified checklist items, and deliver logical commits to the approved branch.
---

1. Read the current phase in `PROMPT.md` and its corresponding IDs in `SPEC.md`. Inspect the working tree and remote branch first.
2. Choose the smallest coherent change that advances the phase. Keep user edits intact and validate the normal application entry point when available.
3. Check items supported by source inspection, automated checks, or browser evidence according to each item's wording. Record command, result and remaining blocker in `SPEC.md`.
4. Review the exact files and whitespace before committing. Use a descriptive commit message. Update the approved branch with a fast-forward and verify the resulting SHA and CI run.
5. Continue with the next unchecked item. When a dependency is unavailable, pursue independent work and preserve the blocked item as unchecked.
