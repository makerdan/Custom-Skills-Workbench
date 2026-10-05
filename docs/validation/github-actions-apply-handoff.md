# GitHub Actions installation

## Scope and evidence

**Outcome: BLOCKED before workflow creation or validation.** No GitHub Actions
workflow was added, no local validation command was launched, and no remote
GitHub setting or workflow was changed. Task 41's runtime-safety handoff is now
available in this checkout, but it confirms that the required validation
authority and finite-supervision gates remain unknown. It also records an
unresolved shared-generated-output boundary. The current GitHub `main` branch
does not yet contain this checkout's three local commits.

Read-only snapshot and repository evidence, collected 2026-10-05:

| Evidence | Observation |
| --- | --- |
| GitHub repository | `makerdan/Custom-Skills-Workbench`, repository ID `1405130810`, public (`private: false`), default branch `main`. Public REST API returned `main` at `86f601bc840246980b734f9ff459c7dd73dd6048`. |
| Local checkout | `main` at `e72a39015388f2f139d624df90b105b191f740e9`, clean before this documentation change, three commits ahead of the locally recorded `origin/main` at `86f601bc840246980b734f9ff459c7dd73dd6048`. No fetch, push, pull, or branch update was performed. |
| Existing GitHub Actions/provider files | No tracked workflow/provider configuration was found in the local tree or the visible GitHub `main` tree. The GitHub contents request for `.github/workflows` returned HTTP 404. This is evidence for those inspected snapshots, not a claim about every inaccessible GitHub setting. |
| GitHub Actions runs | Public Actions API returned `total_count: 0` on the inspection date. No workflow run was triggered. |
| Branch protection and Actions permissions | Read-only GitHub REST requests returned HTTP 401 for the `main` branch-protection and Actions-permissions endpoints. Both remain **unknown**, not absent or disabled. |
| Package manager and runtime | `pnpm-lock.yaml` uses lockfile v9; local tool versions observed were Node `v24.13.0` and pnpm `10.26.1`. `.replit` declares Node.js 24. `.npmrc` disables auto-install peers and non-strict peer checks. `pnpm install --frozen-lockfile` is the intended clean install mode; it was not run. |
| Local validation policy and Task 41 | `docs/validation/port-authority-apply-handoff.md` and `docs/validation/app-support-runtime-safety-apply-handoff.md` report Failure Gate as **UNKNOWN**, no checked task/plan validation route, no approved finite queue/execution/cleanup/capture/cumulative budgets, and no verified whole-process-tree supervisor. The handoffs report missing explicit Node test and hook timeouts. |
| Workflow budget | Task 41 observed three managed Replit service workflows but no authoritative workspace workflow limit or remaining capacity. GitHub Actions permission/configuration evidence is also unavailable. No capacity value is inferred. |
| Generated outputs | Task 41 identified shared API-generated client/Zod outputs read by typecheck/build/test callers and reported no approved serialization route. `lib/api-spec` codegen writes those files and then invokes `typecheck:libs`. Canvas's Vite build generates `artifacts/mockup-sandbox/src/.generated/mockup-components.ts`. Neither generation nor freshness check was run. |

Read-only inspection included `git status`, revision/tree inspection, tracked
manifest and provider-file searches, package-script/config searches, the public
GitHub repository/branch/tree/Actions APIs, and the two policy endpoint
requests. These observations are inventory, not validation evidence. No
secrets, database, model credentials, or production services were accessed.

The applicable prerequisite is not satisfied. Specifically:

- Task 41's handoff is present locally, but its findings do not establish an
  authorized finite validation route; the report explicitly records the gate
  as blocked.
- Task 41's latest handoff is not in GitHub `main` at the observed remote
  revision. No push or sync is authorized here.
- Finite queue, execution, cleanup, evidence-capture, and cumulative budgets,
  plus independent whole-process-tree supervision, remain unavailable.
- Scripts/API/Workbench Node test and hook limits are not explicitly bounded.
  The API test runner's child `spawnSync` also has no configured timeout.
- The shared API-generated outputs still lack an approved common lock/order
  covering their writers and readers. Task 19 remains proposed; Tasks 43 and
  44 remain proposals and do not grant execution or serialization authority.
