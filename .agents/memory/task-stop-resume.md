---
name: Active task stop is not resumable
description: Replit Agent task interruption and same-task continuation limits.
---

Replit's task documentation states that Stop interrupts an active task, preserves work completed before stopping, but does not allow resuming that same task; continuing requires starting a new task.

**Why:** An interrupted active review may retain its prior work but cannot continue under the same task identity, so Stop is not equivalent to a non-destructive pause when the same review must be preserved.

**How to apply:** Before stopping an active task whose identity/workspace must continue, require a separately supported hold-and-resume route that preserves the same task and workspace. Otherwise leave it untouched and report the owner/provider action needed.
