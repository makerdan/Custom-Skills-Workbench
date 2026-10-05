---
name: Node test report formats
description: Native reporter selection is runtime-dependent even in bounded piped subprocesses.
---

Do not assume that piping a Node test subprocess makes its output TAP.
This workspace's actual supervised root test emitted native text summaries
with `ℹ tests`, rather than TAP summary lines.

**Why:** The installed runtime's reporter behavior differs from the assumption
that non-interactive output necessarily uses TAP. A successful process can still
have an unsupported report format; raw zero alone does not establish coverage.

**How to apply:** Bind the reporter explicitly or use a strictly validated
adapter for the actual format and package prefixes. Verify the current runtime
and preserve failure/cancellation/coverage checks; do not infer a Node version
or future default from this observation.
