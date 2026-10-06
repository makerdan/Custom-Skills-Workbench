# Bounded coordination bootstrap proof

## Decision and exact source

Actual owner response: **Approve the pinned bootstrap proof**, reference
`inv_1fdbHV8F4cCl55dEoL6nPWfMY92xS8VMkN:call_lbsPmVHm1AaRWDLLW9O5poPL`.
Captured full binding: `failure-gate-bootstrap-approval.json`.
Final source/graph manifest: `failure-gate-bootstrap-review.json` (43 files).

- Source digest: `84aaa2f16bba9bfcab0e6663f80eb9a8c5a2342ef992d9f3d5f1e205eca0c266`
- Plan digest: `3fa0fb99a03b7b091d942e9925075bfd709fbbeba5d09d4770bf0a71dc842c2a`
- Local namespace: `d63a3d51-4dea-4a99-9e6a-d01410b7e017`
- Installation ID: `FG-00000001`
- Coordinator decision: `1bea22e9-5686-47ab-a475-98ad618f5652`
- Current proof boot: `e2501ddb-fc98-4cd9-9f30-2c262b7f4098`
- Policy: `local-v1.1`, unchanged

Execution: `python3 -B scripts/failure-gate-bootstrap.py prove`, raw driver
exit **0**. One fresh 900-second parent was reserved before initial fixture
dispatch. All four attempts are consumed; coordinator phase is `complete`.
Readback at 46.785 seconds from reservation already found all four acknowledged
outcomes. No retry, replacement, extra health probe or manual cleanup occurred.
This is locally captured cooperative owner approval, not platform identity
authentication, ordinary plan approval or a reusable grant.

## Outcomes

Private artifact base:
`.failure-gate/bootstrap/1bea22e9-5686-47ab-a475-98ad618f5652/`.

| Caller | Raw exit | Result | Elapsed execution/supervision | Run |
| --- | --- | --- | --- | --- |
| fixtures-1 | 0 | 46/46 PASSED | 13.469s total | `df224709-3f5c-42ac-9614-1c98f25a768a` |
| fixtures-2 | 0 | 46/46 PASSED | 13.058s total | `e1d59943-02fa-41eb-b111-57fb2bb3ad1d` |
| health-1 | 0 | PASSED | 0.155s | `d0ac34e9-fbf6-4889-b14e-d4938e54a5b1` |
| health-2 | 0 | PASSED | 0.155s | `ab2fd7a0-390b-44e5-aa2f-f60581df326a` |

Each caller's `outcome.json` is indexed by the original coordinator meta/run
payload with its SHA-256. Both isolated full suites retain their complete
bounded raw output (7,321 bytes each), report 46 discovered tests, no overflow,
no deadline breach, complete capture and known owned-tree quiescence.
Expected injected failure cases are isolated regression evidence only.

Each real health caller has one durable `launch_intent`, `watchdog_registered`,
`confirmed_start`, `step_outcome` and `bootstrap_outcome_acknowledged`.
Both outcomes affirm registration, stopped owned work, complete capture and
healthy release, with reason `finished`; neither delivered cleanup signals.
Health raw output is 2,023 and 2,181 bytes respectively. These are actual
read-only local coordinator callers, not simulated health fixtures, HTTP API
health acceptance or codegen/build/test acceptance.

The initial fixture was admitted through the unchanged canonical contained
fixture mechanism before importing new governing bootstrap code. Health used
the existing independent `supervisor.run`/watchdog and exact registered worker
incarnations. Existing owner stall/death, watchdog loss, registration failure,
timeout, output bound and journal-failure cases all remained in the complete
suite. New isolated cases cover binding/operation/source denial, allowance
inheritance/reset resistance, single-flight contention/replay, malformed
authority, private-worker denial and evidence/termination integrity.

## Acknowledgement and retained boundaries

Final read-only evidence readback confirmed:

- All four outcome hashes match the existing run rows and indexed artifacts.
- Every run is acknowledged with `recovery_required=0`.
- No retained runs exist after these healthy results.
- The full approved source manifest is unchanged.
- Before/after protected task/repair/non-bootstrap-meta state hashes matched
  at each acceptance; health did not allocate, initialize, activate or rebind
  policy/task state.
- Ordinary governance is **STAGED**, and live `writer_coverage` remains unset.

Original incidents, failures, historical clocks/consumption and recovery
acknowledgements were not deleted, renewed or reclassified. The existing
ordinary installation tooling binding is historical; this operation does not
renew it for ordinary use.

## Tested versus untested

**Accepted:** this exact fixed installation bootstrap and its two named
read-only coordinator health callers, under this one consumed owner decision.

**Not accepted / remains denied:** API generation/resource-lock integration,
root tests/typechecks/builds, ordinary task activation/run/completion, live
participating-writer coverage, general ordinary CLI admission, readiness/cutover,
independent caller/platform/remote CI coverage and protected process reclaim.
Canonical skills, service/workflow/package definitions and API sources were
not changed.

The separate generated-output integration requirements and exact fresh-decision
boundary are in `failure-gate-bootstrap-handoff.md`. This proof supplies neither
that future grant nor its missing caller/resource coverage.
