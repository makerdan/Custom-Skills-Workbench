# FG-01-I prior policy and caller inventory

**Observation date:** 2026-10-06  
**Host:** Skills Workbench, `/home/runner/workspace`; Git snapshot `799443de19aab77f78b2dafe827d4095f181a6e4`.  
**Evidence bindings:** Original tracked source/report/approval digests are in `failure-gate-fg-01-source-manifest.md`. This inventory is descriptive; it is not an approval, current registry, or replacement for a protected live read.

## Runtime, language, build, and configured workflows

| Fact | Status | Original source / boundary |
| --- | --- | --- |
| Workspace | **Documented** as pnpm workspace; `package.json` is private root and `@workspace/...` packages are used by scripts. | Root `package.json`, `lib/api-spec/package.json`; no install/build was run. |
| Language/runtime modules | **Configured/documented:** `.replit` declares `nodejs-24` and `python-base-3.13`; workspace uses TypeScript 5.9.3 and pnpm scripts. | `.replit`, root `package.json`; installed runtime version was not launched or probed. |
| Deployment config | **Configured/documented:** application router, autoscale target; post-build `pnpm store prune`, `CI=true`. | `.replit`; not a validation command; not run. |
| Post-merge caller | **Configured/documented:** `scripts/post-merge.sh`, 20-second config timeout; it runs `pnpm install --frozen-lockfile` then `pnpm --filter db push`. | `.replit`, `scripts/post-merge.sh`; dependencies and database schema may change. Not run. |
| Preview workflows | **Configured in the supplied environment snapshot:** `artifacts/skills-workbench: web`, `artifacts/api-server: API Server`, and `artifacts/mockup-sandbox: Component Preview Server`. | Environment snapshot only; configured does not prove currently serving or gated. None was started, stopped, restarted, or queried. |
| Remote CI / external runners | **UNKNOWN.** The inspected project source/configuration did not expose a confirmed remote validation route. No remote check was queried or triggered. | Do not infer absence of unpublished jobs, external providers, additional workspace writers, or other branches. |

## Actual local validation and command callers

The following command strings are preserved as source facts. Their presence is **documented/implemented**, not an authorization to invoke them. No command in this table was executed during Task #68.

| Caller / command | Actual behavior and coverage | Gate / side effects |
| --- | --- | --- |
| `pnpm preinstall` | Removes `package-lock.json` and `yarn.lock`; rejects non-pnpm user agents. | Destructive to lockfiles; never invoked here. |
| `pnpm build` | Runs `pnpm run typecheck`, then recursive workspace builds where defined. | Inherits typecheck's Regression Guard writer; not a test-only action. |
| `pnpm test` | Runs root Regression Guard, `@workspace/scripts` tests, and `@workspace/api-server` plus `@workspace/skills-workbench` tests. | Not a universal all-workspace test declaration; regression guard first may write. No caller route/remote CI acceptance inferred. |
| `pnpm regression-guard` | `node scripts/check-regression-guard.mjs --fix-stub && node scripts/check-regression-guard.mjs`. | `--fix-stub` can write a task-plan stub; this is an actual writer, not purely read-only validation. |
| `pnpm typecheck` | Regression Guard, `pnpm typecheck:libs`, then recursive typechecks for artifacts and scripts where provided. | Also inherits `--fix-stub` writer. No typecheck performed. |
| `pnpm typecheck:libs` | `tsc --build`. | Compilation may emit build outputs; not run. |
| `pnpm workspace-skill:status` | `node scripts/workspace-skill-status.mjs`. | Status utility, not a Failure Gate route; not run. |
| `pnpm --filter @workspace/api-spec run codegen` | `orval --config ./orval.config.ts && pnpm -w run typecheck:libs`. | Direct generated-output write/delete (`clean:true` in the actual Orval config) followed by nested typecheck. Prior approved bootstrap explicitly denied it; remains denied absent a separate current approval and conflict contract. |
| `python3 -B scripts/failure_gate/tests.py` | Prior local policy declares it as the separate gate-test command in its standard tier. | Not run here; availability/authority is not established by the policy file. |
| Replit deployment post-build | `pnpm store prune` with `CI=true`. | Deployment lifecycle action, not proof of task validation; not triggered. |
| `.replit` post-merge | `bash scripts/post-merge.sh` (configured path); frozen dependency installation and `pnpm --filter db push`. | Dependency/schema mutation; not invoked and outside this task. |

`scripts/check-regression-guard.mjs` imports Node filesystem and Git operations, discovers Markdown plans (or `TASK_PLAN_FILE`), and has `--fix-stub`/`--stubs-only` modes. The concrete `--fix-stub` behavior is in existing source and the host integration map. The checked route does not automatically cover direct package-manager, editor, task-agent, merge/setup, or generated-output writers.

### Prior local Failure Gate policy — historical binding only

`failure-gate-policy.json` version `local-v1.1` describes two tiers:

- `static`: `pnpm typecheck`, labeled for non-governing documentation changes.
- `standard`: `pnpm typecheck`, `pnpm test`, and `python3 -B scripts/failure_gate/tests.py`.

It declares one plan-stated registered tier; diagnostics and baseline ignores are empty. It says reclaim is blocked without protected attestation/disruption approval. It requires changed governing tooling/policy/tiers/parameters to receive new approval, and separates cutover from installation approval. The latest captured capability/report still says ordinary governance **STAGED**. Because no current live store route was permitted or established here, the normative present classification remains **UNKNOWN**, not ACTIVE and not verified INACTIVE.

## Existing implementation, registered route, and host acceptance are separate

| Component | Source/documented status | Registered/operational status and current evidence |
| --- | --- | --- |
| Local coordinator | `scripts/failure_gate/store.py` implements SQLite-backed records; documented path is `.failure-gate/coordinator.sqlite3`, with schema/version and task/decision/event/run/repair concepts in the evidence index. | Current file/store state was not queried or opened in Task #68. Availability, present contents, active reservations, current namespace and current remaining budgets are **UNKNOWN**. Do not initialize it if absent. |
| Task and plan | Local Gate expects an exact versioned JSON plan and local namespace/ID. A tracked Markdown platform task plan also exists for `#68` and `#69`. | These are different task systems. Platform refs `#68/#69` are not Failure Gate IDs. The platform task snapshot is contextual evidence only; it is not local plan approval. No local ID was allocated for Piece 01. |
| Local plan approval | `Gate.approve_plan` / `Gate.activate` source requires interactive terminal review of exact plan content/digest and matching local policy binding. | Prior map reports no trusted non-terminal approval event/adapter. Current exact approval route/decision is unavailable; no plan was approved or activated. |
| Platform task approval | No actual platform approval event or exact approved-plan snapshot-to-local-ID mapping was exposed by the inspected project. | Task assignment/status and the Markdown plan are not approval. Platform approval API availability elsewhere is **UNKNOWN**. |
| Checked runner | `Gate.required_run` / `Gate.execute` exists in source. Its registered required run is still described STAGED. | The host map says the CLI does not call an outer supervisor from its entry path and cutover is denied. No current ordinary route is verified. |
| Completion writer | `Gate.complete` exists locally and is intended to hold the writer lock across final snapshot/report checks and terminal commit. | Prior capability/map says writer coverage is unset and completion STAGED; platform completion was never invoked by the project. No completion writer was called. |
| Owner-directed closure | Local `Gate.owner_close` and reports distinguish `owner_direction` from `validated`. | No platform-native closure adapter is claimed; no task was closed. |
| Events and monitor | Source provides `Store.event`, event projection and watchdog error records. | Prior captured reports describe the prior bounded bootstrap journal as consistent; task-agent/direct/remote event coverage remains incomplete/unknown. No event/store route read in this task. |
| Backup/restore | Source offers checkpoint and fenced restore; evidence index documents an intended checkpoint after accepted local tasks. | Prior record says isolated checkpoint/restore tests exist but there is no scheduled/live backup or proved live restore/resumption. No backup/restore ran. |
| Reclaim | Local CLI/policy explicitly deny the operation absent protected source/approval. | Protected host identity, attestation and disruption provider unavailable in current evidence; no signal or reclaim occurred. State **BLOCKED**, not N/A. |

## Approval sources and finite historical allowances

All approval files cited here are locally captured cooperative owner-response records. Their text does not establish a protected platform identity, task-board approval event, or current grant. They are historical, operation-specific, and not reusable. Exact files/digests are in the source manifest.

| Historical record | Authentic recorded scope and finite values | Present treatment |
| --- | --- | --- |
| Installation policy approval | Local policy/bootstrap setup only; explicitly **not** cutover/reclaim. Maximum 2 complete acceptance passes, 2,700 seconds total, 1,200 seconds per pass, 480 seconds per step, 30-second queue, 30,000 ms test, 15,000 ms hook, 20-second termination, 10-second evidence, 8 MiB output per pass. | Scope belongs to its original installation, not Task #68. No current remaining amount was read; do not reuse. |
| Policy limits | 30-second queue, 480-second step, 15-second startup, 30-second test, 15-second hook, 15-second owner stall, 2-second registration, 20-second cleanup, 10-second capture, 1,200-second run, 2,700-second installation, 8 MiB maximum bytes. | A historical policy definition, not a new grant. Values do not establish the remaining runtime, a current session, or independent supervision for any later work. |
| Health-only bootstrap approval | One fixed 900-second boot-bound parent; exactly `fixtures-1`, `fixtures-2`, `health-1`, `health-2`. Each fixture max 120-second execution, 0.2-second grace, 2-second verification, 1-second capture, 1 MiB output. Health envelope: 30-second queue/step, 15-second startup/stall, 2-second registration, 20-second cleanup, 10-second capture, 30-second test, 15-second hook, 1 MiB; 900-second session/install cap. | The report states the one-shot was consumed by that health-only operation. The health caller and fixture sequence do not authorize ordinary runs, codegen, retries, or reuse. No separate cancellation/teardown limit is inferred beyond the named grace/cleanup fields. |
| Separate installer acceptance approval | 300 seconds total; at most two consecutive complete standard installer callers; stop on the first failure/uncertainty; no fixture, diagnostic, repair, recovery, or activation. | Later retained record contains two complete caller outcomes. This separate grant is not Task #68 authority and cannot be renewed by remaining historical slot labels. |
| Read-only integration inventory approval | 300 seconds from recorded boot/monotonic `607.294026956` to `907.294026956`. Last clock observation `1104.920802672`; closeout status is `BUDGET_EXHAUSTED_COMPLETION_TIMING_UNVERIFIED`. | Historical discovery grant expired/exhausted; its author explicitly did not certify in-budget documentation completion. It is not a read permit now. |

