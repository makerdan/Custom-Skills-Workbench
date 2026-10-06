# Failure Gate verification result

**Result: Two approved complete installer callers PASSED consecutively.
Each passed typechecking, 137/137 package tests and 33/33 gate cases with
complete owned termination/capture. Bounded installer acceptance is complete.
Full application remains partial: ordinary governance is STAGED, and
writer/caller integration, ordinary completion and other host gaps remain.**

## Executed checks

| Check | Actual result |
| --- | --- |
| Initial safely contained fixtures | PASSED: 21 tests, 4.98 seconds, no deadline breach, overflow or observed survivor |
| Expanded contained caller fixtures | PASSED: 24 tests, 15.81 seconds; includes owner stall/death, watchdog loss, complete fixture terminal decision |
| Real bootstrap `pnpm typecheck` | Raw exit 0; complete bounded output; known owned work stopped; 11.61 seconds |
| First complete installer caller | FAILED/BLOCKED: raw exit 4, clean parent-supervisor termination, 13.26 seconds |
| Root `pnpm test` before recovery | NOT RUN |
| Corrective fixtures on approved corrected source | PASSED: 26 tests, 15.68 seconds |
| Recovery continuation typecheck | PASSED: raw exit 0, 6.33 seconds |
| Recovery continuation `pnpm test` | FAILED: raw exit 1, 2.82 seconds; scripts suite 29/30; API and Workbench suites NOT REACHED |
| Gate suite within the recovery caller | PASSED: 26 tests, raw exit 0, 16.51 seconds |
| Complete recovery caller | FAILED: raw exit 1, 27.25 seconds; known work stopped, complete capture, no observed gap |
| Second real installer caller | NOT RUN |
| Final corrective source and two added regression cases | PASSED in the corrective fixture run and the registered gate-suite step |
| Approved documentation/native-report amendment | Authored as `local-v1.1`; not rebound or activated |
| Latest amended fixture bundle | FAILED: 27/28 cases passed; 16.23 seconds; one supervisor completion-observation case failed |
| Native report-adapter positive/negative cases | Both PASSED within that failed bundle; not complete bundle or host acceptance |
| Latest amendment real callers | Neither launched; no policy rebind after failed fixtures |
| Separately approved completion correction fixtures | PASSED 29/29; 16.75 seconds; original inherited deadline retained |
| Completion-correction caller typecheck | PASSED, raw exit 0; 6.78 seconds |
| Completion-correction caller test step | STARTED, INTERRUPTED by watchdog error; no complete result |
| Completion-correction complete caller | BLOCKED, raw exit 4; outer owned survivors stopped; 8.73 seconds; healthy release false |
| Completion-correction second caller | NOT RUN |
| Approved diagnostic-phase evidence fixtures | FAILED 30/31; 16.99 seconds; both new error-evidence/cleanup checks PASSED |
| Diagnostic-phase exact recovery | NOT PERFORMED after failed fixture gate |
| Diagnostic-phase `pnpm test` | NOT RUN; zero diagnostic attempts |
| Approved parent control-pipe correction | PASSED 33/33; 10.736 seconds of tests, 11.041 seconds contained elapsed |
| Exact retained incident recovery after correction | ACKNOWLEDGED; original failure preserved; no administrative PASS |
| Single non-tier `pnpm test` diagnostic | Raw exit 0; scripts 30/30, Workbench 45/45, API 62/62; 4.648 seconds; complete capture, known work stopped, no gap |
| Approved full installer caller 1 | PASSED all 3 standard steps; outer raw exit 0; 26.684 seconds; complete capture/owned stop |
| Approved full installer caller 2 | PASSED all 3 standard steps; outer raw exit 0; 27.231 seconds; complete capture/owned stop |
| Existing app landing page | Screenshot rendered correctly; no browser error observed. No signed-in journey claim. |

The initial and expanded fixture results concern different staged source
revisions. The latest pre-correction fixture tooling digest is
`bbcb2db3b137570225fb0525afe4fd31ac6ec9f546606f41bae5c37a06092e15`.
Its safe canonical fixture supervisor digest is
`c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698`.

