# Failure Gate host integration map

**Result: observations and draft map saved; budget exhausted at closeout.
Completion within the approved allowance is not established.
No implementation or activation.**

## Review authority and method

Actual approval: `failure-gate-host-integration-inventory-approval.json`,
reference `inv_1iUbbTUza9TH41U1hqn2DK7MoJ8xcgnbZ7:call_Zz0MMdKTw490XzMkwBOzP8bQ`.
Five minutes reserved before inspection, current boot
`03557306-f58c-4249-aa8d-ab861714d902`, monotonic interval
`607.294026956`–`907.294026956`. Previous grants are neither renewed nor altered.

The last clock observation was `1104.920802672`, beyond the deadline. The source
and coordinator observations were made within allowance, but exact final
documentation completion timing was not captured. This is not certified
in-budget completion. No additional review or execution follows; only this
minimal truthful stop disposition is recorded.

Bounded definition reads and explicit read-only SQLite queries only. No project
imports, CLI invocations, tests, generation, package installation, workflow
changes, registry writes, schema operations, signals or platform task mutations.
Only this review receipt, map, proposal and descriptive evidence locators changed.

This is a cooperative project-local assessment, not protected platform
attestation or a claim of repository-wide enforcement.

## Current authoritative observation

Read-only coordinator `.failure-gate/coordinator.sqlite3`:

- Namespace `d63a3d51-4dea-4a99-9e6a-d01410b7e017`.
- Governance `STAGED`; no `writer_coverage` value.
- Installed tooling
  `a8b120234a249cd00c33d056a8eeb228d72af30b503a1bf5b861620976f96977`.
- Installed policy digest
  `b6d5094e1edf7b746d6b096f4ce1f8266797ee4492893c95c70515e4d3206ee1`.
- Zero retained runs, zero `required_tier_validation` runs, zero `plan_review`
  decisions; the one local task `FG-00000001` is draft with no completion mode.

These are read observations, not new journal-health or validation runs. The
previous two complete installer passes remain the verified installation evidence.
There is no ordinary-task acceptance evidence to infer from them.

## Integration matrix

| Path / actual interface | Verified behavior | Present / missing / unknown | Required integration boundary |
| --- | --- | --- | --- |
| `scripts/failure_gate/common.py:writer_lock` | Stable `.failure-gate/writers.lock` inode, bounded queue, process-local reentry | Primitive present; isolated proof exists | All declared participating writers must use it through their actual operation and terminal handoff |
| `scripts/failure_gate/gate.py:write` | Checks active local plan, approved paths and before-digests; holds shared lock across journaled file writes | Source adapter present; no observed real ordinary use | Agent-owned source edits must use this route or a verified equivalent; direct file tools are not automatically covered |
| `gate.py:complete` | Holds writer lock through final snapshot/report checks and terminal commit; requires `writer_coverage == "verified"` | Checker present; actual coverage metadata/proof absent | A string set by fixtures is not live proof; coverage needs actual participant evidence and scoped approval |
| `gate.py:approve_plan` / `activate` | Exact plan review requires `sys.stdin.isatty()` and human-entered digest phrase; activation requires ACTIVE plus exact stored decision | Terminal route present; zero real review decisions; no inspected non-TTY approval bridge | Use real terminal review or separately discover/approve a genuine captured-decision interface; never fabricate review by driving a pseudo-terminal |
| `scripts/failure_gate/cli.py` | Parses finite operations and imports Gate; no call to the outer supervisor in its entry path; cutover/reclaim explicitly denied | Callable inner interface present; ordinary bounded entry admission unverified | Registered authority plus independent finite startup/admission/execution/capture must surround the actual operation, not just its later test child |
| Root `package.json` typecheck/test | Existing command strings run Regression Guard before typecheck/package tests | Coverage preserved; bare independent launches not monitored by the gate | Preserve independent caller authority and invocation compatibility; explicit task launches need checked routing |
| `scripts/check-regression-guard.mjs` | `--fix-stub` can `writeFileSync` selected Markdown; default discovery uses Git or explicit `TASK_PLAN_FILE` | Real writer present; no gate lock in inspected source | Include this writer in plan and validation graphs; do not treat the root commands as purely read-only |
| `lib/api-spec/package.json:codegen` | `orval --config ./orval.config.ts && pnpm -w run typecheck:libs` | Actual direct writer + nested validation; no gate/lease wrapper in the inspected alias | Generation and readers need one reconciled conflict protocol and explicit transitive budget/authority |
| `lib/api-spec/orval.config.ts` | Reads OpenAPI, emits `lib/api-client-react/src/generated` and `lib/api-zod/src/generated`; both targets have `clean:true` | Generated write/delete destinations verified | Cover deletes as well as writes; lock/readback must span the operation; preserve the subsequent library typecheck |
| `scripts/post-merge.sh` / configured setup path | Frozen pnpm install then `pnpm --filter db push` | Concrete dependency/schema writer; gate participation unverified | Do not invoke for validation proof. Dependency/merge coordination and DB mutation need distinct real authorizations |
| `.agents/skills/port-authority/scripts/validation-lock.mjs` | Separate named v2 leases; source explicitly says not Failure Gate task single-flight; IPC watchdog and finite settings exist | Canonical capability present, not proof of project caller wiring | Never count canonical availability or a handoff table as an installed host adapter; reconcile authority/lock order before combining |
| Editor, direct agent tools, merge/checkout, other platform writers | Not covered by the inspected Gate.write implementation merely because they change files | Participation unknown/unverified | Define which actual writers cooperate or a genuinely bound immutable accepted state; hashes cannot detect reverted mid-run edits |
| Protected reclaim / external providers | Existing CLI denies before signals; no new provider inspection performed | Project denies; protected external capability availability not newly verified | Keep distinct and blocked for this scope; do not infer runtime disruption permission from installer passes |
| Independent verifier / platform plan integration | No platform adapter or verifier task created in this review | Previously documented gap remains | Existing platform task labels are not local IDs or approval; any new task/mapping needs its own authorized route |

