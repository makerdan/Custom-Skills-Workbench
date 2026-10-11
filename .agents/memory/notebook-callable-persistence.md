---
name: Notebook callable persistence
description: Distinguish preserved notebook data from callable helper availability during multi-call document authoring.
---

Do not assume a function saved in the tool-calling notebook remains callable merely because its associated data persists.

**Why:** A stored digest helper worked in its defining call, but later invocation repeatedly failed with `executeJs is not defined`. The same retained text/arrays and ordinary file/shell callbacks remained usable. This observation does not establish a general loss of notebook state or a missing project dependency.

**How to apply:** If a previously saved helper fails at that boundary, preserve successful readback/data and use an ordinary supported tool operation for the affected transformation. Do not restart services, install packages, or repeat an unrelated validation suite to diagnose a notebook-only failure.

The tool-calling sandbox also need not expose a complete Node `process` API, even inside an impure function.

**Why:** `process.cwd()` was unavailable while standard-library file reads and shell callbacks still worked. This is a sandbox boundary, not a project runtime failure.

**How to apply:** Obtain workspace context through a supported shell operation rather than assuming ordinary Node process metadata exists in the notebook.
