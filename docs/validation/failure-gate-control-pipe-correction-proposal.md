# Proposed parent control-pipe correction and bounded diagnostic continuation

**APPROVED AND EXECUTED** — actual response in
`failure-gate-control-pipe-approval.json`. Correction PASSED 33/33; exact recovery
acknowledged; one non-tier diagnostic exited 0. Historical proposed scope below
is preserved; current result is in `failure-gate-verification.md`.

## Confirmed observation, not original-cause inference

The owner-approved evidence-only phase added typed/private error records and
focused fixtures. Both new checks passed, but the whole 31-case bundle FAILED
with a parent heartbeat `BrokenPipeError` followed by another error during pipe
close. No recovery or diagnostic was admitted.

The parent sends heartbeats even after a terminal result is received. The pipe
can close before process polling observes exit or before buffered terminal data
is read. Buffered stdin close can raise again and replace the original exception.
These source facts and the preserved traceback support the correction below.
They do not establish the original subordinate watchdog error's cause.

## Exact scope and lineage

- Namespace `d63a3d51-4dea-4a99-9e6a-d01410b7e017`,
  local task `FG-00000001`; no platform-task authority.
- Original retained run `62ad8676-50d9-478f-843e-1eccb6918dbf`;
  still INCOMPLETE, `recovery_required=1`.
- Failed evidence operation `d7a4ad5b-b450-468d-b850-85565e4e3bc2`,
  actual prior response in `failure-gate-watchdog-evidence-approval.json`.
- Policy `local-v1.1`,
  digest `b6d5094e1edf7b746d6b096f4ce1f8266797ee4492893c95c70515e4d3206ee1`.
- Installed tooling remains
  `dea1eb3ebba74e2e25ad40fe1c8cb935e08abd2fe474d42de75cfa63b71ff54f`.
- Latest tested staged tooling
  `f2bff6cbf911da20c31f4cb195b9dc6e6b272521478bf6d3db026ab74fddae42`,
  full suite FAILED 30/31; no fake current PASS.
- Failed grant deadline `7391.502211772` expired. One fixture consumed; no
  diagnostic consumed. Remaining slots do not authorize retry or fresh time.
- New source closure and actual new approval must be recorded after the
  prospective amendment; no hash or approval is fabricated.

## Proposed corrective source

Change only `scripts/failure_gate/supervisor.py`, its focused cases in `tests.py`,
and the scoped continuation entry/receipt:

1. Do not send heartbeats after terminal-result receipt.
2. If the heartbeat pipe closes before receipt, disable further control writes
   and continue only bounded output draining/exit verification within the same
   original deadlines. EPIPE alone is never PASS or healthy release.
3. Recognize actual stdout EOF so a dead watchdog lacking a complete terminal
   record fails promptly rather than spinning until the bound.
4. Do not let stdin's BrokenPipeError during final close replace the primary
   result/error. Preserve all other failure handling, known-owned cleanup,
   registration and finite capture/termination limits.
5. Add deterministic closed-control/complete-result and closed-control/missing-
   result cases; retain real raw-zero/nonzero, journal-failure cleanup, owner
   death/stall, watchdog-loss and typed-private evidence cases.

No process-read/ownership observer repair or unrelated behavior change is
authorized. The original watchdog cause remains unknown until real diagnostic
evidence exists.

## Newly proposed finite allowance

**5 additional minutes**, explicitly and cumulatively recorded with every prior
grant and failure. Reserve its immutable monotonic deadline before inspection/
authoring; no delayed new timer, refund, restore or alias-based renewal.

- Exactly one additional full isolated fixture pass: 30-second execution,
  0.2-second grace, 2-second verification, 1-second capture, 1 MiB output,
  using the unchanged canonical independently verified fixture supervisor.
- This makes two cumulative fixture attempts in the diagnostic lineage.
  Preserve the first failure and its file/coordinator records.
- If that pass succeeds, perform only the already described exact incident
  recovery after fresh known-incarnation, journal/conflict and durable readback.
  Use all identity bindings and original outcomes in
  `failure-gate-watchdog-evidence-proposal.md`. Any occupancy/uncertainty blocks
  dependent work; do not treat absence or healthy file writes as authority.
- Then at most one registered non-tier `pnpm test` diagnostic, not a full
  installation sweep or required-tier evidence. The previous diagnostic
  allowance was unused; this grants no second diagnostic.
- Diagnostic execution at most 180 seconds, further narrowed by the same parent
  remainder with mandatory 20-second termination/10-second capture reserved.
  Queue 30 seconds; startup/owner-stall 15 seconds; registration 2 seconds;
  tests 30,000 ms / hooks 15,000 ms; combined raw output 8 MiB;
  typed error/trace detail 8 KiB.
- Exact recovery operations, queue, authoring, inspection, evidence writes and
  readback share the parent deadline. If insufficient time remains, stop.
- A fixture failure, acknowledgement gap or uncertain diagnostic stops new
  dispatch. No automatic retries, extra diagnostics or installation callers.

## Acceptance and following boundary

Full corrected fixtures must pass; current fixtures alone prove nothing about
the host. Preserve actual raw nonzero outcomes despite normal transport closure.
Lost/partial terminal data must remain BLOCKED, with owned cleanup unaffected.

Recovery must be exact, acknowledged and preserve the original failure; no
administrative PASS. The diagnostic must preserve observed typed failure or its
complete bounded single-attempt outcome. A raw-zero diagnostic is not proof of
fixed intermittency or installation acceptance.

If a concrete original watchdog cause is captured, prepare the corresponding
specific correction next. Otherwise report uncertainty; no speculative fix or
baseline classification. Ordinary integration/cutover, protected host attestation
and independent verification remain incomplete.

No live reclaim, unrelated signals, service restart, production/data/schema
mutation, remote CI, baseline ignore, repair waiver, platform task mutation,
publication or full installation sweep.
