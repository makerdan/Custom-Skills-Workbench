---
name: Public gallery privacy boundary
description: Privacy rules for anonymous skill discovery and publication changes.
---

Keep anonymous skill discovery responses as explicit allowlisted projections of metadata owners chose to publish. Do not add skill or account identifiers, owner email, version details, uploaded archive contents, file paths, object references, or private question history. Filter out unpublished skills on every listing query, so unpublishing takes effect immediately.

**Why:** Public discovery is permission to share selected metadata, not permission to expose private workspace records or uploaded skill contents.

**How to apply:** Ownership-check publication updates, avoid caching public listings across publication changes, and keep regression tests asserting the exact response keys and absence of private data.