---
name: vertactics-browser-verification
description: Verify Vertactics rendering and interactions in Playwright, capture actual 2D and 3D screenshots, and report CI and browser results against SPEC.md.
---

1. Build with `pnpm build` and run `pnpm test:e2e` against the preview server. Install the matching Playwright browser when needed.
2. Check visible WebGL terrain in both modes. Exercise pan, orbit, zoom and reset, select terrain from the canvas, then verify selection and its world height across modes.
3. Inspect actual renders for clipping, misaligned picking, step readability, panels and viewport responsiveness. Capture both modes and record the browser and viewport size.
4. Confirm CI results for the exact commit. Record missing dependencies, WebGL restrictions and other blockers separately from test assertion failures.
5. Check SPEC only for the behavior verified. Use the actual captures in the README when their source build still matches the documented interface.

[Korean guide](guide.ko.md)
