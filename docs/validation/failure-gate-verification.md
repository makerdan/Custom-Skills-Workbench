# Failure Gate verification result

**Result: Original incident recovered; complete caller FAILED.
Installation remains partial / blocked. Ordinary route is not ACTIVE.**

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
verification. No such amendment, second caller, new approval or retry has
occurred.

Full application additionally remains blocked by the applicable gaps in
`failure-gate-implementation.md`, including ordinary cutover, writer/caller
integration, protected reclaim and independent router verification.