## Task 74 documentary readback: coverage and supervision

This section records a documentary readback on 2026-10-06 of the retained host map, caller inventory, installation proposal, capability locator, bootstrap report, and canonical Failure Gate contract. It is not a fresh live host read or proof that the named participant list is exhaustive.

The sources identify the following writer classes: Regression Guard task-plan writes; package-manager lockfile deletion and dependency installation; database schema push; deployment package-store pruning; Orval generated-output cleanup and writes; possible `tsc --build` and recursive build outputs; editor/direct Agent writes; checkout/merge; and remote or otherwise external callers. The API codegen targets are explicitly identified as `lib/api-client-react/src/generated` and `lib/api-zod/src/generated`. The complete build-output path set and the actual live editor, Agent, merge, and external caller instances are not identified. Owner roles are the corresponding script/validation, package/setup, database/schema, deployment, API codegen/build, editor/Agent, merge/checkout, and remote-provider owners; no individual owner identity is asserted.

Only the Gate writer primitive and isolated fixtures are evidenced using `.failure-gate/writers.lock`. No retained source shows every identified writer, including deletion/setup paths, participating in that lock or an equivalent immutable accepted-state boundary. Consequently the participant set is incomplete, `writer_coverage` remains unset, and final-writer acceptance remains **BLOCKED**.

The retained bootstrap report confirms an independent `supervisor.run`/watchdog path only for its exact health callers. Its single 900-second boot-bound grant was consumed. Those two callers finished naturally, reported owned work stopped, were acknowledged, and had complete indexed capture; the bootstrap fixture record also covers bounded output and termination cases. The recorded historic limits and health evidence do not bind ordinary task work. The ordinary CLI entry has no outer supervisor call, and no current ordinary finite budget, independent admission, whole-tree stop/cancellation/escalation, supervisor-loss handling, or capture acknowledgement was established. These ordinary host proofs are **UNKNOWN/BLOCKED**. Port Authority remains a separate named-lock capability with no established common host adapter or lock-order proof.

No live coordinator or process state, workflow, external service, or current caller was queried for this readback. No validation command, check, or runtime operation was run. Do not use this section to infer ACTIVE/INACTIVE governance, current remaining budget, complete writer coverage, or ordinary runtime readiness.


