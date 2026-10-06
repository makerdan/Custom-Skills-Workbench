# Failure Gate evidence index

This is a locator, not a second authority. All locations are workspace-local.
No store is shared automatically with task-agent clones, CI, or deployments.
No protected host identity or tamper resistance is claimed.

## Registered locations

| Category | Location and bounded access | Availability / authority |
| --- | --- | --- |
| Policy and installation approval | `failure-gate-policy.json` and `failure-gate-installation-approval.json` in this directory | Tracked proposed mappings and actual captured owner approval. Policy setup and bootstrap are separate scopes; neither grants cutover. |
| Canonical specification | `.agents/skills/failure-gate-v4/` | Canonical source only. Run snapshots pin its included source files. Runtime mirrors are not used. |
| Allocator, namespace, permanent task IDs | `.failure-gate/coordinator.sqlite3`, SQLite schema 1 | One local authority after initialization. IDs are never deleted/reopened by the tool. A platform task number is not a local ID. |
| Plans, approvals and decisions | Same coordinator, `tasks` and `decisions` tables | Exact plan JSON and digests; local interactive human review, not identity-authenticated platform events. |
| Execution log | `.failure-gate/events/<event UUID>.json`, indexed by coordinator `events.seq` | Durable per-event JSON segments, file fsync and directory fsync before dispatch. File/transaction gaps block managed work. |
| First containment proof | `.failure-gate/first-proof.json` | Actual fixture result and original monotonic installation budget. Never used as ordinary-task evidence. |
| Later caller fixtures | `.failure-gate/caller-fixtures.json` | Isolated fixture status and tested tooling digest. Distinct from real caller acceptance. |
| Installer caller trail | `.failure-gate/installer-caller/{1,2}/events/`, `outcome.json` | Actual parent supervisor registration, launch, raw outcome and coverage. A failure is not an ordinary-route pass. |
| Actual scoped recovery approval | `failure-gate-recovery-approval.json` | Owner's real conversation response; local scope only, not host attestation or cutover. |
| Approved one-shot continuation | `.failure-gate/continuations/721fb9bc-fa10-446c-96d7-a10f8205b27e/`, coordinator continuation metadata/decisions/events | Corrective fixtures passed; exact original recovery acknowledged; first full caller FAILED; second NOT RUN. No automatic retry. |
| Actual format amendment / fixture result | `failure-gate-test-format-approval.json`, `.failure-gate/format-rechecks/b37664c6-e279-4104-a10f-9ea6aec200f7/fixtures.json`, coordinator format metadata/events | Actual 20-minute grant; amended suite FAILED 27/28; native parser cases passed; neither real caller launched and no rebind. |
| Actual completion-observation amendment | `failure-gate-completion-observation-approval.json`, `.failure-gate/completion-rechecks/3d658bf1-d839-4c0e-a8b4-0ab92d367d79/`, coordinator amendment metadata/events | Corrected suite PASSED 29/29; first real caller interrupted by watchdog error; new run retained, second NOT RUN. |
| Actual diagnostic-phase source and fixtures | `failure-gate-watchdog-evidence-approval.json`, `.failure-gate/watchdog-diagnostics/d7a4ad5b-b450-468d-b850-85565e4e3bc2/fixtures.json`, coordinator diagnostic metadata/events | Full suite FAILED 30/31 on parent BrokenPipeError; both new evidence/cleanup cases passed; no recovery/diagnostic/rebind; grant expired. |
| Approved pipe correction and completed diagnostic | `failure-gate-control-pipe-approval.json`, `.failure-gate/watchdog-diagnostics/d57bbc46-c42a-46ed-bf03-74dcb9cca9fb/`, coordinator control-pipe metadata/events and recovery decision | PASSED 33/33; exact incident recovery acknowledged; one non-tier pnpm test raw 0, 137/137; no retained run; ordinary STAGED. |
| Approved full installer acceptance | `failure-gate-installer-acceptance-approval.json`, `.failure-gate/installer-acceptance/4cb1465a-627c-4e91-8d35-5eae96ddc7f8/`, coordinator acceptance decision/events and runs | Two complete callers PASSED consecutively; each typecheck, 137 package tests, 33 gate cases; no retained run; ordinary STAGED. |
| Approved read-only integration inventory | `failure-gate-host-integration-inventory-approval.json`, `failure-gate-host-integration-map.md` | Source/coordinator observations and draft saved; budget exhausted at closeout, completion timing unverified; no ordinary reviews/runs or writer proof; no execution/state mutation. |
| Raw step results and tested inputs | `.failure-gate/runs/<run UUID>/<step>/raw.log`, coordinator `runs.payload` | Bounded combined output, raw exits, parser results, digests, snapshot/environment, effective limits and missing steps. |
| Baseline catalog / earlier corroboration | No approved catalog or comparison capability | `never_collected`; no ignore authority. Failure observations remain unresolved rather than being called pre-existing. |
| Repair ownership | Coordinator `repairs` | Persistent obligations; later passes cannot waive them. No unapproved repair-removal endpoint. |
| Closure decisions | Coordinator `tasks.mode` and `decisions` | `validated` and `owner_direction` stay distinct. Administrative closure retains missing checks and repairs. |
| Backups | `Store.checkpoint(new_destination)` | Isolated tests use actual SQLite checkpoints. No live scheduled backup or proven resumable live restore is claimed. |
| Restore | `Store.restore_fenced(checkpoint, absent_isolated_directory)` | Restored allocation stays fenced, active grants suspended, ordinary route STAGED. Missing post-checkpoint IDs cannot be silently reused. |
| Reclaim attestations and disruption approvals | No available protected provider | `unavailable`, live reclaim BLOCKED; no cleanup signals to unrelated processes. |
| Independent callers / remote CI | Not monitored by this local route | `unknown` coverage. Existing invocation strings and workflows are unchanged. |

