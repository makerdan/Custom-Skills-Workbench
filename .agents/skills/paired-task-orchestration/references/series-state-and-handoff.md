# Series state, task binding, and handoff

Read completely for initialization, creation, resume, reconciliation, and
advancement. These are semantic requirements, not supplied runtime services.

## 1. Authority and baseline

Bind the project identity, exact series specification/version/digest, canonical
contract closure, user instruction authorizing planning or conditional drafting,
and task scope. Keep immutable baseline contents or verified immutable references;
a mutable path is not a pinned specification.

User instructions authorizing future draft creation are scoped permission, not
permission for task approval, tests, repair without the stated scope, infrastructure
installation, recurring scheduling, or altered policy. Record exact conditions.

Treat changes to pieces, contracts, validation/repair obligations, approval modes,
or specification as changes needing reconciliation and applicable renewed scope.
Do not silently rebase current tasks on a new attachment or self-modified backlog.

These controls protect requirements and governing plans, not routine programming.
Normal programming within approved boundaries is the default. Selecting among
unspecified equivalent methods is not itself a protected-plan amendment; it needs
no separate approval, per-choice record, or routine method-change ledger.
Changes to fixed requirements, acceptance/coverage, scope, authority, execution
permissions, limits, or material safety/privacy/compatibility/data-integrity/
ownership/recovery/completion boundaries use the applicable escalation route.
Actual protected-payload changes still require authorized amendment and readback.
Preserve required approval, execution, incident, provenance, and acceptance
evidence; changed relevant inputs still invalidate affected prior evidence.

Optional source preparation with missing future installed definitions uses the
authorized specification/package exception only. Source-dependent checks stay
pending until the actual canonical destination/resource closure is available.

## 2. Durable records

Reuse host equivalents. The following layout is optional guidance, not a mandated
schema, architecture, work-family checklist, or additional acceptance gate.
Required identity, authority, delivery, and acceptance bindings remain mandatory;
equivalent records may establish them without these literal field names:

```text
series:
  schemaVersion
  verifiedProjectIdentity
  seriesIdentity
  specificationReference + version + digest
  canonicalSourceManifestReference
  preparationAuthorizationReference + scope
  orchestrationRevision + lifecycle
  currentPieceKey
  lastAcceptedPieceKey + acceptanceReference
  backlogReference + orderedPieceKeys
  checkpointLocation + writer/coordination mapping
  hookCapabilityReference + enabledState
  unresolvedWrites/conflicts

piece:
  pieceKey + generation
  declaredDeliveryStage + prerequisiteEvidence
  expectedOutcomeContract + requiredEvidence + taskAcceptanceMapping
  primaryReference + finalizedPlanRevision/digest
  verifierReference + finalizedPayloadRevision/digest
  primaryCreationBinding + verifierDuplicateBinding
  actualDependency + verifiedDeliveryReadiness
  testedImplementation/contract/environment bindings
  acceptanceReportReference + assessment
  pendingRepair + retainedIncidents
  nextAction + responsibleRole
```

The backlog/checkpoint is an orchestration locator, not an authoritative task,
approval, allocator, validation, or run registry. Native/project-local records and
original evidence remain authoritative.

Temporary plan payloads may originate in `.local/` under the entry point's narrow
local-only/required-path exception. They may be the only copy while drafting, but
are not durable series state or authority. Before execution or acceptance relies
on a plan, require complete authoritative persistence and readback through the
approved durable task-record or tracked repository route. A contract-required
tracked copy, backlog, checkpoint, manifest, report, and other repository
deliverables retain their tracked-location and delivery gates. Missing transfer
blocks the affected handoff or dependent claim, not honest draft preparation.

A tracked file checkpoint can support serialized invocation-driven planning,
with documented writer/atomic publication and interrupted-write handling. It
does not coordinate independent clones, isolated task branches, or callbacks.
Concurrent automatic advancement requires a real shared coordinator with verified
CAS/idempotency/exclusion appropriate to the host; no JSON read-modify-write loop
or branch-local lock is called global coordination.

Do not store live database binaries in task branches or merge them as authoritative
state. Record safe durable store/access mappings outside `.local/`, with actual
persistence boundaries and responsible roles. Exclude secrets/private context.

## 3. States and transitions

Use equivalent host states with these semantics:

| State | Meaning / permitted action |
|---|---|
| UNBOUND | Resolve target and specification; no task creation |
| BACKLOG_READY | Complete scoped plans known; earliest pair may be prepared |
| PAIR_PREPARING | A creation intent is in progress; exclude competing preparation |
| PAIR_INCOMPLETE | One write/dependency/readback missing; reconcile same pair |
| AWAITING_USER | Pair correctly persisted as drafts; user decides approval |
| IN_PROGRESS | Actual authorized work is running; do not duplicate or advance |
| AWAITING_DELIVERY | Work exists but required accessible inputs are not proved |
| VERIFYING | Actual verifier running; do not create replacement |
| BLOCKED | Required authority/capability/evidence is missing; preserve obligation |
| RECONCILIATION_REQUIRED | Drift/duplicate/unknown write/uncertain lineage needs resolution |
| ACCEPTED | Current required stage independently accepted with current evidence |
| PAUSED | No successor drafting while paused |
| FINISHED | Every applicable piece accepted; no automatic additional work |

