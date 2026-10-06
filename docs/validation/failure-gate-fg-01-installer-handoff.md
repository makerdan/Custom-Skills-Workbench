# FG-01-I installer handoff to the independent verifier

**Recipient:** existing Piece 01 verifier task `#69` (`FG-01-V — Verify Host Discovery`), not a new task.  
**Primary discovery-time lifecycle snapshot:** `#68 IN_PROGRESS`, `#69 PENDING` / parent-blocked. This was contextual task-board state only; no task API readback or lifecycle mutation occurred in the primary task. The verifier's later task API readback is recorded below.
**Project binding:** Skills Workbench; `/home/runner/workspace`; Git pre-write snapshot `799443de19aab77f78b2dafe827d4095f181a6e4`; Project UUID unavailable.  
**Verifier plan binding:** local tracked `docs/validation/failure-gate-task-plan-fg-01-v.md`, SHA-256 `9a2ce68cda1a6bcd448ae86936751b811376d59e4aa98b8fffb0f0df9965d85f`. It binds primary #68 plan SHA-256 `51fc06aa165a36c0f881068fbcd4f078888b3b35e75c20a755b33545412ccd1f`. Original primary delivery did not independently fetch the task payload/dependency. Merged #70 and this reconciliation did: both complete descriptions match those unchanged tracked plans; #69 depends exactly on #68; both are MERGED. Task binding alone does not decide discovery acceptance.

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

The source manifest pins the tracked series/supplement, both task plans, original host/config/approval/report sources, all canonical files in the two permitted roots and retained outcome/log bindings. Its original input table is historical, not a current hash table for repaired documents. #75 subsequently pinned local Port Authority comparison sources in the existing host map; authentic current host evidence remains unavailable. Recompute current canonical and delivered-file hashes independently; a match is not approval/authentication.

### Delivered report/evidence content bindings

These SHA-256 values bind the delivered bytes after the documentary edits. The verifier should recompute them before accepting this handoff. The handoff identifies itself by the tracked path above; its own digest is not self-embedded.

| Delivered file | SHA-256 |
| --- | --- |
| `docs/validation/failure-gate-fg-01-source-manifest.md` | `40034926aa094bef673a67623146783d52f682b63a54b7ef58312a5d875c885b` |
| `docs/validation/failure-gate-fg-01-obligation-ledger.md` | `9f4801eaba872423abb9cd565e3de59c30950d514f1589a8643c037847e0ce77` |
| `docs/validation/failure-gate-fg-01-discovery.md` | `d28f80e8f29dbfc4c95f709c1c4bd3b7d9a9e26d94de9346ff22f01b93a13ad6` |
| `docs/validation/failure-gate-fg-01-policy-caller-inventory.md` | `1ec5b93498a88800ebfd71f8d5e45774043e2bde790525017647c0ce0f45d105` |
| `docs/validation/failure-gate-fg-01-installation-proposal.md` | `b65eff0981d86a1bde892aa7ccdebcf13a404d62dd5aff9b4e22f1c910f0427a` |
| `docs/validation/failure-gate-capabilities.json` | `b83f0f0f39344f09dcc2aed96b05ed8218ff24bf4cacae24d119025a57971c9e` |
| `docs/validation/failure-gate-evidence-index.md` | `e2e01f32df305834388f231c22a570162663ee0610ef365997a7699b9a06b2d4` |
| `docs/validation/failure-gate-fg-01-verifier-report.md` | `6be495b2168d499633bdfb6dbac019762e93e80aa7ceb71c3a0746643589ec30` |
| `docs/validation/failure-gate-host-integration-map.md` | `7d1e3009caa569cf01e018f29436cea32ddefe995ed62bf69c6ce570bc8e6acb` |
| `docs/validation/failure-gate-v4-series-checkpoint.md` | `8afa805bbd91c5f9ee94fc7ad6289a27b6aac2511a934d988ca13bb9177b5b3c` |

## Known gap list before verifier edits

1. **Historical Router source provenance unresolved.** The original attached 18-piece series and source manifest record all three planning-time digest values alongside current hashes; the current tracked series marks the old entries removed/unavailable. Read-only history did not provide original Router file bytes, so their contents/provenance and cause remain UNKNOWN/BLOCKED. Do not reconstruct them.
2. **Current live host state unresolved.** No current approved safe coordinator read was discovered. The ordinary state is last recorded STAGED, while normative ACTIVE/INACTIVE classification is UNKNOWN. Current store availability, reservations and remaining consumption were not queried.
3. **Project UUID remains unavailable.** The verifier's task API readback confirms the Skills Workbench task records, repository root, primary/verifier plan digests, and exact dependency. No separate immutable Project UUID is exposed. This is a readback of task records, not cryptographic identity or local authorization.
4. **Authority/supervision are not current.** Prior local conversation grants are bounded to historical operations; health bootstrap is consumed, the 300-second inventory grant exhausted/expired, and installer acceptance belongs to its recorded operation. No current runtime budget, independent supervisor, task approval event, active writer-coverage record or protected reclaim provider is established.
5. **One inspection-method deviation.** An inline read-only `node -e` expression required/parsed only root `package.json` script metadata, beyond the plan's strict no-import wording; no project module/script was invoked. Direct file read confirmed the metadata. This is not runtime validation and should remain disclosed.

