# Failure Gate verification result

**Result: Partial / blocked installation. Ordinary route is not ACTIVE.**

## Executed checks

| Check | Actual result |
| --- | --- |
| Initial safely contained fixtures | PASSED: 21 tests, 4.98 seconds, no deadline breach, overflow or observed survivor |
| Expanded contained caller fixtures | PASSED: 24 tests, 15.81 seconds; includes owner stall/death, watchdog loss, complete fixture terminal decision |
| Real bootstrap `pnpm typecheck` | Raw exit 0; complete bounded output; known owned work stopped; 11.61 seconds |
| First complete installer caller | FAILED/BLOCKED: raw exit 4, clean parent-supervisor termination, 13.26 seconds |
| Root `pnpm test` | NOT RUN |
| Required gate suite within the real bootstrap tier | NOT RUN |
| Second real installer caller | NOT RUN |
| Final corrective source and two added regression cases | NOT RUN after correction; no pass claimed |
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
rejection of the next dispatch. These corrective changes are staged and untested.

## Preserved original evidence

- Local namespace: `d63a3d51-4dea-4a99-9e6a-d01410b7e017`.
- Installation-local task: `FG-00000001`, not a platform task number.
- Retained bootstrap run: `3cafe623-6a56-495d-8108-1034564ffcb9`.
- `runs.status` remains `running`, `recovery_required=1`; no age deletion,
  replacement, reset or false healthy release was performed.
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
  the retained coordinator record.

No production, application database, remote CI or unrelated running process
was modified. Existing command strings/workflow definitions were preserved.

## Next authorization

See `failure-gate-recovery-proposal.json` for the exact requested correction,
retained-incident recovery, additional bounded verification and exclusions.
No recovery or retry has occurred. The pending bounded-host-route merge and
generation coordination must be reconciled before dispatch; changed bindings
or competing authority block admission.

Full application additionally remains blocked by the applicable gaps in
`failure-gate-implementation.md`, including ordinary cutover, writer/caller
integration, protected reclaim and independent router verification.
