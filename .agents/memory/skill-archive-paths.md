---
name: Skill archive path collisions
description: Path normalization and duplicate handling for uploaded skill archives.
---

Uploaded archive paths must be safe relative paths. Treat paths that collide after NFC normalization and case folding as duplicates.

**Why:** Skill files may be processed on filesystems with different case and Unicode-normalization behavior, where visually or canonically equivalent names can shadow one another.

**How to apply:** Keep browser parsing and server-side upload validation aligned on the same path-safety and duplicate-detection rules.