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