## Task 78 source-level participant expansion — 2026-10-06

This read-only source pass expands the minimum list in the Task 74 readback. Sources were the tracked package/setup/build/configuration files and writer implementations named below, plus the configured-workflow snapshot supplied for this task. No project command, build, code generation, package installation, schema push, Failure Gate runtime/CLI invocation or coordinator-store access, workflow control, or external query was performed. Source presence establishes a possible caller and effect, not a live run or a complete host inventory.

| Participant and call chain | Confirmed source effect / target | Gate or accepted-state participation |
| --- | --- | --- |
| `Gate.write` → `writer_lock`; `Gate.complete` → same `writer_lock` | `scripts/failure_gate/gate.py` holds the lock around approved-path writes and across final snapshot/evidence checks plus local terminal commit. `scripts/failure_gate/common.py` opens the stable `.failure-gate/writers.lock` inode. | Source participation is demonstrated for these Gate entry points only. No ordinary live caller was observed; `writer_coverage` remains unset, and this local lock does not cover any other writer by implication. |
| Root Regression Guard → typecheck/test/build | Root `package.json` reaches `scripts/check-regression-guard.mjs --fix-stub`; that mode writes a task-plan file directly. All three root commands can reach this mutating mode, including recursive `build` through `typecheck`. | No Gate lock or accepted-state handoff is present on this route. |
| Orval → cleanup/generated writes → nested library typecheck | `lib/api-spec/package.json` calls Orval and then `pnpm -w run typecheck:libs`; `lib/api-spec/orval.config.ts` cleans and regenerates `lib/api-client-react/src/generated` and `lib/api-zod/src/generated`. `typecheck:libs` runs `tsc --build`, which emits referenced library `dist` outputs. | No common Gate admission/lock spans the cleanup, generated writes, nested typecheck, and final handoff. |
| Root and artifact builds | Root `build` runs typecheck plus recursive workspace builds. Root recursive typechecking runs `scripts` typecheck, which emits to `scripts/dist`. `artifacts/api-server/build.mjs` removes `artifacts/api-server/dist` and esbuild writes it again. Skills Workbench and Canvas Vite build configs use empty output directories (`artifacts/skills-workbench/dist/public` and `artifacts/mockup-sandbox/dist`). TypeScript project builds also emit library `dist` and may update incremental metadata. | Deletes and writes are outside the Gate writer route. No shared accepted snapshot or lock is shown across nested actions. |
| Configured API Server workflow | The supplied workflow snapshot starts `pnpm --filter @workspace/api-server run dev`; its package script runs `build` before server start, causing the API `dist` removal/rebuild. | Workflow configuration is known from the supplied snapshot; current serving/execution was not queried. No Gate lock/handoff integration is evidenced. |
| Configured Canvas workflow | The supplied workflow snapshot starts the Canvas Vite dev server. `artifacts/mockup-sandbox/mockupPreviewPlugin.ts` writes `src/.generated/mockup-components.ts` on build start and rescans after watched mockup-file add/remove events. | This is a concrete development-workflow source writer. No Gate lock or terminal-handoff participation is evidenced; the workflow was not run or inspected. |
| Configured Skills Workbench workflow | The supplied workflow snapshot starts its Vite dev server. Its config identifies the build output directory; no project-authored dev generation was found in the inspected config. Tool/plugin cache activity was not exhaustively inventoried. | No Gate integration is shown. Do not treat a bounded source search as proof that framework/tool cache writers do not exist. |
| Install, post-merge, and schema | Root `preinstall` deletes non-pnpm lockfiles; configured `scripts/post-merge.sh` runs frozen pnpm install and `pnpm --filter db push`; the DB package maps `push` to Drizzle schema push. | No common Gate lock, immutable DB/source snapshot, or final-handoff binding is shown. The route was not invoked. |
| Deployment post-build | `.replit` configures `pnpm store prune` under `deployment.postBuild`, mutating package-store state outside the source tree. | No Gate coordination is evidenced; deployment was not triggered or queried. |
| Workspace-skill projection utility | `scripts/src/workspace-skill-sync.mjs` contains a refresh/load path that stages, replaces, and removes `.agents/skills/.workspace-projections` content under its own lock and recovery journal. The configured root command found is `workspace-skill:status`; no configured refresh caller was found. | Its lock is separate from Failure Gate and does not cover Gate completion. Whether a host tool invokes the exported refresh/load path is unknown. |
| Application file I/O | Audio conversion uses temporary input/output files under the OS temp directory and removes them in `finally`. Image editing has an optional caller-supplied `outputPath`; no invoking application route was found in the inspected source search, and path containment is not fixed by the helper. | The audio temp path is not a source-tree writer by destination. Image caller/destination remain unknown; if an invocation can target the workspace, Gate participation is unproven. |
| Editor/Agent, checkout/merge, external and remote callers | Repository sources do not expose the actual editor/Agent file-tool, workspace checkout/merge, other-workspace, or external provider participants. No tracked CI workflow file was found in the checked workflow paths; remote settings, hidden/unpublished jobs, other branches/workspaces and host event routes were not queried. | No common lock or immutable accepted-state boundary is evidenced. These participants remain UNKNOWN/BLOCKED, not absent. |