No authoritative current phase/queue/step/startup/test/hook/teardown/cancellation/termination/capture/parent/session/attempt/resource envelope, independent whole-tree supervisor grant, or remaining consumption was found for any new execution. Those fields are **UNKNOWN / BLOCKED** for later runtime work, not filled with historical defaults. This Task #68 assignment permits documentary readback and writes only; it launches no execution.

## Writers, locks, supervision, recovery, and coverage

| Surface | Observed fact | Classification / gap |
| --- | --- | --- |
| Regression Guard | `--fix-stub` writes task-plan Markdown; root `typecheck`, `test` and `build` can reach it. | Implemented writer; actual participation in `.failure-gate/writers.lock` not verified. |
| API generated output | Orval uses actual `lib/api-client-react/src/generated` and `lib/api-zod/src/generated` targets with cleaning enabled. | Direct writer/deleter; no checked admission or common lock was demonstrated. Bootstrap expressly denied codegen. |
| Post-merge | Frozen pnpm install and DB push. | Dependency/schema writer; separate authority and coordination needed. |
| Local Gate writes | `Gate.write` validates active plan/path/before-digests and uses stable `.failure-gate/writers.lock`; `Gate.complete` uses it through terminal commit. | Code/primitive plus isolated proof, but participating real writer coverage remains unverified. |
| Editor, direct Agent/file tools, checkout/merge, external jobs | Existing host map says the Gate writer does not cover these merely because they edit files. | Participation/coverage **UNKNOWN**; inventory every actual participant or prove an effective isolated accepted snapshot. |
| Supervision | Local implementation uses cooperative Linux `/proc`, subreaper and watchdog mechanisms. | Not hostile-code, cgroup, kernel-stall, remote-job, cross-workspace, or independent platform supervision. CLI entry does not prove external independent admission. |
| Port Authority | Prior host map records a separate canonical validation-lock interface and explicitly distinguishes its leases from Failure Gate task single-flight. | No common installed host adapter or authority/lock-order proof; relevant Port Authority transitive contract was not read/pinned under this Piece 01 source boundary. |
| Recovery | Prior records describe exact one-shot local recoveries; no general live recovery API. | Old incident acknowledgements do not authorize current recovery, reclaim, retries, or exclusion release. Current retained state not queried. |
| Failure history | The initial installer caller outcome is `pass:false`, raw exit 4. A later separately approved operation records two consecutive `pass:true`, raw exit 0 caller results. | Preserve all three outcomes and their original references. Later passes do not overwrite the earlier failure or prove ordinary-route readiness. |
| Catalog/history | No approved baseline/comparison catalog; prior index says catalog `never_collected`. | No ignore authority or “pre-existing failure” waiver. Historical raw results are not a catalog. |
| Independent/remote callers | Existing map/index explicitly says independent callers/remote CI are not monitored by this local route. | External and transitive caller coverage **UNKNOWN**; no CI workflow run or configuration mutation. |

## Ownership and next action

- **Local approval owner:** owns any new exact plan/authority/budget request; prior local conversation approvals cannot be recycled. Do not infer a person beyond the role named in original records.
- **Local host/integration maintainer:** establish a currently permitted, bounded, read-only route for present coordinator state and actual remaining consumption before making a current authority claim.
- **Platform/task integration owner:** provide an authoritative task/plan lifecycle and approval binding if such an interface is in scope; otherwise keep platform and local IDs separate.
- **Runtime supervision/provider owner:** provide verified independent full-tree supervision, termination and capture semantics before any permitted dispatch; missing Port Authority proof remains blocked.
- **Participating writer owners:** identify and prove all real file/config/generated/dependency/schema writers and lock/isolation behavior before final-writer acceptance.
- **Task #69 verifier:** independently check this inventory against the original permitted read sources after the full Piece 01 delivery. It was pending in the primary's discovery snapshot; the later task API readback shows `#69` IN_PROGRESS. Neither lifecycle state is a local authorization or verification pass.

No remote authority, person, approval, missing caller, or absent catalog was invented. All unknowns remain explicit.
