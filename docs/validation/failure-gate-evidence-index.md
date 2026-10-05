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
| Raw step results and tested inputs | `.failure-gate/runs/<run UUID>/<step>/raw.log`, coordinator `runs.payload` | Bounded combined output, raw exits, parser results, digests, snapshot/environment, effective limits and missing steps. |
| Baseline catalog / earlier corroboration | No approved catalog or comparison capability | `never_collected`; no ignore authority. Failure observations remain unresolved rather than being called pre-existing. |
| Repair ownership | Coordinator `repairs` | Persistent obligations; later passes cannot waive them. No unapproved repair-removal endpoint. |
| Closure decisions | Coordinator `tasks.mode` and `decisions` | `validated` and `owner_direction` stay distinct. Administrative closure retains missing checks and repairs. |
| Backups | `Store.checkpoint(new_destination)` | Isolated tests use actual SQLite checkpoints. No live scheduled backup or proven resumable live restore is claimed. |
| Restore | `Store.restore_fenced(checkpoint, absent_isolated_directory)` | Restored allocation stays fenced, active grants suspended, ordinary route STAGED. Missing post-checkpoint IDs cannot be silently reused. |
| Reclaim attestations and disruption approvals | No available protected provider | `unavailable`, live reclaim BLOCKED; no cleanup signals to unrelated processes. |
| Independent callers / remote CI | Not monitored by this local route | `unknown` coverage. Existing invocation strings and workflows are unchanged. |

## Inspection

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