- The Replit workflow limit/headroom is unknown. Do not add a Replit workflow or
  infer a GitHub runner budget to fill that gap.

The responsible next owner is the **Replit host/task-validation integration
owner**, who must expose authoritative Failure Gate ACTIVE/INACTIVE status
(or a verified equivalent host policy), the exact approved route/tier, finite
budgets, whole-tree supervision, and required Node test/hook limits. The
validation integration owner and workspace build maintainer must also resolve
the API generated-output caller boundary before an authorized CI implementation
can run generation and consumers safely.

## Changed files

- `docs/validation/github-actions-apply-handoff.md` — records this blocked
  inventory, decisions, evidence, and the uncompleted next actions.

No `.github/workflows/ci.yml` was created. No package script, application
behavior, generated output, local validation contract, GitHub configuration,
secret, variable, branch rule, runner label, or remote workflow state was
changed. No existing provider was removed; no provider configuration was found
in the inspected trees.

## Local-to-remote coverage

There is currently no remote workflow/job, so all rows below have **no remote
coverage**. The commands are the local checks specified by the task plan; they
were not executed because the required authorized route and budgets are
unavailable. The job/event entries describe only the deferred target contract,
not an installed workflow or active check.

| Canonical local check or surface | Exact planned command / generated-file check | Current remote equivalent and event scope | Decision and evidence |
| --- | --- | --- | --- |
| Root typecheck, including Regression Guard and workspace library/artifact/script typechecks | `pnpm run typecheck` | None. Deferred candidate: stable aggregate `CI / Validate` for `pull_request`, `push` to `main`, and `merge_group`. | Portable, but not routed because the authorized execution gate is unknown. No result. |
| Scripts test suite | `pnpm --filter @workspace/scripts run test` | None; same deferred candidate event scope only. | Portable Node tests; no explicit test/hook limits or verified outer supervisor. No result. |
| API Server and Skills Workbench test suites | `pnpm --filter @workspace/api-server --filter @workspace/skills-workbench run test` | None; same deferred candidate event scope only. | Portable tests use mocks per the inspected harness/handoff. No database or model credential is planned. API child-process timeout and Node test/hook bounds remain unresolved. No result. |
| API Server production build | `pnpm --filter @workspace/api-server run build` | None; same deferred candidate event scope only. | Portable build; not launched. |
| Skills Workbench production build at its artifact path | `PORT=23687 BASE_PATH=/ pnpm --filter @workspace/skills-workbench run build` | None; same deferred candidate event scope only. | Artifact values are from its artifact configuration. Not launched. |
| Canvas production build at its artifact path | `PORT=8081 BASE_PATH=/__mockup pnpm --filter @workspace/mockup-sandbox run build` | None; same deferred candidate event scope only. | Artifact values are from its artifact configuration. Build-generated component index freshness must be checked afterward. Not launched. |
| API OpenAPI generated client/Zod freshness | In an isolated CI checkout, run `pnpm --filter @workspace/api-spec run codegen`, then `git diff --exit-code -- lib/api-client-react/src/generated lib/api-zod/src/generated`. | None; no workflow or consumer ordering exists. | Required portable check, but **blocked** until an approved finite route and safe writer/reader ordering are established. Codegen runs its library typecheck after generation; this does not protect independent readers. No generation or diff was run. |
| Canvas generated component-index freshness | After the Canvas build, `git diff --exit-code -- artifacts/mockup-sandbox/src/.generated/mockup-components.ts`. | None; would be part of the same deferred candidate job, after build. | Required portable freshness check. Not run; no build occurred. |
| Workflow YAML format/parse check | `pnpm exec prettier --check .github/workflows/ci.yml` | Not applicable: the workflow file was deliberately not created. | Not run. A future workflow needs syntax/format validation through an authorized route. |
| Task-plan Regression Guard | Included in `pnpm run typecheck`; the script's default discovery uses tracked Markdown files. `.local/` is ignored by `.gitignore`, so Replit task plans and task-board lifecycle data are not checked out by GitHub. | No remote equivalent for current `.local` plans; do not treat `.local` or task status as GitHub input. | Local-only boundary. Root Regression Guard execution itself was blocked with typecheck; no remote task-plan validation is claimed. |
| Browser/E2E, live database/service, deployment, and production checks | No command in the task's validation set. | None. No service/database was configured for a workflow. | No browser/E2E test framework configuration or package target was found in the inspected manifests/tree. Tests use mocks; live DB, deployment, and production operations are excluded. No additional check is claimed absent beyond the inspected scope. |
| Formatting/lint, accessibility/visual, performance, dependency/security/license scans, and release/package publishing | No canonical command was found in the inspected workspace package scripts/config inventory for this task. | None. | No equivalent workflow was inspected. Broader policy/coverage remains unknown; these were not added as new validation or represented as passing. |

