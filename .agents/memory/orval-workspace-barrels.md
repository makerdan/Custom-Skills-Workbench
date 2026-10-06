---
name: Orval workspace barrels
description: Orval may update its workspace index barrel in addition to writing generated target files.
---

Stage `output.workspace` together with generated targets whenever Orval must not write accepted source directly. Promotion must include the generated trees and the staged workspace barrel under the same writer lock.

**Why:** redirecting only `output.target` still lets Orval reconcile `output.workspace/index.ts` with paths to temporary output.

**How to apply:** keep the complete Orval workspace in an ignored staging area outside TypeScript source discovery, and promote every accepted result atomically while holding the shared writer lock.
