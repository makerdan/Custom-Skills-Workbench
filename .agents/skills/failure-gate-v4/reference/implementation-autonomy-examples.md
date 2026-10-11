# Optional implementation examples

Illustrations only. Read this file when examples help explain the boundary; it
is not a checklist, mandatory architecture, approval form or acceptance matrix.
Do not document or independently approve each example used. The normative
rule is in [implementation-autonomy.md](implementation-autonomy.md).

| Work family | Agent-selected implementation details | Preserve or escalate |
|---|---|---|
| Discovery and obligation records | Inventory/ledger organization, traceability format, documentation layout | Actual capability evidence, immutable obligations, original history |
| Admission adapters and schemas | Module structure, validation helpers, errors, equivalent encoding, authored rejection cases | Authentic approval source, exact subjects/bindings, operation and budget authority |
| Coordinator and storage implementation | Internal schema/IDs, indexes, transactions, idempotency helpers | Approved persistence/concurrency/public contract; no live initialization or migration without scope |
| Supervision and checked execution | Adapter decomposition, event plumbing, parsing, bounded stream capture | Independent supervision, transitive scope, finite limits, ownership and verified termination |
| Configuration and snapshots | Existing loader reuse, redaction helpers, deterministic encoding/comparison | Relevant inputs, secret protection, real config/port provenance and approved destinations |
| Telemetry and inspection/export | Bounded queries, pagination, parsers and presentation | Authoritative records, required events, privacy, retention/deletion and export authority |
| Diagnostics and classification | Fixture/test authoring, signature comparison, classification implementation | Launch/retry budgets, provenance, ownership, exact ignore authority and raw failures |
| Completion and closure | State/readers, transaction structure, accurate messages | Original completion criteria, writer exclusion and distinct owner-directed closure |
| Backup and restore | Approved-format checkpoint helpers, isolated test-case authoring | Actual restore/migration/access/retention permission; no release of retained exclusion |
| Independent verification/repair | Equivalent verification methods and already-authorized scoped defect fixes | Fixed requirements, permitted method-resolution route, actual evidence and independent post-repair acceptance |

Internal schema or serialization choices are routine only when the scope permits
them and external/persisted compatibility and invariants are preserved. A new
package, service, store, secret source or external system is not implicitly
approved merely because it would simplify implementation.