## Non-terminal plan-approval source discovery

| Evidence stage | Result |
| --- | --- |
| Source discovery | **BLOCKED:** no trusted plan-approval event/reference or exact approved-plan snapshot with local task/namespace mapping was exposed in the workspace. The official documentation search returned no relevant interface; the workspace has no configured integrations. |
| Adapter implementation | **NOT IMPLEMENTED:** no verified source exists here to adapt. The interactive terminal review path remains unchanged. |
| Rejection fixtures | Added in `scripts/failure_gate/tests.py` for stale content, wrong-task replay, tier/policy mismatch, unregistered decision kind, and status/lifecycle-only inputs. **NOT RUN**; isolated fixtures would not establish a working host source. |
| Operational verification | **BLOCKED / NOT RUN:** no actual approval event or approved plan was available; no current finite approved route for the changed gate source was verified. No approval evidence was generated and no task was activated. |

The task assignment and its plan text are not approval evidence. Platform-wide
availability remains unknown; this record states only that no reviewable source
was exposed or verified in this workspace.

## Inspection

### Installation-only coordination bootstrap

See `failure-gate-bootstrap-handoff.md` and the fixed
`failure-gate-bootstrap-plan.json`. The final owner decision and outcome report
are `failure-gate-bootstrap-approval.json` and `failure-gate-bootstrap-report.md`.
Both complete isolated suites passed 46/46; the two real read-only coordinator
health callers passed consecutively. This health-only bootstrap is
**NON_RECLAIM_VERIFIED** under one consumed fresh allowance.
No historical allowance is reusable.
The final static review binding is `failure-gate-bootstrap-review.json`.
Private outcomes reside under
`.failure-gate/bootstrap/<decision UUID>/<caller>/`, indexed by
`meta.bounded-bootstrap-v1`, existing run rows and file-journal events.
No ordinary activation, API-lock acceptance, writer-coverage upgrade or reclaim
authority follows. Readback must report actual consumed reservations and
retained exclusion, not infer success from source placement.

The inner CLI is `scripts/failure_gate/cli.py`. `health` and `events` use
read-only SQLite connections and bounded regular-file inputs. `events` returns
at most 200 events; original segments and sequence numbers locate older history.
These finite entry points still require an actually authorized independent
supervision envelope. Bare invocation is not blanket diagnostic permission.
Do not initialize a missing store just to investigate.

For overlap questions, automatically consult this index, the coordinator's
event index and relevant file segments. Compare actual confirmed starts and
finishes; do not equate queued intents with launches or infer origin from names.
Unobserved independent callers and incomplete intervals remain unknown.

`export --task <real-local-ID> --output docs/validation/<new-file>.json` creates
only a scoped non-authorizing report under an admitted finite envelope. It does
not transfer data externally, import a store, grant a tier, or certify another
environment. Raw logs remain protected references; bundles are not self-contained.

## Retention, backup and recovery

- No automatic deletion, rotation, renewal, or pruning. Permanent allocation
  records and supporting decisions remain. At 10,000 file events, new managed
  dispatch needs a scoped retention review instead of deleting evidence.
- A file projection written before a failed database transaction remains an
  explicit gap. It is not erased or replayed as a new approval.
- A run's `recovery_required=1` is retained on supervision/evidence uncertainty.
  Age, parent exit, missing sidecars, or a quiescent observed child cannot clear it.
- Recovery requires a separately approved exact incident/operation binding and
  durable acknowledgement; no general live recovery endpoint is enabled.
- The intended backup cadence is one checkpoint after each accepted local task.
  There is no automatically scheduled job. Live restore/resumption additionally
  requires fencing old allocators, reconciling post-checkpoint IDs, current
  approvals and exact retained incidents.
- Role: the owner approves changes/recovery; the implementing agent executes only
  admitted operations. No invented external service or named approver is implied.

See `failure-gate-implementation.md` for capability status and readiness gaps.

## FG-01-I Piece 01 reconciliation — 2026-10-06

