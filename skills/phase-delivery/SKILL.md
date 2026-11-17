---
name: vertactics-phase-delivery
description: Advance Vertactics phases using PROMPT.md and SPEC.md, update verified checklist items, and deliver logical commits in focused pull requests.
---

1. Read the current phase in `PROMPT.md` and its corresponding IDs in `SPEC.md`. Inspect the working tree and start a topic branch from the current remote `main`.
2. Choose the smallest coherent change that advances the phase. Keep user edits intact and validate the normal application entry point when available.
3. Check items supported by source inspection, automated checks, or browser evidence according to each item's wording. Record command, result and remaining blocker in `SPEC.md`.
4. Review the exact files and whitespace before committing. Use a descriptive commit message. Push the topic branch with a fast-forward. Open a PR with the SPEC IDs, checks, evidence, and open items. Verify its head SHA and CI run, and leave the PR open for review unless the user authorizes merging it.
5. Continue with the next unchecked item. When a dependency is unavailable, pursue independent work and preserve the blocked item as unchecked.
