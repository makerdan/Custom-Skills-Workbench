---
name: Tracked task plan intake
description: Task API constraints when durable plans cannot be written under ignored local directories.
---

The file-based bulk task creator requires plans under `.local/tasks/`, even though its documented parameter examples do not make that enforcement obvious. It rejects tracked documentation paths.

**Why:** This conflicts with the workspace's durable-deliverable constraint. Do not copy deliverable plans into the ignored directory to satisfy the API.

**How to apply:** Keep full plans in tracked project documentation. When explicitly authorized to create tasks and the inline follow-up route is applicable, it accepts descriptions only up to 4,000 characters. Create concise scoped descriptions referencing the tracked full plans, then use the task update route's inline description to persist the full plans. A task update returns summary metadata, not necessarily its description; verify content through task readback.

Inline follow-ups initially depend on their origin task. If the user requested prerequisites for that task, remove the inherited dependency before acceptance; otherwise the task graph blocks prerequisite work behind the work it must enable.

**Why:** Origin association is not the same as a correct execution dependency.

**How to apply:** Explicitly set prerequisite dependency lists using the supported task update route and read back the resulting graph. Task creation and graph changes never supply project-local execution authority.