## Failure and correction

The first real caller rejected dispatch after successful typechecking because
the new execution-definition collector included regenerated `.tsbuildinfo`
compiler caches. That was an installer defect, not an observed application
typechecking failure or a pre-existing baseline.

Source now excludes exactly compiler caches from execution-definition bindings
while continuing to pin real configuration files. It also persists every
finished step immediately so a later preflight rejection does not lose its
step status, and rejects malformed budget/tier envelopes explicitly.

Two regression fixtures were added: compiler caches must not change execution
authority while real configuration changes must; a completed step must survive
rejection of the next dispatch. Both passed on the owner-approved tooling digest
`93fc9905a635fc6fcbe33af19d5f14be5e28562ae29a3aa9a031b3034c3efecb`.

## Preserved original evidence

- Local namespace: `d63a3d51-4dea-4a99-9e6a-d01410b7e017`.
- Installation-local task: `FG-00000001`, not a platform task number.
- Retained bootstrap run: `3cafe623-6a56-495d-8108-1034564ffcb9`.
- After the separately approved, acknowledged recovery, `runs.status` is
  `recovered`, `recovery_required=0`. The original raw failure and INCOMPLETE
  aggregate remain; there was no age deletion, replacement or false PASS.
- The original aggregate row still says NOT_REACHED for all steps because the
  old code lost its in-memory aggregate before the next dispatch. That record
  has not been retroactively rewritten as a pass.
- Actual event 9, `step_outcome`, and
  `.failure-gate/runs/3cafe623-6a56-495d-8108-1034564ffcb9/typecheck/raw.log`
  retain the successful typecheck evidence. The discrepancy is explicit.
- Parent caller raw evidence is `.failure-gate/installer-caller/1/raw.log`
  and `outcome.json`.
- Original boot: `f43c3eaf-c84d-4eb0-b417-6c0fa001da5a`.
- Exact registered watchdog/worker incarnations were re-observed absent:
  PIDs/start ticks `2785/321593`, `2791/321599`, `2801/321750`,
  `2806/321756`. This supports known quiescence, **not** permission to clear
  the retained coordinator record without the subsequent scoped approval.

## Approved recovery and actual continuation

The actual response is captured in `failure-gate-recovery-approval.json`.
The one-shot route is `scripts/failure-gate-continuation.py`; it is not a generic
recovery endpoint and does not activate ordinary task authorization.

- Stable continuation operation: `721fb9bc-fa10-446c-96d7-a10f8205b27e`.
- File trail:
  `.failure-gate/continuations/721fb9bc-fa10-446c-96d7-a10f8205b27e/`.
- The coordinator records the original binding, incident payload digest, actual
  scoped owner response, exact re-observed absent incarnations, and both original
  supervised outcomes in the recovery decision.
- The committed recovery event and run disposition were checked through a fresh
  read-only coordinator connection before new dispatch.
- Original installation start and attempt count were retained; additional
  continuation accounting is separate, finite and durable.
- Actual continuation run: `23ccd145-01c3-4237-a0b1-c555cc65051d`.
- All three registered steps produced bounded raw results. The complete caller
  is FAILED, not a successful host acceptance. Its known-owned lifecycle ended
  cleanly, so its finalized recovery disposition is false; that does not make
  its test failure PASS.
- Continuation state is `failed`, attempts `1`; the second complete caller was
  not launched. The route rejects repeated entry.
- Final read-only inspection confirmed coordinator/file journal consistency,
  exactly one committed recovery acknowledgement, STAGED governance and the
  unchanged original attempt counter. The continuation caller's registered
  watchdog/worker incarnations were absent. The app landing page still rendered
  correctly without browser errors; this is not signed-in journey acceptance.

### New blocking evidence

The real repository port test found three matches in the runtime-safety handoff
prose at lines 13, 27 and 55. Those lines describe an API test's OS-assigned
ephemeral allocation; the scanner allows the listener literal only in the actual
API test source, not in this handoff's prose. No live fixed-port collision was
observed by this test.