Root `pnpm run test` composes the Regression Guard, scripts tests, API Server
tests, and Workbench tests, but the exact package commands above remain visible
as the planned coverage. The root build was not used because artifact-specific
`PORT` and `BASE_PATH` values differ; the two Vite builds must each use their
own verified artifact configuration.

## Event scopes and security

No event is currently configured or active. The deferred workflow contract,
if re-authorized after the blockers are resolved, is:

- `pull_request` for proposed changes;
- `push` only to `main`;
- `merge_group` for merge-queue validation;
- no schedule or manual dispatch in the requested scope.

The candidate stable job name is `CI / Validate`; this is not a required check
and no branch policy was changed. No path filters, matrix fan-out, privileged
`pull_request_target`, or cancellation behavior was added. No GitHub action
pins were selected because no workflow was created; any future third-party
actions must use verified immutable commit pins for trusted official actions.

No credentials or secrets are required for the described mocked tests/builds.
No secrets, production credentials, database credentials, or model credentials
were passed to a workflow. No action token permissions were set because there
is no workflow. The deferred least-privilege target is workflow/job
`contents: read` only.

The desired runner/toolchain from the task plan is GitHub-hosted Ubuntu 24.04,
Node 24.13.0, pnpm 10.26.1, and frozen lockfile installation. Local Node and
pnpm versions were observed as listed above, but no GitHub runner, install,
cache, timeout, or process-tree behavior was tested. A future workflow may
cache dependency data keyed to the lockfile, OS/architecture, and pinned
toolchain only; it must not cache build outputs, mutable workspace state, or
secrets. No measured/approved finite job timeout is available, so none is
invented here.

## Exclusions, gaps, and duplicate decisions

- **Blocked, not intentionally waived:** all portable tests, typechecks,
  builds, and generated-file freshness checks listed above await the host
  integration owner and safe generated-output resolution. Tasks 43 and 44 are
  proposals only; neither is an authorization or an already-delivered control.
- **No generated-file guard was added locally:** API codegen and its typecheck
  share generated outputs with existing consumers. Do not create a shared
  local lock or duplicate Task 19's proposed freshness guard as part of this
  blocked installation.
- **Task-local data is not CI input:** `.local/` is gitignored. GitHub checkout
  does not establish Replit plan approval, task state, Failure Gate authority,
  or a local validation baseline.
- **No service, database, browser, or model secrets:** the inspected tests use
  mocks; no live service or database is needed for the listed unit tests.
  No browser suite was found in the inspected project configuration. Live
  deployment/production validation is outside this task.
- **No existing CI provider cutover:** no provider configuration was found in
  the inspected local or remote `main` trees. Nothing was removed or replaced.
- **Workflow budget remains unknown:** Task 41 found three running Replit
  service workflows but no authoritative workspace capacity. This is not
  grounds to invent a limit or alter services.
- **Remote activation and policy remain unknown:** the public API reported
  zero Actions runs, while branch-protection and Actions-permission reads
  returned 401. No run, pass, required check, or merge protection is claimed.
- **Security and policy inventory limits:** no policy endpoint was available
  for branch protection or Actions permissions, and no workflow exists to
  inspect action pins, job permissions, timeouts, or cache behavior.

## Validation results

**Task validation: BLOCKED before dispatch.** Task 41's current handoff and the
canonical Failure Gate/Port Authority instructions do not establish an
authorized route, approved tier, finite budgets, independent whole-process
tree supervision, or finite Node test/hook limits. The task plan explicitly
prohibits direct commands or substituting a shell timeout in this situation.
No test, typecheck, build, codegen, prettier check, YAML parser, or workflow
restart was launched. There are no local validation exit codes or accepted
current-snapshot results.