These are series semantics, not APIs or names to write into platform task state.
Never modify native task status to simulate these transitions.

These states describe orchestration progress, not the value of a task's findings
or output. An expected `BLOCKED`, `BLOCKING`, negative, or non-zero result can
fulfill a task when its declared acceptance criteria expect or permit that result
and the evidence and remaining criteria pass. This can apply to diagnostic,
classification, test, or other tasks. Do not infer the orchestration `BLOCKED`
state from a task's result or native status label alone; that state means an
actual required authority, capability, or evidence is missing. For implementation
work, reporting a blocker does not meet a requirement to remove it unless the
specification explicitly accepts that outcome and its follow-up route.

An unsuccessful verification remains an unresolved obligation. Use only the real
authorized retry/replan route; never blindly reopen/cancel terminal tasks. Record
explicit generations/renewals where required, preserving old identities/history.

Unaccepted cancellation, waiver, owner closure, or scope reduction does not satisfy
the old series. Record separate administrative outcome and obtain applicable
explicit changed-scope instructions before any successor preparation.

## 4. Primary and verifier creation

Use the canonical Router handoff protocol for actual Install/Apply tasks. Preserve
its full immutable baseline, normalized key, complete payload, finalization,
dependency/delivery, lifecycle, readback, and uncertainty rules.

For primary creation, record a versioned unambiguous binding of project, series
specification, piece, primary scope/draft-plan digest, and generation. Look up
existing actual tasks before creation. Do not treat a title search alone as
duplicate proof; ambiguous results block another write.

For the verifier, use Router's authoritative binding:

`[Project identity, exact target skill ID, primary namespace/ID,
  finalized primary-plan digest, canonical verification scope]`.

Series/piece/generation can be supplemental locators, not replacements for this
key. Later source availability or implementation drift does not silently change
the stable duplicate key. A genuinely changed finalized primary scope requires
explicit authorized reconciliation, not an unbound duplicate.

Task creation interfaces must support real full plans and actual dependency
references. Prefer atomic idempotency. When it is unavailable, serialize through
the actual supported coordinator, search/re-read authoritatively, and report
remaining race limitations. Do not promise global exactly-once creation.

Respect companion confirmation requirements. If one piece entails a definition
install, SKILL.md-only confirmation, and separate independent resource/application
verification, identify the extra obligation before creating cards. Recommend a
visible prerequisite/batching exception; user approval of a two-card limit does
not authorize weakening another contract.

## 5. Delivery and acceptance

At creation, reuse, execution, report acceptance, and successor preparation,
recheck the actual full primary/verifier plan revisions and complete executable
payload. Hashes in metadata, stable titles, dependencies, and terminal labels
are insufficient.

Determine what the actual dependency releases on. Task work may run in an isolated
copy; a Ready label may mean not yet merged/delivered. Require applicable delivered
snapshot/reference access and verified readiness gates in the verifier/successor
environment. Do not auto-merge to manufacture readiness.

Acceptance requires every applicable item for the declared stage, original source
and tested implementation/config/environment binding, current evidence, raw
outcomes, and independent final verification after repairs. Subject to the target
contract, missing evidence blocks dependent claims rather than all independent work.
Evaluate raw outcomes against the declared task purpose: an expected negative or
non-zero result is evidence, not automatic task failure or acceptance. A native
task status label alone likewise cannot determine acceptance.

For each acceptance item, record the declared expected/allowed outcome, actual
outcome, supporting evidence, and whether the requirement is satisfied. Preserve
raw non-zero codes and negative findings even when the task is accepted. Do not
redefine expectations after an unexpected failure or repair valid rejection
behavior merely to produce zero/PASS. A completed finding task can still expose
a genuine blocker for a later task; carry that blocker forward without falsely
blocking completion of the finding task.

This is a requirement-level acceptance record, not a ledger of implementation
choices. Shared evidence may cover multiple criteria when their mappings remain
clear and complete. The verifier assesses the approved outcomes independently;
it does not approve or reconstruct every coding decision.

Do not require future runtime proof for an expressly inert source stage, and do
not let that source-stage acceptance satisfy a runtime prerequisite. Deferred
obligations must have an explicit later owner/task/gate.

Independent review can use a genuinely available fresh verifier/subagent or host
review route within exact authorized scope. If independence is unavailable, mark
that acceptance blocked rather than relabeling self-review as independent.

## 6. Recovery and bounded reconciliation

Classify write outcomes as definitely not committed, confirmed committed, or
unknown. A timeout is not rollback. Resolve unknown primary/verifier/checkpoint
writes through trusted request IDs/idempotency or uniquely verified authoritative
bindings before retrying.

Crash after primary creation: recover its actual ref and finish the missing
verifier attachment under authority. Crash after verifier creation but before
checkpoint: reconcile actual full tasks and dependencies; do not create a new pair.
Multiple matches or inaccessible authoritative lookup remain blocked.

A cooperative retained lock, age, heartbeat, or missing callback does not prove
work stopped or resources are available. Apply the target's exact bounded recovery
requirements; do not unlink exclusion or renew budgets.

Use finite bounded reads/reconciliation and a concrete next action, not unlimited
polling. Callback attempts, periodic invocations, and new sessions cannot refill
validation or diagnostic budgets.
