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