Exact required commands and status:

| Command | Raw outcome |
| --- | --- |
| `pnpm run typecheck` | **NOT RUN — BLOCKED before dispatch.** |
| `pnpm --filter @workspace/scripts run test` | **NOT RUN — BLOCKED before dispatch.** |
| `pnpm --filter @workspace/api-server --filter @workspace/skills-workbench run test` | **NOT RUN — BLOCKED before dispatch.** |
| `pnpm --filter @workspace/api-server run build` | **NOT RUN — BLOCKED before dispatch.** |
| `PORT=23687 BASE_PATH=/ pnpm --filter @workspace/skills-workbench run build` | **NOT RUN — BLOCKED before dispatch.** |
| `PORT=8081 BASE_PATH=/__mockup pnpm --filter @workspace/mockup-sandbox run build` | **NOT RUN — BLOCKED before dispatch.** |
| `pnpm --filter @workspace/api-spec run codegen` | **NOT RUN — BLOCKED before dispatch; shared output boundary also unresolved.** |
| `git diff --exit-code -- lib/api-client-react/src/generated lib/api-zod/src/generated` | **NOT RUN — codegen was not run.** |
| `git diff --exit-code -- artifacts/mockup-sandbox/src/.generated/mockup-components.ts` | **NOT RUN — Canvas build was not run.** |
| `pnpm exec prettier --check .github/workflows/ci.yml` | **NOT RUN — workflow file was not created.** |

GitHub's public Actions API returned zero runs for the observed repository
snapshot. That is remote inventory evidence only; there is no PR revision,
event, workflow, job, attempt, or result to report. Remote status is not
passing. GitHub policy is unknown.

## Remaining manual GitHub settings

No GitHub setting can be safely changed or verified from this task. Before
using GitHub Actions for merge protection, the repository owner must:

1. Ensure the intended workflow is present on GitHub `main` through the
   repository's separately authorized review/publish process. This task did
   not push the three local commits or open a PR.
2. Check that GitHub Actions are enabled and review the repository Actions
   permissions. The API returned 401, so current configuration is unknown.
3. After an authorized workflow has run for the intended revision and event
   and every required step is verified, configure the applicable branch
   protection/ruleset to require the stable `CI / Validate` check. Include the
   merge queue if it is enabled. The current branch policy could not be read
   and was not changed.
4. Independently verify the exact revision, event, workflow, stable job,
   attempt, and result, then separately verify the ruleset/branch policy
   requires that check. Workflow-file presence alone proves none of these.

Non-destructive review checklist:

- [ ] Host/task-validation authority, route, tier, finite budgets, and
      whole-tree supervision are verified.
- [ ] Node test and hook limits are explicit and supported; API child-process
      supervision is bounded.
- [ ] Shared API generated-output readers/writers have an approved safe order.
- [ ] Local-to-remote coverage and every intentional local-only boundary are
      reviewed.
- [ ] PR jobs are least-privilege and use no secrets or privileged PR event.
- [ ] GitHub-hosted OS/runtime/tool versions, immutable action pins, cache
      boundaries, and finite timeout have evidence.
- [ ] Workflow syntax and exact commands are validated through the authorized
      route.
- [ ] Exact revision/event/job results and GitHub policy are verified
      separately before calling the check active, passing, or required.

## Rollback and follow-up actions

No workflow or GitHub setting was added, so this task has nothing to roll back.
For a future authorized installation, first inspect branch protection/rulesets
for references to `CI / Validate`. If any policy requires that check, an
authorized repository owner must remove or replace that requirement and verify
the policy change before a reviewed change disables/removes
`.github/workflows/ci.yml`. Do not delete the workflow first and leave a
required check permanently pending. Preserve any existing provider until an
authorized cutover is verified.

**Next owner/action:** the Replit host/task-validation integration owner must
publish an authoritative policy/route and finite whole-tree budgets, including
Node test/hook limits. The validation integration owner and workspace build
maintainer must resolve the shared API generated-output boundary. Then
reassess this blocked installation against the current local and GitHub
revisions; do not reuse this handoff as proof of later activation or validation.

**GitHub settings changes, pushing/syncing the checkout, opening a PR, and
triggering/rerunning/cancelling remote workflows were not authorized and were
not performed.**
