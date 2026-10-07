---
name: Failure Gate evidence precedence
description: Direct source-query observations outrank stale documentary summaries without creating authority.
---

Treat actual source-query results as authoritative for the returned records and fields at their observation time. Descriptive capability locators, reports and plans are secondary snapshots; reconcile them with the query rather than discounting the query because a later report describes it.

**Why:** The user explicitly directed that present queries be considered authoritative sources. Earlier discovery documents retained no-access claims after a later read-only inspection, creating contradictory narratives.

**How to apply:** Distinguish initial discovery from subsequent query observations and preserve historical snapshots. A task query authenticates returned lifecycle metadata, not a project-local grant. A coordinator query authenticates inspected records, not unqueried remaining consumption, future validity or independent supervision. Evidence precedence does not authorize another read, create approval/budget, or turn a missing record into authority.

Merged results may be available in other local Git refs while the task checkout remains unsynced. A working-tree search alone is insufficient before reporting deliverables unavailable.

**Why:** The user corrected a checkout-only search that missed completed intake reports in unsynced Git history.

**How to apply:** Inspect available refs and read immutable commit/path objects directly before concluding a merged report is missing. No checkout or merge is needed for readback. Preserve each report's own snapshot boundary: missing-file or no-query findings from an older checkout do not describe the current checkout or erase another stage's real query observations. Do not silently synchronize, overwrite sources, or infer permission from merge status.
