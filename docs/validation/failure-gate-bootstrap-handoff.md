# Bounded coordination bootstrap — health-only acceptance complete

## Scope and current evidence

This installation-only entry is not ordinary admission. Local namespace
`d63a3d51-4dea-4a99-9e6a-d01410b7e017`, installation ID `FG-00000001`,
policy `local-v1.1`. Read-only coordinator discovery found STAGED governance,
106 original journal events, a draft installation task, no retained runs and
no live writer-coverage record. Those observations are not runtime permission.

Source is staged in `scripts/failure-gate-bootstrap.py` and
`scripts/failure_gate/bootstrap.py`; isolated cases extend the existing
`scripts/failure_gate/tests.py`. No canonical skill source, ordinary CLI,
package script, workflow, generated output, API configuration, dependency,
database/schema, merge/setup hook or service was changed.

**Isolated tests: PASSED twice, 46/46 each. Real health callers: PASSED twice
consecutively. Named health-only bootstrap: NON_RECLAIM_VERIFIED.**
The actual final owner approval is captured in
`failure-gate-bootstrap-approval.json`. It authorized only this pinned source
and the finite fixed proof; historical grants were not reused.
See `failure-gate-bootstrap-report.md` for raw references and acknowledged
outcomes. Ordinary governance stays STAGED, writer coverage remains unset and
API codegen is denied. No root check or application health request ran.

## Fixed interface and decision source

- `python3 -B scripts/failure-gate-bootstrap.py review`: real interactive
  terminal review of the exact local binding, with typed digest phrase.
  Pipes/flags cannot emulate review. Review reserves a single 900-second
  allowance; waiting does not refresh it.
- `python3 -B scripts/failure-gate-bootstrap.py prove`: fixed initial fixture,
  second fixture, health-1 and health-2 only, in that order. No selector,
  command, tier, retry or caller-supplied approval flag is accepted.
- `--private-health` is an internal supervised worker, not public admission.
  FIFO/deadline alone is insufficient: durable registration must identify this
  exact worker and live parent watchdog incarnation.

An actual final owner response may instead be captured at the fixed
`failure-gate-bootstrap-approval.json` path, with the real question/action
reference and the full exact reviewed binding. The delivered record captures
the actual response, not a prospective approval. The installed policy permits local captured conversation
approval for installation. This is a cooperative review route, **not**
cryptographic identity, protected platform approval or a general ordinary-plan
adapter. No runtime authority may be manufactured from task status or this file's
name. The real decision must be checked by the implementing agent against the
actual response before capture; hashes preserve contents, not human provenance.

`failure-gate-bootstrap-review.json` is the final static source/plan/execution
binding presented for approval. It is not itself an approval. It pins the full
manifest, exact Python executable, project root, plan/policy digests and graph.
Manifest/output/approval files are excluded to avoid circular hashes; governing
sources, the plan, policy and canonical sources are included.

The first entry reads this pinned data without importing the new governing
module. It reuses unchanged `common`/`Store` and the independently verified,
unchanged canonical `authoring_supervision.py` for the initial suite. Only after
complete successful initial fixture containment/capture may it import the new
governing module for acknowledgement and remaining callers. This avoids relying
on the new entry to establish its own initial safety.

## Accounting, conflicts and evidence

The fresh decision pins boot, monotonic start/deadline and exact operation.
Decision and first reservation commit together in the existing coordinator and
file journal before the first fixture. Later reservations use the same
`runs.recovery_required` single-flight index and stable installation ID; any
retained cooperating run blocks admission. Private execution does not allocate
an ordinary ID, tier assignment or activation.

Each started attempt is permanently consumed. The fixed sequence is:

| Caller | Proof type | Maximum |
| --- | --- | --- |
| fixtures-1 | Initial independently contained full isolated suite | 120s execution, 0.2s grace, 2s verification, 1s capture |
| fixtures-2 | Same complete isolated suite | Same limits |
| health-1 | Real read-only coordinator `Gate.health` | 30s execution, 30s queue, 15s startup/stall, 2s registration, 20s cleanup, 10s capture |
| health-2 | Same real read-only caller, consecutively | Same limits |