## Evidence links and source scope

Inspected the named project sources and canonical Failure Gate implementation
contract; searched the actual scripts/lib/artifacts/configuration locations for
shared lock consumers. In that scope, only Failure Gate code/tests referenced its
writer coverage/inode; generation remained a direct alias. This is not a claim
about unpublished branches, inaccessible workspaces or unobserved remote callers.

Port Authority's canonical module was read, not copied or edited. Its documented
named locks are independent, not a hierarchy: a same-looking resource name cannot
substitute for verified shared authority or a common inode.

The provided task snapshot already lists generation/validation coordination and
host-runtime authorization work. It may be stale. No platform mutation or live
task retrieval was performed, so this review neither declares those tasks
delivered nor duplicates them. The inspected current code, not their labels,
is the integration evidence.

<a id="port-authority-contract-comparison"></a>

## Port Authority contract comparison — 2026-10-06

**Result: local source comparison complete; source-owner authorization and current
host-capability evidence remain BLOCKED. No services, stores, or runtime state
were queried, and no Port Authority script was invoked.**

The read-only route used was the workspace's `.agents/skills/port-authority/`
source tree. These bindings identify the exact local bytes inspected; they do
not independently authenticate an upstream publisher, source-owner approval,
deployed copy, or host behavior.

| Binding | Local source and content binding |
| --- | --- |
| `PA-SKILL` | `.agents/skills/port-authority/SKILL.md`, SHA-256 `da160d1c6e044676b7f624633afd9797d5eab0a59fcfd2ef67f0eb817c87919e` |
| `PA-RC` | `.agents/skills/port-authority/reference/runtime-contract.md`, SHA-256 `70f62c4e066422df14a1ff05548138eb5f275dc16714356e411e540f625227b2` |
| `PA-LOCK` | `.agents/skills/port-authority/scripts/validation-lock.mjs`, SHA-256 `d819f38df10b914751471066e36239d843cdbfd3aaa5540563047f9ca49797bb` |
| `PA-HOST` | `.agents/skills/port-authority/scripts/host-capabilities.mjs`, SHA-256 `cde66e139ecbb541f168edf34adbf6583369fd14e6c0590b9f67716fc0514061` |