Raw Node output used the native text-summary format (`ℹ tests 30`, `ℹ pass 29`,
`ℹ fail 1`), whereas the registered adapter accepts only unprefixed TAP summary
lines. This format incompatibility is confirmed by the raw output and source
review; no passing native-output host result was executed. Multi-package prefix
compatibility also needs fixture and real-caller evidence.

These are unresolved observations, not ignored/pre-existing failures, baseline
promotion or repair discharge. The remaining launch slot does not authorize a
retry after failed acceptance.

No production, application database, remote CI or unrelated running process
was modified. Existing command strings/workflow definitions were preserved.

## Next authorization

The merged host-route work was documentation only; no competing runner was
introduced. The original proposed source and execution-definition hashes matched
before admission. Generation/writer integration remains blocked for ordinary
cutover; it was not waived.

See `failure-gate-test-format-amendment.md` for the newly proposed narrow
documentation correction, test-report adapter amendment and additional bounded
verification. Its actual approval is now recorded in
`failure-gate-test-format-approval.json`; the documentation correction and strict
native/TAP adapter were authored. The following fixture failure prevents
governing rebind and real callers.

## Latest approved amendment result

- Operation: `b37664c6-e279-4104-a10f-9ea6aec200f7`.
- Evidence:
  `.failure-gate/format-rechecks/b37664c6-e279-4104-a10f-9ea6aec200f7/fixtures.json`
  plus coordinator grant and fixture-result events.
- Staged policy digest:
  `b6d5094e1edf7b746d6b096f4ce1f8266797ee4492893c95c70515e4d3206ee1`.
- Tested staged tooling:
  `8ff80812767f3c8e2d9ab726be1e9140d19f08abde07aacd9070043dfe23bbf3`.
- Fixture attempt count 1; caller attempt count 0; phase `failed`.
- The original installed policy binding is still
  `6acdb7b9cdb8919bb205980aa0e66698616897dee00b13135e88e372d972da97`.
  The new source is not admitted to ordinary or real installation calls.
- The port scanner, caller argv, artifact ports and service/test listener code
  were not weakened or changed.

The failing isolated positive-exit fixture reported raw exit 0, 20 captured
bytes, complete capture, `stopped:true`, no signals or discovery gap, and
`reason:"owned_survivors"` with `healthy_release:false`. Source review shows
the watchdog captures `live` before `child.poll()`, then uses the older
snapshot to classify completion. A stale-observation race is indicated;
no isolation reruns or intermittency/baseline classification were performed.

The entire 28-case bundle is FAILED, despite both new adapter cases passing.
No retry, authority rebind or real caller was launched. Read-only coordinator
inspection confirmed consistent journal and no currently retained run exclusion.

See `failure-gate-completion-observation-proposal.md` for the exact proposed
supervisor correction and one additional fixture pass, inheriting the original
20-minute deadline rather than requesting a fresh budget. That proposal was
subsequently approved and executed as recorded below.

## Approved completion correction and new retained incident

Actual approval is captured in `failure-gate-completion-observation-approval.json`.
The narrow fix refreshes owned-process state after observing child exit and
checks the original deadline again. A deterministic fixture verifies refreshed
completion, real-survivor denial and late-zero deadline priority. Existing tests
remained; the full 29-case suite passed.

- Child amendment operation: `3d658bf1-d839-4c0e-a8b4-0ab92d367d79`;
  parent remains `b37664c6-e279-4104-a10f-9ea6aec200f7`.
- Evidence directory:
  `.failure-gate/completion-rechecks/3d658bf1-d839-4c0e-a8b4-0ab92d367d79/`.
- Original inherited deadline `6320.443256004` and boot were retained;
  no fresh budget was granted.
- Cumulative fixture attempts: original failed pass plus exactly one approved
  additional pass. Complete caller attempts in this amended lineage: 1.
