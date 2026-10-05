---
name: Resumed budget clocks
description: Clock-domain handling for owner-approved validation continuations after workspace resumption.
---

Workspace resumption can change the Linux boot ID and reset the monotonic origin.
Do not compare a historical deadline to the new clock or copy a prior grant's
boot binding into a newly approved allowance.

**Why:** A resumed workspace had a much smaller current monotonic reading than
an already expired historical deadline. Reusing it would make expired authority
appear live; blindly copying its boot would instead reject a legitimate new grant.

**How to apply:** Reserve an explicitly newly approved allowance before authoring,
bind its actual current boot/clock, and preserve the old boot, deadlines, consumed
attempts and failures as lineage. This never renews the old grant. Recheck exact
incident ownership, conflicts and acknowledged recovery independently.