| Claim area | Canonical contract/source binding | Comparison with this map | Assessment |
| --- | --- | --- | --- |
| Lock identity and order | `PA-RC:427-469` | The contract requires every conflicting caller to use the same canonical lock path, or to acquire all overlapping resources in a globally consistent order. `global` is an independent resource, not a hierarchy; a same-named lock at a different path does not coordinate. The existing map's row 60 correctly says the named Port Authority leases are separate from Failure Gate task single-flight and requires lock-order reconciliation. No complete caller-to-resource map, common lock identity, or cross-system acquisition order is verified here. | **BLOCKED** for any claim that current project callers are mutually serialized or have a safe combined order. |
| Lease lifecycle and recovery | `PA-RC:491-515,528-547`; `PA-LOCK:235-254,419-435,563-576` | The contract requires `recoveryRequired` before dispatch, clears it only during verified healthy release, disallows age/heartbeat takeover, and limits dead-owner recovery to compatible finalized leases with no surviving work. Error/uncertain states retain exclusion for separately authorized recovery. The source implements these local lease checks, but the integration map row 60 does not establish that project callers use them; these leases also do not provide Failure Gate authorization, evidence acceptance, or task single-flight. | **Source-level contract/code only.** No project wiring or host recovery acceptance is established. |
| Protected reclaim and host attestation | `PA-RC:8-23,228-273,290-355`; `PA-HOST:1-25` | The contract assigns runtime attestation to a trusted host and exact approval/claim/recheck/outcome to Failure Gate. The code-owned adapter is deliberately unconfigured: both exported calls throw unavailable errors. This agrees with map row 62 and the capability record's blocked/unknown external-provider status. | **BLOCKED.** No actual host attestation, protected approval provider, checked reclaim route, or outcome evidence was provided or queried. |

No separate responsible-source-owner authorization or authenticated read-only
locator for current host-capability evidence was supplied in the task context or
found in the reviewed project documents. Local file reads and SHA-256 bindings
are not that authorization or evidence. Therefore the task's authorization /
host-evidence gate is **NOT MET**; do not infer an installed host adapter,
verified lock ordering, lease acceptance, or live reclaim from these source
findings. Keep dependent claims blocked until the responsible owner supplies
the explicit authorization and authentic read-only route.


### Authorization intake disposition — 2026-10-06

**Result: BLOCKED preserved; authorization and current host-evidence intake
remain unmet. This is a documentary disposition, not host acceptance.**

In response to the explicit authorization/locator request, the user stated:
“I cannot supply a genuine live-operation grant or verified approval locator.”
The user also reported an Authorization Status & Evidence Locators document
covering canonical contract ranges, a verification summary, two isolated-test
exports and checksum manifests. The reported logs are fixture evidence only,
marked `hostActivationEvidence:false`; the user explicitly stated that they do
not establish owner authorization or live-host acceptance.

The document was offered for attachment, but no actual attachment, exact path,
revision, authenticated evidence locator or authority reference was supplied in
this response. No matching document was located in the workspace's attachment
and documentation file listings. Its contents, exports and checksums were not
read or independently verified; the fixture classification above is the user's
report, not a new test result. No returned upstream source revision or authority
can therefore be bound to the comparison.

The four existing `PA-SKILL`, `PA-RC`, `PA-LOCK` and `PA-HOST` workspace hashes
were rechecked and match the comparison table above. These remain local-byte
bindings only. A missing live-operation grant is distinct from the required
source-owner read authorization: neither that read authorization nor an
authenticated current host-evidence route has been established.

No services, stores or runtime state were queried. No scripts, tests, builds,
workflow operations, signals, provider calls or activation were performed.
Host attestation, protected reclaim and dependent acceptance remain **BLOCKED**.
Next intake requires the responsible source owner's explicit read-only
authorization, authentic document/export locators for the current canonical
contract and host evidence, their revision/content bindings and a verifiable
authority reference. A fixture export or checksum manifest alone cannot meet
that gate. This intake grants no live operation.

## Implementation order and stop conditions

1. **Define the controlled caller/writer scope and approval intake.** Specify real
   local plan review and bounded finite entry admission. Do not enable ACTIVE
   because installed fixtures or bootstrap callers passed.
2. **Stage the admission/participant contract under separately approved source
   scope.** Use current coordinator/supervisor, not a competing registry or copied
   Port Authority implementation. Keep coverage unverified and main governance
   STAGED until actual acceptance.
3. **Reconcile generation and validation with the existing work.** Include Orval
   cleanup, emitted source, library typecheck and Regression Guard plan writes.
   Preserve complete existing coverage and approve any changed command graph.
4. **Verify participating writers and real local-plan lifecycle.** Source review,
   isolated lock models or toggling metadata cannot prove live participation.
   Test accepted-state binding through terminal commit under authorized limits.