- Tested tooling:
  `dea1eb3ebba74e2e25ad40fe1c8cb935e08abd2fe474d42de75cfa63b71ff54f`.
- Staged policy `local-v1.1` was rebound for this authorized installation
  operation only after passing fixtures and verified decision readback.
  Ordinary governance remained STAGED.

The new actual run is `62ad8676-50d9-478f-843e-1eccb6918dbf`.
Its typecheck step finished successfully and persisted immediately. Its tests
step was watchdog-registered and confirmed started, and its partial raw log
contains the beginning of `pnpm test`. The aggregate still says NOT_REACHED for
that step because the adapter threw before a terminal step result; **that label
does not mean no dispatch occurred**.

The private worker reported `watchdog failed; retain exclusion`. The parent
adapter discards the subordinate error observation rather than recording its
typed exception/detail, so the exact cause is unknown. Source hypotheses about
transient process reads are not confirmed findings or approved fixes.

The outer supervisor observed two remaining owned Node descendants and stopped
them using its already authorized owned-work cleanup. It recorded complete
worker-output capture, `stopped:true`, no discovery gap, `healthy_release:false`
and raw exit 4. This is not healthy release or host acceptance.

The run stays `running`, `recovery_required=1`, assessment INCOMPLETE.
The continuation stays `caller_running` with one reserved attempt and no final
successful result. No replacement, second caller, age-based clear, blind retry
or false PASS occurred.

Read-only inspection confirmed journal consistency. The recorded outer
watchdog/worker and both inner-step watchdog/worker identities were absent.
Known quiescence alone does not authorize release of this new retained incident.

See `failure-gate-watchdog-evidence-proposal.md` for a diagnostic-only next
phase: preserve actual error details, separately recover this exact incident,
and collect one bounded diagnostic observation. It does **not** propose another
full installation sweep or an unverified cause-specific fix. This phase was
subsequently approved and attempted as recorded below.

## Actual diagnostic-phase fixture result

- Actual response: `Approve diagnostic-only phase`, recorded in
  `failure-gate-watchdog-evidence-approval.json`.
- Operation `d7a4ad5b-b450-468d-b850-85565e4e3bc2`.
- Evidence:
  `.failure-gate/watchdog-diagnostics/d7a4ad5b-b450-468d-b850-85565e4e3bc2/fixtures.json`
  and coordinator grant, fixture-reservation/result and blocked events.
- Typed error evidence records exception class/errno and up to four bounded
  frame locations, never exception messages, source text, environment or locals.
  Parent adapter preserves bounded non-success evidence before its BLOCKED
  result. File/journal failure remains on the existing owned cleanup path.
- Both new cases passed: bounded typed/private evidence, and actual isolated
  post-registration error with owned cleanup despite injected journal failure.
- Full suite FAILED: 30/31 passed; one ERROR in the existing real nonzero-exit
  fixture. Full readiness cannot be inferred from the new cases passing.
- Tested core tooling:
  `f2bff6cbf911da20c31f4cb195b9dc6e6b272521478bf6d3db026ab74fddae42`.
- Source review corrected the staged diagnostic driver's `run_seconds` to fit
  its 600-second parent allowance. That driver change was not reexecuted; the
  previously pinned driver digest remains historical evidence, not renewed
  dispatch permission.
- One fixture attempt consumed; zero recovery operations and zero diagnostics.
- Half the 600-second grant was conservatively reserved for initial preparation;
  all admitted remaining phases shared deadline `7391.502211772`. That deadline
  was expired at the last readback. No reset, refund or unused-slot reuse.
- Coordinator phase `blocked_by_fixtures`; journal consistent; original run
  still retained with `recovery_required=1`. No governing source rebind occurred.

The precise new observed failure was parent-side `BrokenPipeError: [Errno 32]`
at heartbeat flush in `supervisor.run`, followed by another BrokenPipeError
closing the stream in `finally`. Terminal receipt timing is not retained in that
trace. Source review confirms the adapter can send a heartbeat after receiving a
result, and its final close can replace the original exception. This supports a
focused parent-control-pipe correction; it does **not** establish the cause of the
earlier subordinate watchdog error.

