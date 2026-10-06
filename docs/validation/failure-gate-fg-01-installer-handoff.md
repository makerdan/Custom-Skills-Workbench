# FG-01-I installer handoff to the independent verifier

**Recipient:** existing Piece 01 verifier task `#69` (`FG-01-V — Verify Host Discovery`), not a new task.  
**Primary discovery-time lifecycle snapshot:** `#68 IN_PROGRESS`, `#69 PENDING` / parent-blocked. This was contextual task-board state only; no task API readback or lifecycle mutation occurred in the primary task. The verifier's later task API readback is recorded below.
**Project binding:** Skills Workbench; `/home/runner/workspace`; Git pre-write snapshot `799443de19aab77f78b2dafe827d4095f181a6e4`; Project UUID unavailable.  
**Verifier plan binding:** local tracked `docs/validation/failure-gate-task-plan-fg-01-v.md`, SHA-256 `9a2ce68cda1a6bcd448ae86936751b811376d59e4aa98b8fffb0f0df9965d85f`. Its text requires the persisted dependency to identify primary platform ref `#68` and binds primary-plan SHA-256 `51fc06aa165a36c0f881068fbcd4f078888b3b35e75c20a755b33545412ccd1f`; neither the persisted task payload nor its dependency was independently fetched in this delivery.

## Delivered bindings

The verifier must inspect these actual files in this same Project:

| Deliverable | Purpose |
| --- | --- |
| `docs/validation/failure-gate-fg-01-source-manifest.md` | SHA-256 inventory of canonical Failure Gate/Router closure and original host inputs; source/baseline gap reconciliation. |
| `docs/validation/failure-gate-fg-01-obligation-ledger.md` | Piece-specific acceptance allocation plus core/budget/staging/reclaim/Router case IDs, owner, dependency and shared applicability/evidence/pass/fail rules. |
| `docs/validation/failure-gate-fg-01-discovery.md` | Project/task binding, roles, present UNKNOWN assessment, prior outcomes, stage boundary and disclosed inspection deviation. |
| `docs/validation/failure-gate-fg-01-policy-caller-inventory.md` | Commands, callers, configuration, prior policy/approvals, stores, writers, locks, supervision, recovery and unknown coverage. |
| `docs/validation/failure-gate-fg-01-installation-proposal.md` | Source/runtime boundary, stage gates, exact blockers, owner/actions and future finite-authorization requirements. |
| `docs/validation/failure-gate-fg-01-installer-handoff.md` | This scoped binding and independent review checklist. |
| `docs/validation/failure-gate-fg-01-verifier-report.md` | Independent binding/readiness report, pre-edit gaps, corrections, and post-repair readback result for Task #69. |
| `docs/validation/failure-gate-capabilities.json` | Existing descriptive capability locator, to be reconciled in place for this Piece 01 discovery. |
| `docs/validation/failure-gate-evidence-index.md` | Existing locator/reconciliation record, not a second authority. |

The source manifest pins the tracked 18-piece series, attached Piece 01 supplement, both local task-plan files, project instructions/config, original policy/capability/evidence/map/approval/report/verification records, selected project command sources, every canonical file within the two authorized skill roots, and retained caller outcome/log digests. It records the canonical reference boundary and unavailable Port Authority dependency contract. Recompute source digests independently; do not treat a matching digest as approval or authentication.

### Delivered report/evidence content bindings

These SHA-256 values bind the delivered bytes after the documentary edits. The verifier should recompute them before accepting this handoff. The handoff identifies itself by the tracked path above; its own digest is not self-embedded.

| Delivered file | SHA-256 |
| --- | --- |
| `docs/validation/failure-gate-fg-01-source-manifest.md` | `ee15c7d94a02b74dfc53affe3d5d2d47d2629bd64cc9414d628b3051d81faa6e` |
| `docs/validation/failure-gate-fg-01-obligation-ledger.md` | `09adf8fa6adca892f10c3ca2a235917b50551ec797f616e9507329b869ec640c` |
| `docs/validation/failure-gate-fg-01-discovery.md` | `537bd8e57bc4d6bd34d1e76a01c72d9d0d904f0a715ed6cd9bcc793a74fc74c6` |
| `docs/validation/failure-gate-fg-01-policy-caller-inventory.md` | `eb931729ad054f1734ff1239ea799926483c0dd08b654ac39eac5452b4c3d52b` |
| `docs/validation/failure-gate-fg-01-installation-proposal.md` | `077484a94c92cb06fe489dcde3c81686bcd44455e4c0c6146e9ba3fd2231697d` |
| `docs/validation/failure-gate-capabilities.json` | `724eaff7c1022116a728e1b17a6a4ae8433db9b2867b578140a37b9cfc520014` |
| `docs/validation/failure-gate-evidence-index.md` | `77ec9902ffdcaa63820e77ba4963b92f1159b38880a49761f28e900924abf1c6` |
| `docs/validation/failure-gate-fg-01-verifier-report.md` | `9c3675e48d399071e338a5f803a3278cd87e405cc1a37bd529e71b4d173010d4` |