5. **Propose cutover only after prerequisites.** Protected reclaim, platform task
   integration and independent verification are separate; unknown capabilities
   remain unknown, not waived.

The next proposed source scope is
`failure-gate-staged-admission-proposal.md`. It does not promise that a CLI
adapter alone can cover platform editors/merges or activate ordinary governance.

## Follow-up: non-terminal plan-approval source discovery

**Source discovery: BLOCKED. Adapter implementation: NOT IMPLEMENTED.
Operational verification: NOT RUN. Ordinary activation remains STAGED.**

The current workspace surface was checked for an explicit, reviewable plan
approval action and a way to retrieve the exact approved contents:

- The available task-assignment/update/completion surface does not provide a
  plan-approval event reference, an authoritative approved-plan snapshot, or a
  mapping from that snapshot to one local Failure Gate task ID and namespace.
  This task assignment and its plan text are not approval evidence.
- Replit documentation search for a supported Agent plan-approval API, webhook,
  or event source returned no relevant documentation. This is not a claim that
  no such platform capability exists elsewhere; none is exposed or verified in
  this workspace.
- The workspace reports no configured integrations. No trusted approval
  connector or provider is available here.
- The inspected project route remains `Gate.approve_plan`: it requires an
  interactive terminal and the exact digest phrase. No non-terminal adapter
  was found in the project source or configuration.

The exact missing capability is a trusted source that exposes the real approval
action and stable evidence for the exact approved plan contents/version/digest,
then supports verification of its binding to one local ID/namespace, registered
tier and definition, parameters, policy version, and authorization version.
Without that evidence, status, labels, command approval, merge/apply events,
caller-written receipts, and copied task text remain insufficient.

No adapter, external approval service, credentials, approval receipt, or
activation was created. Existing interactive terminal review was not changed.
Isolated rejection cases were added for stale plan contents, a decision attached
to another local task, mismatched tier/policy data, unregistered decision kinds,
and task-status/lifecycle-only signals. These fixtures are source-level test
coverage only: they were not executed and cannot prove a host approval source.
No current finite approved route for this changed Failure Gate source was
verified, so validation and real operational verification remain blocked.


## Task 79 source-level ordinary supervision audit — 2026-10-06

The focused source bindings and full disposition are recorded in
`failure-gate-ordinary-supervision-proof.md`. This was a source/retained-document
review only; no live coordinator, process, workflow, external service, or
ordinary caller was queried, and no check or runtime operation was run.

The CLI's ordinary `run` operation calls `Gate.required_run` without an
independent outer supervisor at that entry. The checked local path invokes
`supervisor.run` per validation step. In that function, the watchdog reports its
matching registration, the parent records the event, and only then releases the
worker's pipe gate. This confirms a source-level registration-before-worker
handshake for that implementation path, not independent host admission of all
ordinary callers.

The code and tracked policy define finite limit values, and the cooperative
watchdog source contains cancellation, escalation, owned-process tracking,
bounded capture, and result-acknowledgement paths. No current ordinary-operation
authority, independent host supervisor, effective budget/remaining-consumption
readback, or real stop/loss/capture acknowledgement is available. Those required
host proofs remain **UNKNOWN / BLOCKED**; ordinary execution remains blocked.
This source-level finding does not establish any Port Authority lock, lease, or
reclaim property.
### Task 78 disposition

This expansion identifies actual source-level routes, nested actions, destructive cleanup, and configured workflows; it does not establish which ran, the exhaustive set of host writers, or end-to-end participation through handoff. Only the Gate's own cooperative entry points are shown using `.failure-gate/writers.lock`; the projection utility uses a different lock. No writer set has been proved to share one effective lock or immutable accepted-state boundary with `Gate.complete`. Keep `writer_coverage` unset, final-writer acceptance **BLOCKED**, and ordinary cutover **NOT APPROVED**. Host/editor/Agent/checkout/merge/external evidence and any actual workflow participation must come from an authorized, independently reviewable source; no inference from hashes or command configuration substitutes for it.
## Task 81 — intended cleanup-control caller review (2026-10-06)