All share 900 seconds on one current boot, aggregate output cap 1 MiB per
caller, existing structured-error cap 8 KiB and Node test/hook ceilings
30/15 seconds. The health execution deadline is narrowed to 29 seconds and
cannot exceed the original parent minus cleanup/capture. Full worst-case phase
allowance is checked before dispatch. Actual supervision uses
`supervisor.run`/`watchdog.py`; no application process is signaled.

Private evidence: `.failure-gate/bootstrap/<decision UUID>/<caller>/`.
Fixtures retain complete bounded stdout/stderr and raw outcome in
`outcome.json`. Health retains `supervision.json`, `raw.log`, outcome and
registered lifecycle events in the existing coordinator/file journal.
`meta.bounded-bootstrap-v1` indexes the decision, original clock, consumed
attempts, registrations and evidence digests; it is not a new authority store.
Previous outcomes and their run rows/digests are checked before each next caller.
Decision contents/digest and source closure are rechecked; stale clocks,
changed source, invented caller names and replay cannot authorize dispatch.

Health reads only. Before/after hashes protect task rows, repairs and all
non-bootstrap meta (including installed policy/task bindings and writer state).
Only approved bootstrap decision, run/reservation and journal/evidence records
may change. A reserved health run appearing in its own report is expected;
it is wrapper accounting, not health initializing or activating a task.

Healthy acknowledgement requires typed affirmative registration, stop, complete
capture and release evidence, raw exit zero, on-time finish, intact source and
unchanged protected state. Two health results accept only this named scope.
Deliberately injected isolated failures remain fixture data, not failed live
acceptance or authorizations.

Any error, gap, output overflow, expired parent, failed initial suite, missing
registration, owner stall/death, watchdog loss, or uncertain stop/capture halts
the sequence. The reservation remains consumed and uncertain exclusion remains
retained. No restart, remaining slot, process exit, changed label or age-based
cleanup grants a replacement. Exact recovery needs separately approved incident,
run/lease/process incarnations, current root/boot, conflicts, finite supervision
and durable acknowledgement. Preserve raw failures after recovery.

Linux `/proc`/subreaper supervision is cooperative, not hostile-code, cgroup,
kernel-stall, remote-job or cross-workspace containment. No such claim is made.
Independent callers and the interactive ordinary plan-review route are unchanged.

## API generated-output integration handoff

API codegen/build/test remains denied by this entry. A future separately
owner-directed generated-output coordination integration must:

1. Pin its final exact command graph: root/package aliases and pre/post hooks,
   Orval config, all generated-output writers, builders/test readers, nested
   callers and environment/configuration requirements. No speculative command
   manifest or passing health result covers this graph.
2. Publish caller-to-resource coverage with a stable canonical lock inode/path,
   same resource identity for every conflict or verified common lock order,
   acquisition/queue/reentry/lifetime and uncertain-release rules. Review actual
   `lib/api-spec/package.json`, `orval.config.ts`, API build/test drivers and root
   scripts without changing their coverage under this grant.
3. Obtain a **fresh installation decision** for the changed final source,
   plan/execution/policy and resource contract, exact local identity, permitted
   effects, finite per-phase and cumulative allowance, real decision source and
   separately reviewed supervision. This health-only grant is not reusable.
4. Integrate the fixed operation into checked admission only after caller
   coverage and applicable authority are verified, then prove it under the
   fresh allowance. A new operation requires reviewed governing source; adding
   an argument to this health entry is not integration.
5. Preserve writer-coverage proof, ordinary lifecycle, readiness/cutover and
   protected process reclaim as separate scopes. None becomes live from
   bootstrap success.

This is a durable technical handoff, not creation, reopening or activation of
any dependent task. The caller route stays denied until that separate reviewed
integration exists.