No additional fixture, recovery, diagnostic or installation caller was launched.
See `failure-gate-control-pipe-correction-proposal.md` for the exact pending
source amendment and separately accounted bounded continuation.

Full application additionally remains blocked by the applicable gaps in
`failure-gate-implementation.md`, including ordinary cutover, writer/caller
integration, protected reclaim and independent router verification.

## Approved pipe correction and completed diagnostic continuation

Actual response: `Approve pipe fix and 5-minute continuation`, retained in
`failure-gate-control-pipe-approval.json`.

- Operation `d57bbc46-c42a-46ed-bf03-74dcb9cca9fb`.
- Grant reserved before code edits; 300 seconds including inspection/authoring,
  fixtures, recovery, diagnostic and readback. Prior grants/failures were neither
  refunded nor overwritten.
- Current boot `4a7c5b18-9710-4929-a167-5842d38a9ea9`, original new-grant
  deadline `439.65356752`. Historical boot/deadlines remain in prior records.
  The resumed environment changed clock domain; the new explicitly approved
  allowance was bound to its actual boot before dispatch, not borrowed from
  the expired historical timer.
- Corrected core tooling:
  `a8b120234a249cd00c33d056a8eeb228d72af30b503a1bf5b861620976f96977`.
- Scoped driver:
  `98c148b80c27a0e9753d723f62b1a81e60349b2360037838e69f721f29402a45`.
- Canonical supervisor remains unchanged, hash
  `c759dee01e36b2ea0acee65d80b7e2a0d2b0977725f52d09dc6ccf2d672a7698`.
- Evidence:
  `.failure-gate/watchdog-diagnostics/d57bbc46-c42a-46ed-bf03-74dcb9cca9fb/fixtures.json`
  and `diagnostic/{supervision.json,raw.log,outcome.json}`, coordinator
  `control-pipe:967ddd7db207f5e126a500234af8701738c437c772a120684ded48c6fd86d6b9`
  and its events/decision.

The parent now stops heartbeats after terminal receipt. A broken heartbeat pipe
disables further heartbeat writes but cannot establish an outcome; bounded
draining and watchdog-exit verification continue under the original deadlines.
Actual stdout EOF without a complete result blocks promptly. Only stdin's
BrokenPipeError on final close is suppressed, preventing it from replacing the
primary outcome/error. Registration and owned cleanup remain unchanged.

Both deterministic new closed-control cases passed: a complete synthetic raw
nonzero result remains failed with its raw exit preserved; a partial/missing
terminal result remains BLOCKED. These are isolated transport models, not
authentic host attestations. The full 33-case bundle, including real zero/nonzero,
owner stall/death, watchdog loss, journal failure and typed-private evidence,
passed in its one approved corrective attempt. Diagnostic lineage therefore
has two cumulative fixture attempts: failed 30/31 followed by passed 33/33.

Exact recovery decision `d509cb2d-a5ab-44d4-a3c1-4fa5a064b5b3` preserves the
original failure for run `62ad8676-50d9-478f-843e-1eccb6918dbf`; its status is
now `recovered`, `recovery_required=0`. All eight recorded PID slots were
observed absent. The transaction/recovery acknowledgement was checked on a
fresh read-only connection before diagnostic launch. The installed binding was
updated only for this approved scope, with prior binding retained in the decision.

Diagnostic run `9114a038-802c-480e-a146-de62fe53b3c2` is `finished`,
`recovery_required=0`, explicitly `eligible_for_tier:false`. Its recorded
observation is raw exit 0, reason `finished`, affirmative registration/stop/
capture, 17,252 bytes, no signals and no gap. It used a 180-second execution cap
within the shared 300-second parent, 20-second cleanup/10-second capture,
30-second queue, 15-second startup/stall, 2-second registration, 30,000-ms tests,
15,000-ms hooks and 8 MiB raw output cap.