**Result: protected reclaim is applicable to the intended Port Authority
process-cleanup control, but no application caller is wired in the checked-in
project sources. The control remains BLOCKED. This is not a live host review.**

### Read-only source boundary

Reviewed the named Port Authority skill and runtime contract, the canonical
`free-ports.mjs`, `validation-lock.mjs`, and `host-capabilities.mjs` sources, and
the project caller/configuration paths in root and artifact package manifests,
`.replit`, artifact service manifests, `scripts/`, `lib/`, and `artifacts/`.
Searched the tracked source/configuration tree for Port Authority cleanup
invocations, aliases, process-signal paths, startup hooks and cleanup callers.
Generated output, dependency trees, attached archives, services, stores and
runtime state were not queried. No project command, test, script, service or
workflow was invoked.

### Intended controls and observed project callers

| Control / source caller | Protected reclaim required? | Source-only finding |
| --- | --- | --- |
| `.agents/skills/port-authority/scripts/free-ports.mjs`, action mode (`--authorized-cleanup`) | **Yes.** Before signals it requires independent host attestation, a checked Failure Gate `runtime.process-reclaim` claim, fresh per-signal authorization, ownership checks and acknowledged outcome recording. | This is the canonical intended process-cleanup control under the Port Authority skill. No application package alias, startup hook, workflow command or project script caller was found. The action invocations in `.agents/skills/port-authority/tests/hardening.test.mjs` are isolated test fixtures with a fixture host adapter; they are not a deployed caller and were not run. Applicability to the intended control is affirmative; no live use is claimed. |
| `.agents/skills/port-authority/scripts/free-ports.mjs`, dry-run/inventory mode | **No signal/reclaim claim.** | The source returns a non-success protected/skipped result without sending signals. Inventory is only an observation and does not establish host identity, authorization or a reservation. No application caller was found. |
| `.agents/skills/port-authority/scripts/validation-lock.mjs` lease-owned child shutdown | **No protected reclaim of unrelated runtime processes.** | Its cleanup is for the command tree owned by its local lease, not port-holder takeover. No project alias, hook or startup caller was found. Any future use still needs its own authorized finite supervision, caller/conflict map and host acceptance; the template's presence does not prove wiring. |
| Failure Gate `supervisor.py` / `watchdog.py` owned-work cleanup | **No protected Port Authority reclaim.** | The inspected path stops exact already-owned validation child incarnations; unknown escaped/adopted work retains exclusion. This is Failure Gate's own-work supervision boundary, not permission to reclaim another listener or process. Its validation supervision and acceptance are separate from this reclaim-applicability review. |
| API Server `startAbandonedSkillUploadCleanup()` startup caller | **No.** | `artifacts/api-server/src/index.ts` starts periodic cleanup after `app.listen`; `skillUploadCleanup.ts` removes expired unreferenced upload objects. It does not discover or signal processes or reclaim ports. |

The inspected root/package commands, artifact service commands, `.replit`
post-merge path and deployment post-build command contain no `free-ports`
invocation. The API Server's `dev` command builds and starts its server; its
production service starts the built server. Neither path calls Port Authority
cleanup. This inventory is bounded to checked-in local source and does not
establish the absence of unpublished, remote, external or future callers.

### Applicability and disposition

The intended installation scope includes the Port Authority action-mode cleanup
control, so protected reclaim is **applicable**, even though no project
application caller is currently wired. Do not mark P17 not applicable based on
the absent caller wiring or unavailable providers. This conclusion establishes
control applicability only; it does not establish an installed or deployed
caller.

The local `host-capabilities.mjs` still throws unavailable for both trusted host
attestation and Failure Gate reclaim authorization. No independently verified
host source, protected approval/claim route, or authoritative Port Authority
outcome acknowledgement was supplied or established by this read-only review.
Accordingly, the intended action-mode control remains **BLOCKED**; no
`NON_RECLAIM_VERIFIED` or `LIVE_RECLAIM_ENABLED` status is claimed. Task 80's
separate owner-approved host-evidence gate remains unresolved. No services,
stores or runtime state were queried, and no signal or cleanup operation was
performed.