## Known gap list before verifier edits

1. **Historical Router source provenance unresolved.** The earlier claim that the old values were absent was inaccurate: the tracked 18-piece series records all three planning-time values, and the source manifest now reconciles them with current hashes. Read-only history did not provide the old file blobs, so their contents/provenance and the cause remain UNKNOWN/BLOCKED. Do not reconstruct them.
2. **Current live host state unresolved.** No current approved safe coordinator read was discovered. The ordinary state is last recorded STAGED, while normative ACTIVE/INACTIVE classification is UNKNOWN. Current store availability, reservations and remaining consumption were not queried.
3. **Project UUID remains unavailable.** The verifier's task API readback confirms the Skills Workbench task records, repository root, primary/verifier plan digests, and exact dependency. No separate immutable Project UUID is exposed. This is a readback of task records, not cryptographic identity or local authorization.
4. **Authority/supervision are not current.** Prior local conversation grants are bounded to historical operations; health bootstrap is consumed, the 300-second inventory grant exhausted/expired, and installer acceptance belongs to its recorded operation. No current runtime budget, independent supervisor, task approval event, active writer-coverage record or protected reclaim provider is established.
5. **One inspection-method deviation.** An inline read-only `node -e` expression required/parsed only root `package.json` script metadata, beyond the plan's strict no-import wording; no project module/script was invoked. Direct file read confirmed the metadata. This is not runtime validation and should remain disclosed.

These are explicit missing evidence/authority, not an assertion that every underlying platform capability does not exist. The verifier resolved the task-record binding within its permitted read-only scope; live host state and authorization remain unresolved.

## Independent verification instructions

Follow the full tracked verifier plan; do not rely on this handoff's summaries:

1. Before substantive review, confirm the actual Project/task-board context, root, task `#68`, verifier `#69`, exact persisted task plans/dependency, current allowed repair scope and source bindings. Stop dependent inspection if identity or payload differs. Do not open archived #66/#67.
2. Re-read the full 18-piece series, Piece 01 supplement, pinned canonical source closure and each original host source/record required for every inventory claim. Compare each source hash and preserve all baseline values; the recorded old Router values are in the series, but historical source-file provenance remains blocked unless original bytes are available.
3. Check each of the 18 piece-specific acceptance contracts and all ledger entries against the original canonical case text. Verify exact stable ID, applicability, owner, dependency, evidence route and pass/fail rule. Publish a pre-edit gap list before any allowed documentary correction.
4. Independently check command/caller scope, workflow/config distinction, policy state, approval and budget records, actual store-read permissions, completion writer, writer lock participants, supervisor/provider, recovery, coverage and optional catalog/history. A descriptive capability file is not authority; task refs are not local IDs; old grants cannot be reused.
5. Reconcile the six declared Piece 01 documents, this required verifier report, and the two existing descriptive locators. Preserve old values, source lineage and the failure outcome. Any correction requires retained before/after digest/evidence binding and remains documentary; do not edit canonical sources or live stores.
6. Obtain fresh independent post-repair readback in the authorized verifier context. If that independent route or any required source/evidence is unavailable, leave the affected acceptance BLOCKED; do not self-certify or claim PASS.

## Current handoff state

- **Contract installation:** not claimed.
- **Canonical source parity:** files are present and current digests are pinned; the series' three historical Router digest values are recorded, while historical file contents/provenance remain blocked.
- **Host implementation/readiness:** partial source exists; ordinary readiness not established.
- **Ordinary governance:** last captured status STAGED; current classification UNKNOWN.
- **Host acceptance/verification:** none performed in Task #68.
- **Ordinary activation/cutover:** not authorized and not performed.
- **Platform task lifecycle:** this verifier's task API readback confirms #68 MERGED and #69 IN_PROGRESS with exact dependency #68; the independent document reviewer had no API access to recheck it. These statuses do not prove local authority or complete verification.
- **Local Failure Gate ID for Piece 01:** none allocated. Historical `FG-00000001` is a separate prior bootstrap identity.
- **Runtime checks and remaining consumption:** no execution route discovered or used; current allowance/remaining consumption is unavailable.

### Verifier task API readback — 2026-10-06

This verifier's task API readback shows `#68 MERGED` and `#69 IN_PROGRESS`; persisted `#69.dependsOn` contains exactly `#68`. The primary description SHA-256 is `51fc06aa165a36c0f881068fbcd4f078888b3b35e75c20a755b33545412ccd1f`; the verifier description matches the tracked plan SHA-256 `9a2ce68cda1a6bcd448ae86936751b811376d59e4aa98b8fffb0f0df9965d85f`. The fresh independent document reviewer could not query the task API to recheck these values. This lifecycle readback does not establish local policy, authority, or runtime readiness.

No Piece 02–18 task has been created or surfaced. After #69 completes, preserve the series checkpoint. No automatic progression or cutover follows from this handoff.
