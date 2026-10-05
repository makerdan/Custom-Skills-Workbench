---
name: Node test bundle resolution
description: How package-local pnpm dependencies resolve for temporary ESM test bundles.
---

When a Node test runner bundles files with dependencies marked external, write the temporary `.mjs` entrypoint inside the package directory tree and remove it after execution.

**Why:** ESM resolves external package imports from the importing file's location, not the spawned process's working directory. A bundle under `/tmp` cannot find package-local `node_modules` symlinks even when the runner's `cwd` is the package.

**How to apply:** Keep temporary ESM test outputs beneath the package root when using pnpm dependencies; do not rely on the child process `cwd` to resolve imports.