These are explicit missing evidence/authority, not an assertion that every underlying platform capability does not exist. The verifier resolved the task-record binding within its permitted read-only scope; live host state and authorization remain unresolved.

## Independent verification instructions

Follow the full tracked verifier plan; do not rely on this handoff's summaries:

1. Before substantive review, confirm the actual Project/task-board context, root, task `#68`, verifier `#69`, exact persisted task plans/dependency, current allowed repair scope and source bindings. Stop dependent inspection if identity or payload differs. Do not open archived #66/#67.
2. Re-read the full original attached 18-piece series, current tracked series, Piece 01 supplement, pinned canonical source closure and each original host source/record required for every inventory claim. Compare each source hash and preserve both the recorded historical digest values and current canonical hashes; historical Router file bytes/provenance remain blocked unless authentic originals are available.
3. Check each of the 18 piece-specific acceptance contracts and all ledger entries against the original canonical case text. Verify exact stable ID, applicability, owner, dependency, evidence route and pass/fail rule. Publish a pre-edit gap list before any allowed documentary correction.
4. Independently check command/caller scope, workflow/config distinction, policy state, approval and budget records, actual store-read permissions, completion writer, writer lock participants, supervisor/provider, recovery, coverage and optional catalog/history. A descriptive capability file is not authority; task refs are not local IDs; old grants cannot be reused.
5. Reconcile the six declared Piece 01 documents, this required verifier report, and the two existing descriptive locators. Preserve old values, source lineage and the failure outcome. Any correction requires retained before/after digest/evidence binding and remains documentary; do not edit canonical sources or live stores.
6. Obtain fresh independent post-repair readback in the authorized verifier context. If that independent route or any required source/evidence is unavailable, leave the affected acceptance BLOCKED; do not self-certify or claim PASS.

## Current handoff state

- **Contract installation:** not claimed.
- **Canonical source parity:** files are present and current digests are pinned; the original attached series and source manifest retain the historical Router digest values, while the current tracked series marks those entries removed/unavailable. Historical file contents/provenance remain blocked.
- **Host implementation/readiness:** partial source exists; ordinary readiness not established.
- **Ordinary governance:** last captured status STAGED; current classification UNKNOWN.
- **Host acceptance/verification:** none performed in Task #68.
- **Ordinary activation/cutover:** not authorized and not performed.
- **Platform task lifecycle:** #68/#69 MERGED, exact dependency #68, complete unchanged descriptions/plans independently corroborated by #70 and reconfirmed in the acceptance reconciliation. Original IN_PROGRESS/reviewer-access observations below remain historical. No status proves local authority or complete verification.
- **Local Failure Gate ID for Piece 01:** none allocated. Historical `FG-00000001` is a separate prior bootstrap identity.
- **Runtime checks and remaining consumption:** no execution route discovered or used; current allowance/remaining consumption is unavailable.

### Verifier task API readback — 2026-10-06

At the original verifier task API readback, `#68` was `MERGED` and `#69` was `IN_PROGRESS`; persisted `#69.dependsOn` contained exactly `#68`. The primary description SHA-256 was `51fc06aa165a36c0f881068fbcd4f078888b3b35e75c20a755b33545412ccd1f`; the verifier description matched the tracked plan SHA-256 `9a2ce68cda1a6bcd448ae86936751b811376d59e4aa98b8fffb0f0df9965d85f`. The independent document reviewer at that time could not query the task API. This historical lifecycle readback does not establish local policy, authority, or runtime readiness.

### Independent task API follow-up — 2026-10-06

A separate read-only API lookup subsequently retrieved the full current records for `#68` and `#69`. Both are now `MERGED`; `#69.dependsOn` contains exactly `#68`; both full stored descriptions match their pinned task plans byte-for-byte and retain the same SHA-256 values above. The verifier report records all returned task fields and the individual comparisons. This confirms task-record bindings only; it does not expose an immutable Project UUID or establish local authorization.

As of the original handoff, no Piece 02–18 task had been created or surfaced. The later task lifecycle is recorded in the independent follow-up above. Preserve the series checkpoint; no automatic progression or cutover follows from this handoff.

### Acceptance reconciliation

The report's requirement-to-evidence matrix separates original stage discovery from later runtime capabilities. Fresh independent post-repair readback **ACCEPTS planning/discovery only**: the full unchanged #68 criterion 3 is satisfied by factual recorded/current reconciliation and documented unavailable historical provenance, not by inventing a cause or reconstructing bytes. No plan amendment or runtime proof is supplied here. The checkpoint follows that decision; the obsolete first-party-only G0 limitation no longer applies. Current delivery bindings above identify the repaired delivered bytes; old values remain in the report's pre-reconciliation snapshot and repository history. Later pair preparation still requires the explicit user request **Prepare the next Failure Gate pair.**

### Post-sync source and acceptance status

The ten-file table above was independently read back against the post-sync files. The final report records reviewer `post-sync-piece01-review` and ACCEPTS Piece 01 for planning/discovery only. The post-sync matrix binds the original attached series by SHA-256, preserves exact historical digest strings without claiming old Router file bytes, and separates source-level lock wrappers from runtime proof. Runtime/fixture checks remain NOT_RUN and the explicit later-pair request condition is unchanged.
