# Proposed completion-observation correction

**PROPOSED — no correction, approval, rebind or rerun performed.**

## Exact incident and authority amendment

This extends only the actual owner-approved format amendment operation
`b37664c6-e279-4104-a10f-9ea6aec200f7`, local task `FG-00000001`,
namespace `d63a3d51-4dea-4a99-9e6a-d01410b7e017`.
It is not platform task authorization or ordinary cutover.

Actual prior approval:
`inv_1iUbbTUza9TH1OYklXXmz6VHHX6kIwsgpj:call_COt2ujLvZvm1z4wVCGgVpfeD`,
captured in `failure-gate-test-format-approval.json`.

The staged native-report source was tested once:
tooling `8ff80812767f3c8e2d9ab726be1e9140d19f08abde07aacd9070043dfe23bbf3`,
policy `b6d5094e1edf7b746d6b096f4ce1f8266797ee4492893c95c70515e4d3206ee1`,
version `local-v1.1`. The bundle FAILED 27/28. Both new adapter checks passed;
no complete host acceptance or new authority rebind occurred.

## Evidence and proposed source fix

In the isolated positive-exit case, the supervisor reported:

- raw exit 0; complete capture; 20 bytes;
- `stopped:true`, no signals, no discovery gap;
- `reason:"owned_survivors"`, therefore non-success.

The watchdog observes owned processes before polling the child's exit status.
Using that earlier observation after the child has exited can classify a
completed root as surviving work. This is an evidence-supported source defect
candidate; no retries or baseline/intermittency classification are claimed.

Request permission to change only:

1. `scripts/failure_gate/watchdog.py`: when the root exit and drained output are
   observed, refresh the owned-process observation before classifying completion.
   Recheck the same original monotonic deadline after that observation; a late
   raw zero must remain deadline failure. Live/unknown descendants must still
   reject healthy completion. Do not change registration, ownership discovery,
   signaling, teardown, output caps or existing bounds.
2. `scripts/failure_gate/tests.py`: add deterministic coverage of refreshed exit
   observation, retained real-survivor denial and deadline priority. Preserve
   all existing cases, including the real isolated normal/nonzero exits.
3. One scoped continuation entry/receipt that records the actual new owner
   response, approved source closure and additional fixture allowance while
   retaining the prior failed fixture and all prior accounting. No automatic
   retry of the old one-shot route.

The exact resulting source closure must be recorded after this approved
prospective change. No prospective digest or new approval reference is invented.

## Existing deadline and additional allowance

**No fresh time budget requested.** Inherit the existing 20-minute operation's
monotonic deadline `6320.443256004` on boot
`f43c3eaf-c84d-4eb0-b417-6c0fa001da5a`. At inspection, 945 seconds remained;
that observation is not a replenished counter or promise of current remainder.

- Permit exactly **one additional** isolated full-suite fixture attempt,
  so the original operation's cumulative fixture allowance becomes two.
- Preserve the first failed attempt and its consumed time/output.
- Use the canonical fixture supervisor with 30-second execution, 0.2-second
  grace, 2-second verification, 1-second capture and 1 MiB output.
- If that additional fixture pass succeeds, permit the existing **two unused**
  complete installation caller slots on the reviewed corrected closure.
  This amendment adds no third caller and no additional caller allowance.
- Keep original 480-second caller maximum, 30-second queue,
  30,000-ms test / 15,000-ms hook, 15-second startup/owner stall,
  2-second registration, 20-second termination, 10-second capture,
  8 MiB caller output and narrowed inherited parent accounting.
- If the inherited deadline has expired or leaves insufficient complete-work/
  cleanup time, stop. No implicit budget extension.
- Any additional fixture/caller failure or uncertainty stops new dispatch;
  no other retries are authorized.

## Prerequisites, acceptance and exclusions

Read back current namespace/boot, original grant/failed fixture, installed and
staged policy, file/coordinator journal and prior known-owned completion.
Unexpected retained claims, contenders, source drift or lost acknowledgement
block dependent work. Preserve all historical failures and decisions.

Fixture acceptance requires the full corrected suite to pass, including the
new completion-observation guards and existing native-report negative cases.
Then both real callers must pass all three unchanged registered steps
(`pnpm typecheck`, `pnpm test`, `python3 -B scripts/failure_gate/tests.py`)
with complete selected-package coverage, finite capture, known stopped owned
work and durable acknowledgements.

This remains cooperative Linux local tooling, not protected host attestation.
No ordinary activation/cutover, live reclaim, unrelated signals, production,
service restart, remote CI, baseline ignore, repair waiver, platform task
creation/status/dependency/completion, publication, or source changes outside
this scope.

After successful actual bootstrap readiness, prepare the separately approved
ordinary caller/writer integration and cutover proposal; do not claim full
application from fixture or installation caller results alone.