## Task 87 — source-level writer lock wiring

**Observation:** 2026-10-06. This section records source changes only. No
writer, build, code generator, workflow, coordinator store, or validation
command was invoked to prove runtime participation. The local Gate remains
STAGED; `writer_coverage` is still unset, and this cooperative wiring is not
host-level or exhaustive writer coverage.

| In-scope writer and nested action | Current configured path | Shared-lock scope |
| --- | --- | --- |
| Regression Guard `--fix-stub` plan write | `scripts/check-regression-guard.mjs` routes workspace writes through `scripts/failure_gate/run_writer.py --write-stdin`; the helper checks the before-digest while holding the Gate lock. External plan files retain the existing direct-write behavior because they are outside this workspace snapshot. | Each workspace plan update takes `.failure-gate/writers.lock`; a concurrent content change is rejected rather than overwritten. |
| Orval generated API outputs | `lib/api-spec/package.json:codegen` calls `run_codegen.py`. That helper holds the Gate lock over Orval (`clean:true` deletion and regeneration of both generated targets) and the nested `tsc --build` over project references. | Cleanup, generation, and the nested library build are one lock interval on the same `writers.lock` inode used by `Gate.complete`. |
| Root TypeScript project builds | Root `typecheck:libs` uses `run_writer.py` around `tsc --build`; referenced `dist` declarations and incremental metadata are within that command's lock interval. | The standalone script remains callable; the process returns the underlying command's exit status. |
| Recursive TypeScript checks with incremental metadata | `scripts`, Skills Workbench, Canvas, and API Server `typecheck` package scripts call `run_writer.py`; API Server's nested `api-zod` build also uses the same helper. `--noEmit` checks can still write TypeScript build-info files due to inherited incremental settings. | Each emitting or build-info-producing TypeScript command takes the same lock. |
| API Server build output | Its package `build` command wraps `node ./build.mjs` with `run_writer.py`. The existing build removes `artifacts/api-server/dist` recursively before esbuild writes the replacement. API Server `dev` reaches this same wrapped build before start. | The delete and replacement build are held together under the Gate lock. |
| API Server test bundle lifecycle | Its `test` package command wraps `node ./test/run-tests.mjs`; the runner creates `.api-server-test-*` beneath the package, bundles the test entry, executes it, then removes the temporary directory in `finally`. | Temporary bundle creation, nested test run, and cleanup are held under the Gate lock. |
| Skills Workbench and Canvas Vite build outputs | Both package `build` scripts wrap `vite build`; their configured `emptyOutDir:true` cleanup and subsequent output writes execute under the helper. | Each whole Vite build/cleanup action uses the Gate lock. |
| Canvas preview generator and watcher actions | `mockupPreviewPlugin.ts` runs the new `generateMockupComponents.mjs` worker. In dev/serve mode the Python writer helper holds the lock while the worker discovers files, creates `.generated` if needed, compares, and writes the generated module. The mockup input directory creation is also routed through the helper. In build mode, the package build wrapper already holds the same lock. `add`, `unlink`, and 404-triggered rescans all reach this refresh path. | Dev refreshes hold the lock across discovery and output replacement; build refresh participates in the enclosing Vite build lock. |

The callers retain their package-script entry points and original operations;
lock acquisition failures are explicit and bounded to the existing 30-second
writer queue. Source wiring now covers the listed project-owned paths only.
Correction to the earlier Task 78 wording: `scripts` typecheck uses
`tsc -p tsconfig.json --noEmit`, so it does not emit JavaScript into
`scripts/dist`; the inherited `incremental:true` setting can still write build
metadata, which is why this check now participates in the lock.
Direct ad hoc tool invocations that bypass package scripts, Vite/framework
internal cache writers, editor/Agent writes, checkout/merge, package install,
post-merge schema changes, deployment pruning, and remote/external callers are
not thereby covered. No immutable accepted snapshot or external participant
adapter was added. Keep final-writer acceptance **BLOCKED** and do not set
`writer_coverage` until the complete participant boundary is independently
established and separately approved.