Final read-only coordinator initialization verified file-journal consistency;
both diagnostic watchdog/worker identities were absent; no retained run remains.
Governance remains STAGED. No additional fixture, diagnostic, full installer
caller, activation or platform mutation was performed.

The original subordinate watchdog error did not recur and remains unclassified.
One passing diagnostic is not proof of the original cause, fixed intermittency,
two-caller acceptance or completed application of the entire skill.
The next bounded installer-acceptance proposal is
`failure-gate-installer-acceptance-proposal.md`; it is not execution permission.

## Two complete approved installer callers

That proposal was subsequently approved as `Approve bounded installation checks`.
The actual reference is captured in `failure-gate-installer-acceptance-approval.json`.
Operation `4cb1465a-627c-4e91-8d35-5eae96ddc7f8` reserved 300 additional seconds
before inspection/authoring. All previous grants, failures and attempts remain
unchanged; no earlier wrapper was reentered.

- Namespace/local task unchanged. Current boot
  `03557306-f58c-4249-aa8d-ab861714d902`, deadline `394.346878193`.
- Core tooling remained
  `a8b120234a249cd00c33d056a8eeb228d72af30b503a1bf5b861620976f96977`.
- New scoped driver `scripts/failure-gate-installer-acceptance.py`, digest
  `acd39e128a5b590eebe60388b4a34529a8f0833d50dc446053fed879bee090ee`.
- Admitted decision `b12adc1e-8b58-4931-870b-a132414f75d5`.
- Coordinator metadata
  `installer-acceptance:041d4263c816eb69f0f2866d8a2ea5eb7db3d53fdbce9242cf3d50fc9833b165`;
  two consumed attempts, phase `passed_twice`.
- Outer file trail:
  `.failure-gate/installer-acceptance/4cb1465a-627c-4e91-8d35-5eae96ddc7f8/caller-{1,2}/`
  with per-event records, raw worker output and outcomes.
- Inner results: `.failure-gate/runs/<run UUID>/`, coordinator run rows and
  step registration/start/outcome events.

| Caller / actual run | Typecheck | Package tests | Gate cases | Aggregate |
| --- | --- | --- | --- | --- |
| 1 / `a717428d-e602-422f-bc14-d591aa4c9ae7` | raw 0; complete; 5.508 s | raw 0; all three reports complete; 5.433 s | raw 0; complete; 14.214 s | PASSED; finished; recovery_required=0 |
| 2 / `ca28eb4d-5b66-4dc9-8b04-c4661a7304d3` | raw 0; complete; 5.512 s | raw 0; all three reports complete; 5.415 s | raw 0; complete; 15.141 s | PASSED; finished; recovery_required=0 |

Each package report records scripts 30/30, Workbench 45/45, API 62/62, with zero
failed/cancelled/skipped/todo tests. The standard gate step ran the unchanged
33-case bundle, not an extra discretionary fixture or diagnostic.

Each outer caller used an execution limit of 90 seconds narrowed to an 89-second
effective parent, 20-second cleanup/10-second capture, 30-second queue,
15-second startup/stall, 2-second registration, 30,000-ms tests/15,000-ms hooks
and bounded 8 MiB output. Inner run/step allowances were further narrowed from
the inherited parent, reserving cleanup. Both callers shared the original
300-second grant including authoring, queue, capture and final readback.

Final fresh read-only initialization checked journal consistency and read both
terminal run rows. All 16 recorded inner/outer watchdog/worker PID slots were
absent; no retained run remained. No core amendment, retry, extra diagnostic,
recovery, workflow change, ordinary activation or platform-task mutation occurred.

This proves these two real installer observations on the admitted cooperative
local closure. It does not prove tamper resistance, participating live writers,
ordinary-plan activation/completion, protected reclaim or final whole-project
task completion. Historical failures remain historical failures; the original
watchdog error's cause remains unclassified.

Next proposal: `failure-gate-host-integration-inventory-proposal.md`, a read-only
mapping phase before any integration amendment or cutover is requested.