This section adds Piece 01 discovery locators to this existing index. It does not
create a registry, authority source, task ID, new store or runtime read procedure.
Original entries above are preserved as prior captured statements; their status
does not become a fresh live observation merely because this index is updated.

| Category | Location and bounded access | Availability / authority |
| --- | --- | --- |
| Piece 01 canonical source manifest | `failure-gate-fg-01-source-manifest.md`; direct read/hash of tracked canonical sources under `.agents/skills/failure-gate-v4/` and `.agents/skills/skill-application-router/` only | **Present and pinned** at pre-write Git snapshot `799443de19aab77f78b2dafe827d4095f181a6e4`. Digests establish byte identity only, not approval/authentication. |
| Piece 01 obligation allocation | `failure-gate-fg-01-obligation-ledger.md`; direct tracked-document read | **Present; documentary mapping only.** All 18 piece-specific acceptance contracts, core, budget, staging, reclaim, Router handoff and verification-plan cases are mapped. Later runtime cases remain NOT RUN/BLOCKED unless their own evidence exists. |
| Piece 01 discovery report | `failure-gate-fg-01-discovery.md`; direct tracked-document read | **Present.** Project/task context, source/runtime stages, owner roles, historical observations, UNKNOWN assessment and disclosed read-only inspection deviation are recorded. No host acceptance is claimed. |
| Piece 01 host/caller inventory | `failure-gate-fg-01-policy-caller-inventory.md`; direct read of tracked source, policy, plan and approval records; hashes in the source manifest | **Present as historical/original-source inventory.** Current coordinator, remaining grants, live writers, external callers and deployment state remain unqueried or unknown where stated. |
| Piece 01 installation-scope proposal | `failure-gate-fg-01-installation-proposal.md`; direct tracked-document read | **Present; proposal only.** No runtime permission, task-card creation, activation, cutover or grant is issued. |
| Piece 01 installer handoff | `failure-gate-fg-01-installer-handoff.md`; direct tracked-document read | **Present; addressed to existing verifier task `#69`, which is pending/parent-blocked in the supplied task context.** Not a verification pass. |
| Platform Project/task binding | Current supplied task context; tracked plans `failure-gate-task-plan-fg-01-i.md` and `failure-gate-task-plan-fg-01-v.md` | **Snapshot only:** Skills Workbench, root `/home/runner/workspace`, `#68 IN_PROGRESS`, `#69 PENDING`/parent-blocked. No immutable Project UUID or platform task API readback. Task refs are not Failure Gate IDs or approvals. |
| Original planning-time Router digests | `failure-gate-fg-01-source-manifest.md`, baseline reconciliation section | Three current values are pinned, but the distinct old values implied by the task plan are **UNAVAILABLE / BLOCKED** in the tracked planning records inspected. Do not manufacture values or cause. |
| Current coordinator/policy status | Registered location remains `.failure-gate/coordinator.sqlite3`; no current safe read route was established for this task | **Not opened/read.** Current ACTIVE/INACTIVE is **UNKNOWN**. Last recorded ordinary status is STAGED; current availability, live grants, retained runs and remaining consumption are not asserted. Do not initialize a missing store. |
| Retained original installer outcomes | Original `.failure-gate/installer-caller/1/outcome.json` and two `.failure-gate/installer-acceptance/.../caller-{1,2}/outcome.json` paths; digests in source manifest | Bounded direct outcome files were read; raw logs were hashed but not semantically parsed in this discovery. Original result is `pass:false`, raw exit 4; later separately approved outcomes are `pass:true`, raw exit 0. Preserve the failure; the later operation does not prove ordinary route readiness. Cooperative records are not protected attestations. |
| Current execution budget/supervision | No current approval/read route was exposed. Historical values and their original records are listed in the Piece 01 inventory. | **Unavailable for new execution.** Prior bootstrap one-shot was consumed; other allowances were operation-scoped and/or expired. Current remaining consumption is unknown; no check/command was run. |
| External/remote caller and catalog history | Root package/config and existing host integration map; no remote workflow query | **Unknown/unobserved.** No approved baseline catalog; no remote CI proof or caller-wide coverage claim. |

### Reconciliation notes

- The capability manifest retains its existing ordinary-state/source fields and
  adds a clearly documentary Piece 01 entry. It is still marked
  `not_a_live_registry`; the current policy classification there is UNKNOWN,
  while `ordinary_state: STAGED` records only the last captured status.
- A prior `independent_verifier` locator described an earlier direct Build
  review. The new entry records the supplied current `#69` snapshot without
  representing it as a persisted/API-verified task or accepted verifier result.
- The historical bootstrap ID `FG-00000001` belongs to the prior bounded
  health-only bootstrap. No local ID was allocated for Piece 01.
- Filesystem reads and hashes are limited to the listed source/report records.
  This section does not authorize SQLite access, CLI, tests, builds, workflows,
  remote checks, signals, recovery, or any other runtime operation.
