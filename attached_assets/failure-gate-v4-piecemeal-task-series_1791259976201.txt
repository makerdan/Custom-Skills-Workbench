# Failure Gate v4: piecemeal implementation and verification task series

## What this delivers

Eighteen dependency-ordered pieces, each with an implementation task followed by a separate verification-and-repair task: 36 proposed tasks.

This is a written task series, not an installation, approval, validation result, or set of created platform tasks. No target project has been selected. Bind it to the intended project in Piece 01; do not assume a project, previous task IDs, commands, budgets, stack, or approval interface.

Labels such as `FG-03-I` and `FG-03-V` are planning labels only. Replace them with actual host task references if these tasks are subsequently created. Platform task IDs and Failure Gate project-local authorization IDs remain different identities.

Authoritative implementation requirements come exclusively from the canonical `.agents/skills/failure-gate-v4/` package, including its linked references. The canonical `.agents/skills/skill-application-router/` package supplies verification/handoff requirements. Do not substitute alternate skill definitions or runtime mirrors.

## Execution order

Default sequence:

`FG-01-I → FG-01-V → FG-02-I → FG-02-V → … → FG-18-I → FG-18-V`

Each verifier depends on the delivered output of its implementation task. Each subsequent implementation task depends on accepted verification of the preceding piece's **declared stage**, not merely a Done label.

The first four pieces deliver source, records, designs, and inert adapters. Their verifiers can accept that expressly limited source-delivery stage through permitted readback; they cannot declare runtime behavior verified. Piece 05 must prove the applicable runtime requirements from Pieces 02–04 before later runtime-dependent work can proceed. This avoids a circular bootstrap dependency without disguising untested code as operational enforcement.

Where an applicable approved route already permits safe validation, perform the authorized checks rather than unnecessarily postponing them. Inert-only permission never permits imports, syntax checks, tests, builds, store initialization, service wiring, or signals.

Ordinary-task cutover is reserved for Piece 18. Runtime reclaim is a separate, conditional capability in Piece 17. Neither source delivery nor successful bootstrap execution activates ordinary tasks.

| Piece | Implementation task | Following verification-and-repair task | Deliverable stage |
|---|---|---|---|
| 01 | Bind project, canonical contract, and installation scope | Verify discovery and obligation coverage; repair omissions | Planning/discovery |
| 02 | Stage bootstrap authority, budget, and dispatch adapters | Verify exact scope, real authority mappings, and inert boundaries | Source/proposal |
| 03 | Stage transactional coordinator, allocator, and lifecycle foundation | Verify schemas, transactions, and non-reuse implementation | Source |
| 04 | Stage independent supervision and bounded capture | Verify supervision wiring and dispatch-denial paths | Source |
| 05 | Establish safely admitted bootstrap runtime proof | Verify real bootstrap acceptance; repair and re-prove | Bootstrap runtime |
| 06 | Install tier registry, scaffold, guards, and planning discovery | Verify coverage and pre-activation planning behavior | Bootstrap runtime |
| 07 | Install approval binding, activation, and authorization changes | Verify decision sources and atomic lifecycle behavior | Bootstrap runtime |
| 08 | Install input/configuration preflight, snapshots, and result parsing | Verify real input integrity and complete raw results | Bootstrap runtime |
| 09 | Install checked execution, transitive guards, and resource coordination | Verify one-tier dispatch, single-flight, and child lifetimes | Bootstrap runtime |
| 10 | Install execution telemetry and automatic read-only lookup | Verify persistent file trail, coverage, and investigations | Bootstrap runtime |
| 11 | Install bounded diagnostic and comparison capabilities | Verify three-retry rules, accounting, and scope separation | Bootstrap runtime |
| 12 | Install failure classification, baseline matching, and ownership | Verify provenance, acceptance exceptions, and repair obligations | Bootstrap runtime |
| 13 | Install final-writer coordination and local validated completion | Verify installed final-writer race and completion checks | Bootstrap runtime |
| 14 | Install owner-directed administrative closure and readers | Verify independent closure semantics and retained failures | Bootstrap runtime |
| 15 | Install allocator backup/restore and retained-error recovery | Verify actual isolated restoration and exact recovery handling | Bootstrap runtime |
| 16 | Install evidence health, retention, export, and visibility | Verify all eight evidence/recovery capabilities | Bootstrap runtime |
| 17 | Implement separately gated runtime reclaim where applicable | Verify protected reclaim; repair or retain an explicit block | Conditional scoped runtime |
| 18 | Complete caller acceptance and authorized ordinary-route cutover | Independently verify the whole installation; repair remaining gaps | Ordinary-route acceptance |

## Shared task contract — include in every actual task

These instructions are part of **all 36 task payloads**. Do not create tasks containing only the short titles below. When materializing tasks, combine this shared contract with the relevant piece's specific payload.

### Binding, owner, inputs, and outputs

- Owner: implementation agent for `-I`; a fresh verification context for `-V`. Record actual host role mappings. Do not invent a person, service, or platform adapter.
- Bind the verified project identity, repository root, current canonical source/reference manifest, approved scope, actual primary task reference, finalized plan revision/digest, delivered implementation snapshot, and relevant configuration/environment.
- Choose actual tracked plan/report paths from the host's established layout in Piece 01. The paths in this document are not installed interfaces. All durable deliverables and persistent telemetry must be outside `.local/`.
- Retain clause-to-evidence records, applicable source paths/sections, implementation paths, actual tests/records, raw outcomes, and an explicitly named responsible role and next action for every gap.
- Keep canonical skill availability/parity, project-local enforcement, and platform task lifecycle as separate evidence tracks. Instruction installation is not enforcement implementation.

### Authorization and validation

- Verify governing policy as ACTIVE, INACTIVE, or UNKNOWN. ACTIVE uses the existing checked route; INACTIVE uses independently verified existing host policy and equivalent bounds; UNKNOWN blocks dependent execution. Invalid explicit checked requests never fall back.
- Initial installation uses a separately approved bootstrap operation and the actual existing safe route. Replacement of an active gate uses its prior verified checked route for the selected bootstrap tier only, with ordinary tasks blocked until the approved cutover.
- Resolve actual finite queue, step, startup, test, hook, teardown, cancellation, termination/verification, capture, parent/session, attempt, and applicable resource limits from a real independently approved source. Do not invent approved numbers or use remembered defaults.
- Require independent supervision of the complete permitted process/job tree, bounded input reads and streaming capture, durable original accounting, reserved cleanup time, and truthful lifecycle outcomes. Tool timeout, a same-event-loop timer, or an agent-written flag does not establish those guarantees.
- Pin the permitted transitive graph: argv, working directories, wrappers, hooks, discovery/configuration branches, workers, schedulers, and remote targets. Unknown expansion blocks dispatch.
- Run only the selected approved tier or an explicitly authorized bounded non-tier capability. No all-tier sweep, reconstructed second tier, arbitrary command passthrough, gratuitous retry, or reset of budgets.
- A verifier's permission to repair implementation gaps does not grant approval of governing policy changes, budget increases, recovery, disruption, activation, cutover, remote CI, merge, or deployment.

### Required sections when writing each host plan

**Pre-existing failures to ignore:** None assumed. Populate only from observed, applicable evidence and authorized exact ignores. Distinguish an ignored baseline from an owned repair. Unrelated failures are not repair scope.

**Regression Guard:** For each material behavior/contract change, state the existing behavior or risk, the proving check, and post-change verification through the affected installed boundary. Preserve independent callers, coverage, reports, serialization, resource/writer safety, privacy, and raw failures. Pure source/planning tasks should explain the narrower protection needed; do not fabricate runtime results.

**Validation:** State the actual applicable route, registered tier or separately approved capability, reason for coverage, exact commands/targets and transitive scope, real approval/decision bindings, effective limits and remaining consumption, safe environment, and evidence destinations. If execution is not authorized, say **readback-only / execution not authorized**; do not quietly run a check.

### Every verification task is audit-first, then scoped repair

1. Re-read its full task payload, primary plan, actual delivered files, canonical closure, and prerequisites. A primary's success statement is not evidence.
2. Compare every applicable requirement assigned to the piece against actual code, wiring, records, and the piece's declared delivery stage.
3. Publish the gap list **before** editing. Distinguish missing implementation, incorrect implementation, missing execution proof, and unavailable external authority.
4. Build or correct missing/wrong parts **in this verification task**, within the explicitly approved piece scope. No separate routine repair task is needed. Preserve unrelated files and the canonical obligation baseline.
5. Rebind the repaired snapshot and affected plan/authorization where required. Renew affected checks through the real approved route; old evidence cannot prove repaired inputs.
6. Perform a final independent readback after the repair. The actor that wrote a repair cannot make its own statement the only acceptance evidence. Use a fresh verifier context or actually available independent host review for the affected checks; do not recursively create verifier tasks.
7. Report requirement statuses as `verified`, `failed`, `blocked`, or justified `not applicable`. Report fixtures separately as PASSED/FAILED/BLOCKED/NOT_RUN, and runtime/control readiness separately.

A source-only task may be accepted only for its declared inert/source deliverable, with runtime obligations explicitly carried to Piece 05. A runtime task cannot pass with missing required execution evidence. Missing authority is not an installation omission an agent may fix by self-approval.

At a genuine blocker, continue independent permitted work and prepare the exact next scoped proposal: current bindings/source closure, actual route and capability owner, commands/transitive scope, finite limits/consumption, safe admission, acceptance, and exclusions. Do not stop at a routine checkpoint when approved implementation or checks remain feasible.

## Piece 01 — Project binding, contract extraction, and installation scope

### FG-01-I — Discover and bind the actual host

**Input/dependency:** Intended project must be explicitly resolved before substantive project reads or any target writes. No preceding implementation.

**Implement:**
- Inspect canonical instructions and Failure Gate package/reference closure. Pin immutable snapshots/digests; traverse reference cycles once.
- Inventory languages/runtimes, real validation commands and callers, existing governance and coverage, task/plan formats, transactional persistence, actual approval sources, completion writer, locks, supervisor/provider capabilities, and recovery.
- Build a clause-by-clause requirement ledger from the core skill and all applicable implementation/acceptance references. Assign every obligation and acceptance case to one of the 18 pieces, including relevant acceptance cases in multiple pieces where integration spans them.
- Publish the capability manifest and initial tracked evidence index, using real safe locations/access procedures and explicit present/missing/unavailable states.
- Bind report destinations, roles, stage gates, and the scope allowed for subsequent source staging and runtime work. Map optional history/catalog absence without inventing authority.

**Acceptance:** Verified host identity; immutable canonical baseline; complete obligation allocation; actual host capability/approval inventory; preserved existing coverage; explicit source-stage versus runtime permissions. An unresolved capability is recorded, not falsely marked ready.

**Evidence:** Discovery report, source manifest, requirement ledger, capability manifest, evidence index, prior-policy/caller inventory, and installation proposal.

### FG-01-V — Verify discovery and repair missing records

Independently inspect the target and canonical closure. Check every inventory claim, tracked destination, requirement allocation, role, and ACTIVE/INACTIVE/UNKNOWN assessment. Repair missing or inaccurate discovery documents and mappings within scope. Do not implement runtime enforcement yet.

**Exit:** The planning/discovery deliverable is complete and factual. Any unresolved capability has a named integration role, next action, and dependent runtime gate.

**Definition-install exception:** This series implements the contract; it does not implicitly authorize rewriting or copying `SKILL.md`. If the target lacks the canonical package, use only an authorized original specification/package and expected `.agents` destination. Add a separately authorized definition-install task, immediately followed by a **SKILL.md-only confirmation-and-correction task** whose criteria match that install task. Verify referenced resources separately in this piece. Do not substitute mirrors or claim a missing source was verified. If this prerequisite cannot be supplied, block source-dependent work.

## Piece 02 — Bootstrap authority and finite-budget contract

### FG-02-I — Stage real bootstrap admission and budget bindings

**Input/dependency:** FG-01-V; actual existing governance and approval routes.

**Implement:**
- Discover and verify an applicable existing bootstrap/maintenance approval. If absent, prepare a concrete scoped proposal under the prior governance; capture only actual approval through a supported route.
- Stage the adapter/schema for exact operation, canonical source closure, plan/version, selected tier or named bounded capability, parameters, transitive allowlist, safety constraints, and decision evidence.
- Define complete finite phase/parent/attempt limits and authoritative source/version mappings; validate host-safe representations, aggregates, narrowing, cleanup reserve, and revocation.
- Establish distinct bootstrap, ordinary activation, diagnostic, recovery, reclaim, and cutover authority domains. No domain borrows another's grant.
- Preserve independent callers and the prior governing route. Stage inert code only where that is the authorized scope.

**Acceptance:** A complete, implementable admission/budget design and inert adapter, with real routes distinguished from unavailable ones. No invented approval or execution.

**Evidence:** Scoped bootstrap proposal/actual decision when available, adapter source, schemas, effective-limit contract, deny cases, and permission boundary.

### FG-02-V — Verify authority mappings and repair unsafe admission

Trace bindings back to actual approval/policy sources. Reject caller flags, guessed events, unverified plan labels, command approval mistaken for plan approval, or implicit larger budgets. Repair missing adapter checks and documents. Inspect source denial paths without executing unapproved work.

**Exit:** Source/proposal stage verified. Missing authentic approval or independent budget authority remains an execution blocker for Piece 05.

## Piece 03 — Transactional identity and coordinator foundation

### FG-03-I — Stage allocator, authoritative records, and durable coordination

**Input/dependency:** FG-02-V.

**Implement:**
- Use storage suited to the actual host's concurrency and persistence; stage schema/migrations outside `.local/`. Do not assume a mutable committed JSON file or branch-local database coordinates workspaces.
- Allocate IDs transactionally in one verified namespace; expose only committed reservations; retain permanent tombstones and uniqueness checks/import handling.
- Implement one authoritative task row, draft/active/terminal states, versioned plan/decision bindings, CAS/idempotency, audit-with-mutation transactions, and interrupted-projection suspension.
- Add bootstrap operation records, intent/run identities, monotonic cumulative accounting lineage, atomic attempt reservations, single-flight/resource ownership primitives, and crash/uncertain-outcome records.
- Initialize `recoveryRequired:true` at applicable reservation and permit false only on verified healthy finalization; legacy missing fields retain exclusion.
- Stage invariants/test cases for restart, cancellation, duplicate operations, audit-write failure, stale versions, namespaces, and non-reuse.

**Acceptance:** Complete inert source/schema foundation, not a claim that a live store has been initialized or restoration proved.

**Evidence:** Source/migrations, schema/invariant matrix, actual storage mapping, planned isolated acceptance cases.

### FG-03-V — Verify coordinator source and repair gaps

Read the actual implementation rather than only schema descriptions. Check transaction boundaries, constraints, histories, denial defaults, tombstones, permanent consumption, and absence of competing permission lists. Repair incomplete source and migrations. Perform executable checks only if already safely authorized.

**Exit:** Source-delivery stage accepted; required runtime allocator/coordinator proof is assigned to FG-05-V, with actual restore proof retained for FG-15-V.

## Piece 04 — Independent supervision and bounded capture

### FG-04-I — Stage workload gate and whole-tree supervision

**Input/dependency:** FG-03-V; verified candidate host containment/supervision boundary.

**Implement:**
- Integrate the real external supervisor/job provider, independent of the supervised event loop. Do not substitute a mock supervisor or same-process timer.
- Journal the private workload-gate identity and require independent registration acknowledgement before user dispatch; failed registration denies work.
- Bind original monotonic remaining deadlines and phase/attempt lineage; retain reserved cancellation, termination, verification, and evidence time.
- Track exact owned process/job incarnations and children, including permitted remote targets; handle owner stall/death, original-group timeout, watchdog loss, and newly observed descendants.
- Bound pre-dispatch reads and combined stdout/stderr collection during streaming/spooling. Validate typed stop/report/storage acknowledgements.
- Preserve exclusion and original partial evidence on unknown termination, capture overflow, or post-spawn journal failure; cleanup already owned work within its grant without depending on a healthy journal.
- Keep source staging separate from live listener cleanup/reclaim.

**Acceptance:** Source is ready for a safely admitted first proof. Missing real independent containment blocks that proof; it does not justify an uncontained hang experiment.

**Evidence:** Source/adapters, verified provider semantics, registration/termination protocol, budget/capture deny matrix, remaining blockers.

### FG-04-V — Verify supervision source and repair wiring gaps

Trace the complete execution graph and gate ordering. Check unsupported escape/remote termination claims, synchronous-blocking vulnerabilities, registration-before-dispatch, finite hook/test settings, and late-zero handling. Correct missing code/wiring within staging scope.

**Exit:** Inert supervision implementation verified by readback. Operational readiness is explicitly unproved until Piece 05.

## Piece 05 — Safely admitted bootstrap runtime proof

### FG-05-I — Establish bootstrap execution without enabling ordinary work

**Input/dependency:** FG-04-V plus actual scoped execution approval, finite limits, conflict exclusion, and independent safe containment.

**Implement/execute:**
- Pin the current source and exact first-proof proposal; obtain applicable approval through the discovered route if not already covered.
- Under the existing approved safe carrier, first prove registration/admission and containment using deliberately controlled isolated fixtures. Do not require the unperformed proof to have passed before proposing it.
- Initialize and exercise the actual host coordinator only within authorization. Prove unique committed allocation, transaction/audit rollback, idempotency, accounting, and safe retained states from Piece 03.
- Prove installed supervision from Piece 04 against permitted async/synchronous stalls, hook/setup/teardown hangs, owned children, owner loss, watchdog loss, capture failure, malformed acknowledgements, and deadline breaches.
- Record expected injected failure separately from failed acceptance. Preserve raw outcomes, consumption, uncertain lifecycle, and exclusions.
- Before claiming an enabled bootstrap control/caller ready, retain two consecutive real authorized caller runs through that installed route, under explicitly approved repetitions and limits. Initial containment fixtures alone do not satisfy this claim.
- Register only the proved bootstrap route. Do not activate the ordinary-task route.

**Acceptance:** Applicable bootstrap coordinator, admission, budgets, containment, and evidence behavior have actual host proof. Fixtures are labeled fixtures. Missing capability/approval or failed acceptance blocks readiness.

**Evidence:** Actual operation/decision references, effective limits, real host reports, raw exits, termination/registration evidence, records, snapshot binding, retained incidents.

### FG-05-V — Verify bootstrap proof and build missing runtime pieces

Independently inspect real storage, route wiring, raw reports, and supervisor evidence from Pieces 02–04. Reproduce only approved bounded cases on the installed route. Repair missing implementation, invalidate affected reports, and re-prove within current authority/budgets.

**Exit:** Bootstrap runtime readiness accepted with no ordinary activation. If proof is unavailable, leave the affected requirement blocked and prepare the exact integration/approval proposal.

## Piece 06 — Tier registry and pre-activation planning

### FG-06-I — Implement registry, scaffold, guards, and baseline discovery

**Input/dependency:** FG-05-V; bootstrap authority remains applicable.

**Implement:**
- Map existing real checks to a single approved registry; preserve coverage, commands, reports, timeouts, resource locks, and shared composition. Do not fabricate standard tier names.
- Pin argv, roots, required steps/dependencies, parameters/environment/configuration sources, reports, discovery expectations, diagnostics, limits, transitive manifests, and canonical definition digests.
- Implement scaffold and plan guards on a reserved draft through a separate bounded planning capability; reject absent/multiple/unknown/uncovered tiers and conflicting identities.
- Implement registered pre-edit baseline discovery where risk policy requires it, without activating a task or satisfying completion.
- Preserve required plan semantics: identity, exact ignores versus owned repairs, task-local observations, validation, and material regression protection.
- Where only real manual checks exist, record approved scope/reviewer/evidence and label manual validation honestly.

**Acceptance:** Registry and planning interfaces actually work before activation, retain all existing obligations, and cannot dispatch arbitrary tiers.

**Evidence:** Registry/version, plans, scaffold/guard reports, bounded discovery records and snapshots, definition/coverage mapping.

### FG-06-V — Verify planning and repair registry/guard omissions

Check each registered definition against actual command graphs, config inputs, discovery, and reports. Use isolated instrumented denial cases for unassigned tiers. Verify pre-activation guards do not depend on active-task authorization and cannot create a pass.

**Exit:** Real planning behavior and source coverage accepted. Unsupported required checks stay blocked; no all-tier live sweep.

## Piece 07 — Approval, activation, and authorized changes

### FG-07-I — Implement exact-bound activation and atomic amendment

**Input/dependency:** FG-06-V; verified real approval/decision source.

**Implement:**
- Capture/retrieve actual explicit plan approval or a configured human decision; pin approved contents and bind one local ID, plan/version/digest, single tier/definition, parameters, policy, and authorization version.
- For a verified Replit plan-approval event, do not impose actor identity or a reviewer roster. Other identity-based routes pin applicable reviewer authority.
- Discover/reuse an applicable once-approved deterministic policy. If absent, propose exact eligibility/selection/budgets/changes for owner approval; do not self-approve.
- Record a fresh bound decision per matching activation/amendment without demanding repeated human policy approval. Changed/unmatched bindings require applicable approval or block.
- Implement atomic state/audit/plan projection, derived per-tier statuses, pending changes, coverage-driven suspension, CAS/idempotency, cancellation, and safe run reconciliation.
- Prevent terminal reopening, stale approvals, audit-failure mutations, and concurrent second assignments.

**Acceptance:** Genuine approval-driven activation and changes work on safe bootstrap subjects; ordinary-route cutover remains pending.

**Evidence:** Real decision-source records, pinned contents, policy versions, transaction histories, denial/race reports.

### FG-07-V — Verify authority and repair lifecycle gaps

Test genuine available decision ingestion and negative fixtures for forged flags, wrong IDs, drifted plans/tiers/policies, status/command/merge pseudo-approvals, absent actors on valid Replit events, duplicate amendments, and interrupted projections. Inspect actual atomic records.

**Exit:** Exact decision/lifecycle behavior accepted. Unavailable trusted approval adapters remain blocked, not replaced with placeholders.

## Piece 08 — Configuration, snapshots, and raw result integrity

### FG-08-I — Implement preflight, actual input manifests, and parsers

**Input/dependency:** FG-07-V.

**Implement:**
- Resolve every required command input from verified configuration/deployment sources. Validate availability/shape/applicability before launch and redact secret contents everywhere, including digests.
- Preserve fixed project ports. For required dynamic listeners, use verified reservation/handoff within the allowed range; a released free-port probe is insufficient. Build-only embedded ports/base paths use stable verified build targets, not invented listener settings/defaults.
- Capture actual executed tracked/untracked/generated inputs, dependencies/runtime identity, fixtures, configuration, migration and external-state identity. Explicitly exclude reports/logs where justified.
- Use immutable isolation or effective writer coordination; unknown mid-run integrity rejects evidence. Authorization and run snapshots remain separate.
- Parse each real report/step/discovery count/raw exit. Record not-reached steps and preserve nonzero outcomes, crashes, missing reports, cancelled tests, and unexpected zero-test results.

**Acceptance:** Valid config reaches the intended command; invalid inputs prevent that launch. Snapshots describe executed content and parsers cannot manufacture completeness or PASS.

**Evidence:** Input declarations/source identities, isolated manifest records, actual report fixtures and host reports, raw outcomes, safe port lifecycle evidence where applicable.

### FG-08-V — Verify input/result boundaries and repair missing adapters

Exercise approved config/snapshot/report cases through installed interfaces. Check secret redaction, malformed inputs, stable targets, conflicting config, dependency/generated changes, report omissions, and mutation during execution. Repair missing preflight or parsers and rebind affected evidence.

**Exit:** Every required mapped input/result adapter is verified or explicitly blocked. No false build-run claim when preflight stopped it.

## Piece 09 — Checked execution, transitive scope, and concurrency

### FG-09-I — Implement the checked runner and dispatch guards

**Input/dependency:** FG-08-V; bootstrap supervisor/coordinator and policy integration available.

**Implement:**
- Resolve exact supplied local task/namespace and approved plan through native arguments/local interface; optional file/environment adapters cannot select authority or downgrade rejection.
- Resolve one authorized tier from the record. Check active/unsuspended state, versions/digests, parameters, current approval, recovery, configuration, scope, and limits before dispatch.
- Constrain wrappers/hooks/nested branches/workers/schedulers/remote jobs against the pinned graph before affected launches. Delegates inherit exact bindings, scope, budgets, reports, and owned lifetimes.
- Integrate atomic top-level single-flight across required, diagnostic, comparison, and additional purposes; duplicates return the active identity or use the bounded reject/queue policy.
- Revalidate queued requests; use cross-task shared-resource guards and verified port reservations, bounded waits, stable ownership, and deadlock-safe ordering.
- Approved parallel substeps inherit the parent slot, not a second exclusive acquisition. Child lifetime uncertainty prevents release/replacement.
- All checked entry points delegate to this route; shared independent check commands remain unchanged and cannot become checked evidence.

**Acceptance:** Exactly authorized execution occurs through the installed runner; all mismatched/expanded checked requests launch nothing. Whole-tree bounded supervision and complete raw results remain mandatory.

**Evidence:** Real checked bootstrap-subject run, dispatch/lease/intent records, actual command graph, concurrent/race fixtures, raw child/step reports.

### FG-09-V — Verify dispatch and repair runner/coordination gaps

Prove intended single-tier execution, non-environment plan input, conflicting/stale/wrong-plan rejection without fallback, concurrent duplicate handling, queued revocation, shared-resource exclusion, transitive expansion denial, and child-safe cancellation. Use instrumented fixtures rather than launching unauthorized tiers to prove denial.

**Exit:** Checked runner accepted for its bootstrap integration scope; ordinary route is still not cut over.

## Piece 10 — Durable execution telemetry and automatic lookup

### FG-10-I — Implement monitoring, file trail, and bounded queries

**Input/dependency:** FG-09-V. Extend existing bootstrap journaling rather than installing a competing authority.

**Implement:**
- Map actual monitor hooks, coverage/health, persistent file path/segments, query access, schema, and blind spots into the manifest/index.
- Persist decision/slot/lease/intent and required file events before managed dispatch; distinguish requests/denials/intents from confirmed starts and verified finishes.
- Record stable event IDs, initiator source/confidence, parent, scope, authority versions, declared reason, guard/reason codes, reliable timing/liveness, raw references, and unknowns.
- Implement safe concurrent writes, flush policy, rotation/discovery, permissions, bounded sanitized fields, traversal/symlink guards, and retention references.
- Fail closed on required pre-launch monitoring failure; post-spawn gaps retain ownership/evidence and require reconciliation, not an invented finish.
- Automatically discover/query indexed logs and original sources for overlap questions without requiring the user to supply a path; no tests, cleanup, policy mutations, or auto-created repair tasks.

**Acceptance:** Installed telemetry truthfully identifies actual launches and uncertainty, survives applicable host boundaries, and supports scoped read-only investigations.

**Evidence:** Actual files/segments and restart/durability observations, query reports, concurrent/corrupt-tail cases, source references and coverage gaps.

### FG-10-V — Verify telemetry and repair missing monitor/query wiring

Inspect real events against actual launches, crash windows, failed recording, rotation, duplicate event views, missing/corrupt logs, and incomplete finish evidence. Verify automatic lookup and distinction among unauthorized different-tier execution, duplicate top-level runs, independent overlap, and approved intra-run parallelism.

**Exit:** Required managed telemetry/durability/query capabilities are evidenced. Missing durable storage or coverage is not called healthy or tamper-proof.

## Piece 11 — Bounded diagnostics and provenance comparisons

### FG-11-I — Implement subordinate auxiliary capabilities

**Input/dependency:** FG-10-V.

**Implement:**
- Register real diagnostic retries, isolated earlier-snapshot comparisons, equivalent diagnostics where supported, and any separately authorized named additional checks.
- Bind failure/snapshot applicability, argv/selector allowlists, transitive graph, safety, exact purpose, and independent approved per-attempt/cumulative limits.
- Atomically reserve consumption across equivalent purposes, children, concurrent workers, restarts, and amendments. Started failures/crashes/skips/cancellations/zero-test attempts count; confirmed non-launch does not.
- Preserve original narrowed parent deadlines and cleanup/evidence reserve. New wrapper IDs, renamed failures, snapshots, or purpose changes cannot replenish budgets.
- Require exactly three authorized isolation retries when supported; the initial failure is not one of them. Insufficient time/safety/authority blocks classification rather than shortening the rule.
- Keep whole current-snapshot tier reruns in the checked required-tier route. Auxiliary passes never satisfy that obligation or grant a second tier.

**Acceptance:** Installed auxiliary dispatch is bounded, subordinate, isolated, and auditable.

**Evidence:** Capability definitions/real decisions, atomic ledger histories, retry reports, verified earlier snapshot/environment, consumption/exhaustion records.

### FG-11-V — Verify auxiliary limits and repair scope/accounting gaps

Check three distinct permitted attempts, no retry-until-lucky behavior, concurrency races, exhausted/narrowed budgets, denied selectors/whole-tier substitutions, and source-isolated comparisons without working-tree or production mutation. Correct defects and re-prove with retained consumption.

**Exit:** Diagnostic/comparison behavior accepted; unknown or unsupported isolation remains blocked, not broader-tier permission.

## Piece 12 — Classification, baseline policy, and repair ownership

### FG-12-I — Implement failure assessment separately from authorization

**Input/dependency:** FG-11-V.

**Implement:**
- Apply owned repair first; then exact active applicable catalog ignore; then authorized three-retry investigation of unlisted failures; then proven provenance or unresolved potential regression.
- Require direct same-failure earlier/comparison-run proof on task-unaffected relevant inputs/environment plus independent corroboration. Duplicated origins count once; intermittency/memory/untouched filenames alone are insufficient.
- Implement exact signature/variant/environment matching, approved normalization, authoritative clock, expiry/revocation, maintenance governance, and ambiguity denial.
- Keep optional absent catalogs non-authorizing; do not automatically promote task-local evidence or fix unrelated baseline failures.
- Implement default-deny for uncatalogued pre-existing failures. Support task-local acceptance only with a separately approved host acceptance policy and exact current pinned decision binding task/plan/run/failure/environment/snapshot/provenance/versions/scope/expiry.
- Preserve raw nonzero outcomes under `ACCEPTABLE_WITH_IGNORED_FAILURES`; never waive harness/incomplete/typecheck obligations or discharge owned repairs by rename/filter/deletion/reclassification.

**Acceptance:** Ownership, provenance, ignore eligibility, and acceptance are separate evidence-backed decisions; none changes the task's tier.

**Evidence:** Classification lineage, original corroboration identities, catalog/version/decision records when genuinely present, raw reports, owned-repair proofs.

### FG-12-V — Verify classification and repair incorrect acceptance

Test exact/mismatched/expired/revoked/ambiguous matches, copied-source corroboration, contaminated earlier snapshots, intermittency without provenance, owned repairs surviving expiry, and positive/negative task-local decision bindings. Verify missing catalog/governance creates no authority.

**Exit:** Applicable failure decisions are evidence-backed; unresolved provenance or acceptance blocks validated completion without auto-fixing unrelated code.

## Piece 13 — Final-writer coordination and local validated completion

### FG-13-I — Implement snapshot-current local acceptance

**Input/dependency:** FG-12-V; actual participating writer routes or verified immutable accepted-state isolation.

**Implement:**
- Integrate effective final-writer coordination covering all relevant participating writers; a coordinator database lock alone is insufficient.
- Under protection, compare final actual input/environment manifest to the applicable complete checked run, assess exact ignores/decisions/owned repairs and independent required obligations, and atomically commit terminal state/audit before release.
- Relevant changes invalidate evidence, not unchanged in-scope tier authorization; rerun the authorized checked tier after material edits.
- Reject ad-hoc/copied/independent results, labels claiming PASS, wrong task/run/plan, incomplete reports, expired exceptions, unknown snapshot integrity, and missing external obligations.
- Reconcile active owned lifetimes before transitions; safe failure/cancellation is distinct from validated completion.
- Retire any local project-code/CLI operation that calls or imports platform-managed completion under the approved migration scope.

**Acceptance:** Installed local checker accepts only complete applicable evidence and cannot race a participating final writer. No claim of platform gating or shell-bypass prevention.

**Evidence:** Actual checker/terminal records, writer coverage and isolation proof, selected-tier post-edit report, live installed final-writer race in a safe authorized environment.

### FG-13-V — Verify the live final-writer boundary and repair gaps

Inspect the actual host writers and checker, not just lock primitives. Run the authorized installed-path race and negative evidence cases; repair missing coordination/readers/terminal logic, then invalidate and renew affected validation.

**Exit:** Snapshot-current local completion proved. Missing safe live race or effective writer coverage blocks this capability and ordinary-route cutover.

## Piece 14 — Owner-directed administrative closure

### FG-14-I — Implement closure mode and honest dependent readers

**Input/dependency:** FG-13-V for installation sequencing. The operational owner-closure route must not require passing ordinary validation.

**Implement:**
- Bind a real explicit authorized owner's direction to the exact project/local task/version and record an accurate decision reference or scoped conversation record; do not invent message IDs or reasons.
- Implement separate `owner_direction` completion mode and assessment, preserving failed/blocked/not-run checks, unresolved repairs, and missing evidence.
- Permit this route without passing tests, ordinary activation, tier changes, a second reviewer, or duplicate confirmation. Quoted/file instructions, flags, silence, and ordinary plan approval are not owner direction.
- Safely stop/wait/quarantine already owned work under applicable authority before transactional local terminal release; retain tombstones/history and idempotency.
- Ensure reports/dependent readers distinguish administrative closure from validation/delivery proof, including legacy absent modes.
- Document separately any genuinely available Agent-native platform operation; project code/CLI must not proxy it, and no platform operation is assumed.

**Acceptance:** Owner-directed closure is administratively honest and safe, without weakening later ordinary-task validation.

**Evidence:** Implemented route/readers, recorded local decisions in authorized tests, raw retained assessments, idempotent terminal/audit reports.

### FG-14-V — Verify closure boundaries and repair dishonest readers

Use isolated approved fixtures to verify closure with missing/failed validation, missing ordinary runner, repeated direction, audit/race failure, active child handling, legacy modes, and unresolved repairs. Do not close a real user's task without their exact direction.

**Exit:** Local closure/readers behave correctly. Missing native platform interface is reported separately; it is not fabricated or demanded as a local prerequisite.

## Piece 15 — Backup/restore and retained-error recovery

### FG-15-I — Implement and exercise safe recovery routes

**Input/dependency:** FG-14-V; separately authorized exact recovery/drill scopes, real host backup/storage capabilities.

**Implement:**
- Define actual backup ownership, cadence/recovery point, consistency/checkpoint method, protected access, retention, reports, and restore steps. Create an authorized real backup; a schedule/procedure is not proof.
- In isolated host storage using the real format/transaction semantics, restore namespace, schema, committed-ID ledger/tombstones, task/audit bindings, and consistent checkpoint.
- Allocate committed IDs after backup and prove later-commit reconciliation through trusted durable records; missing proof leaves allocation blocked.
- Fence old writers/replicas and prevent same-namespace split allocation. Do not revive stale grants/leases/policies or renew expired ignores from backup.
- Implement retained-error recovery with actual separately approved bounded bindings to original task/plan/run/operation, incident, exact lease/token/incarnations, host/root/boot where applicable, contenders, unknown commits, current authority, and durable acknowledgement.
- Never infer death from age/heartbeat, insert legacy false flags, unlink exclusion, delete sidecars, blindly retry claims/signals, or count recovery as validation PASS.

**Acceptance:** Recovery routes are implemented and actual isolated allocator restoration has proof. Production restore and recurring automation are outside this task.

**Evidence:** Actual backup/checkpoint and isolated restore reports, later-ID reconciliation, writer fencing, unchanged original incidents/consumption, recovery decision and acknowledgement.

### FG-15-V — Verify actual restoration and repair recovery defects

Independently inspect the real checkpoint and exercise the authorized isolated host restore, not only mocks. Check non-reuse, namespaces, tombstones, transaction consistency, stale permissions/expiry, old-writer fencing, true/unfinalized/missing-field exclusions, and unknown-commit acknowledgement.

**Exit:** Claimed recovery readiness has real proof; missing safe approval, durable ledger, or acknowledgement remains blocked. Do not clear live exclusions to make verification pass.

## Piece 16 — Evidence health, retention, export, and visibility

### FG-16-I — Complete the evidence-management surface

**Input/dependency:** FG-15-V.

**Implement:**
- Reconcile the one tracked index/manifest to actual authoritative stores and safe access routes for all eight evidence/recovery capabilities.
- Record exact lineage and distinct `present`, `never_collected`, `unavailable`, `expired`, `pruned`, `corrupt`, `unknown` availability, separate from freshness/validation.
- Provide bounded read-only health inspection for broken artifacts, missing reports, binding/version errors, stale permissions, unresolved runs/locks, expired baselines, backup/restore status, lineage independence, telemetry coverage, and closure ambiguity.
- Define dependency-aware retention/access/deletion; protect permanent tombstones and supporting evidence needed for current claims. Authorized pruning records lost verifiability without rewriting history as PASS.
- Implement scoped sanitized export with exact bindings/snapshots/environment, raw outcomes, origins, policy/catalog/closure modes, unresolved work, versioned manifest/digests/redactions, and explicit missing evidence.
- Ensure imports/views never allocate, activate, authorize, widen ignores, replace live stores, or prove another environment passed.
- Expose owner-directed versus validated completion in all applicable views without adding closure approval/testing requirements.

**Acceptance:** All eight capabilities have actual mapped implementations, including previously delivered index, restore, lineage, absence, health, retention, export, and mode visibility.

**Evidence:** Index/health/export outputs, protected dependency graph, policy records, redaction/non-authority cases, references to actual Piece 15 proof.

### FG-16-V — Verify all eight capabilities and repair omissions

Follow indexed references to authoritative evidence; inspect actual health behavior, safe export/import view, missing/corrupt/stale artifacts, redaction, dependencies, permanent tombstones, and closure-mode reporting. Test pruning only on disposable authorized fixtures, not production history.

**Exit:** Evidence surface verified. Optional missing history remains optional; a missing required capability is explicitly blocked rather than satisfied by documentation.

## Piece 17 — Separately gated runtime reclaim, if applicable

### FG-17-I — Implement protected checked reclaim without implicit disruption

**Input/dependency:** FG-16-V; actual applicability assessment and separate disruption/recovery authorization. Inspect current canonical Port Authority interfaces if it is a discovered consumer/dependency.

**Implement:**
- Discover all cleanup consumers, aliases/hooks/startup chains, implicit reclaim, development-context admission, and existing unsafe legacy risks.
- For applicable reclaim routes, map independent trusted host attestation, authentic human exact-scope approval, active source/revocation clock, protected transport/verifier, atomic authoritative claim, conflict coverage, journal/outcome storage, and bounded uncertainty recovery.
- Pin exact operation/task/plan/run/scope, host/root/boot, ownership/lease/token and process incarnations/ports as required by the canonical contract. Validate untrusted shapes before member access; malformed input cannot reach intent or delivery.
- Preserve current exact Port Authority interface/scope-hash semantics where used. Code-owned unconfigured hooks are not a deployed trusted provider.
- Implement immutable intent, at-most-once claimed delivery, per-incarnation batches, races/revocation/conflict handling, authoritative outcome acknowledgement, and retained exclusion on uncertain/partial effects.
- Keep ordinary tier approval and automatic owned-work cleanup separate from reclaim of other runtime processes.
- Do not enable or signal through live reclaim without separately authorized safe host acceptance.

**Acceptance:** Applicable source/integration is complete. Live enabled readiness requires authentic protected providers and actual scoped proof; fixtures alone cannot provide it.

**Evidence:** Applicability/consumer graph, verified protected sources, actual decisions/claims/intents/outcomes when authorized, interface comparison, retained incidents.

### FG-17-V — Verify reclaim or record a justified non-applicable boundary

Independently verify current canonical contracts and actual protected provider/wiring. Run the complete applicable reclaim matrix only under safe explicit authorization. Check invalid envelopes, stale/revoked grants, exact scope conflicts, replay/unknown commits, partial signals, late storage, surviving listeners, and no cleanup-to-PASS conversion.

Repair missing implementation in this task; external trust/approval cannot be fabricated. Require two consecutive real authorized caller runs before claiming each applicable caller's enabled readiness, within explicitly approved repetitions and bounds.

**Exit:** Applicable live reclaim is verified and separately enabled, or remains **blocked** with exact integration/authority owner and next proposal. It is **not applicable** only with affirmative project evidence that no reclaim-dependent control/caller is in the intended installation scope. Failure to obtain providers is not non-applicability. Unrelated non-reclaim work may continue if its task-wide gates and dependencies permit it.

## Piece 18 — Real caller acceptance, authorized cutover, and full verification

### FG-18-I — Integrate the actual ordinary-task route and cut over once

**Input/dependency:** Accepted applicable preceding capabilities; Piece 17 may be justified non-applicable or separately blocked only where no ordinary caller depends on it.

**Implement/execute:**
- Reconcile the entire clause ledger and current canonical/source/implementation manifests. Verify no required ordinary capability is missing or stale.
- Inventory and prove each discovered independent caller through its real existing safe invocation without adding task/plan metadata or changing command strings/coverage/reports/serialization/workflows. Do not trigger remote CI without authorization; inaccessible real caller evidence remains blocked.
- Under approved scoped integration acceptance, activate an actual local-ID plan through a real decision and run only its selected checked tier on the relevant edited snapshot. Prove optional plan-file/environment input is absent where supported, and invalid checked requests do not fall back.
- Verify installed ordinary local completion/final-writer behavior, raw independent-versus-checked evidence separation, deny/transition/monitor/recovery obligations, and no hidden platform-managed completion route.
- Obtain two consecutive authorized real runs for every control/caller whose enabled readiness is claimed. Fixtures remain separate; each repetition must be covered by real scope/limits.
- Perform separately authorized ordinary-route cutover, retaining the prior governing route until genuine acceptance and removing the prior ordinary authority in one controlled transition. Do not run two ordinary authorities or silently migrate history.
- Record guidance for actual plan-to-active local activation, post-edit checked reruns, allowed diagnostics, exact next proposals, owner closure, and user merge-or-dismiss boundary.

**Acceptance:** All required ordinary-route prerequisites and actual caller evidence are current; approved cutover is complete, singular, and auditable. No automatic merge or deployment.

**Evidence:** Real local ID/approved plan and decision, caller reports, two-run acceptance references, selected-tier raw outcomes, final-writer proof, cutover/reconciliation records, updated manifest/index.

### FG-18-V — Independently verify the complete installed contract and repair gaps now

Perform fresh full canonical-to-host verification of every applicable ledger item, not a collection of installer summaries. Revalidate all earlier evidence against current affected inputs, wiring, approved definitions, environment, and this verifier's complete payload.

This verifier explicitly includes safe scoped repairs for omissions in any preceding implementation piece. List gaps first, trace each to its owning requirement/piece, patch the missing/wrong implementation within approved installation scope, renew changed enforcement approval where required, and rerun affected checks under real authority and retained budgets. Perform an independent post-repair readback. Do not recurse into more verifier tasks or fix unrelated product defects.

Recheck that:
- Canonical instructions/references are available and source parity is accurately reported.
- Project-local allocator, planning, decisions, tier lock, checked execution, transitive scope, budgets, supervision, single-flight/resources, telemetry, configuration, snapshots, results, diagnostics, classification, completion, owner closure, restore, health/retention/export, and applicable reclaim match the canonical obligations.
- Every required live caller, restoration, final-writer race, and cutover proof is actual, current, and correctly bound; two real caller runs substantiate enabled-state claims.
- Independent callers retain genuine existing authority and raw outcomes; their results cannot satisfy checked required-tier evidence.
- No project code/CLI depends on platform-managed completion; platform task status remains a separate claim.
- All failed/blocked/not-run checks, unresolved repairs, unsafe legacy risks, missing providers, and retained exclusions remain visible.

**Exit:** Report **verified installation** only if all applicable required checks have accepted evidence. Otherwise report **partial/blocked/failed**, with per-control STAGED/NON_RECLAIM_VERIFIED/LIVE_RECLAIM_ENABLED states and exact responsible next actions. A task marked Done or an owner-directed closure is not a full-installation pass.

## Report template for every verifier

Use the actual project-selected tracked report destination. Include:

| Field | Required content |
|---|---|
| Binding | Project identity; real primary/local IDs where applicable; finalized primary and verifier plan revisions/digests; exact declared stage and scope |
| Source baseline | Immutable canonical skill/reference closure; installed implementation/configuration/environment snapshot |
| Delivery | Actual accessible delivered files and wiring, not only a dependency or platform completion label |
| Requirement matrix | Source section/case; host path/interface; acceptance method; evidence; status; responsible role; next action |
| Before repair | Observed missing/wrong implementation and missing proof, listed before changes |
| Repair record | Exact scoped changes; approval/version consequences; affected stale evidence; renewed snapshot binding |
| Actual validation | Approved route/commands/graph; effective limits and consumed/remaining budgets; attempts; raw outcomes/reports; termination and acknowledgement |
| Independent readback | Fresh post-repair comparison and accepted evidence, not repair-author self-certification |
| Remaining work | Failed/blocked/not applicable reasons; retained incidents/exclusion; exact next scoped proposal |
| Claim boundaries | Source availability/parity; project-local capability; fixture status; real host readiness; platform status separately |

## Materialization rules if these become real project tasks

Writing this series does not create those tasks or authorize installation. If subsequently asked to create them:

1. Bind the confirmed target and actual host task interface; finalize each complete implementation payload before attaching its verifier.
2. Expand the shared contract and piece payload into each persisted task. Include real dependency/readiness semantics, exact report path, clause ledger, approved staging/execution boundaries, and explicit verifier repair scope.
3. Read back the entire primary and verifier plans and compare them with their expected finalized payloads. Titles, tags, dependency IDs, or hashes asserted by a writer are insufficient.
4. Use a stable duplicate binding keyed by project, exact skill identity, primary namespace/ID, finalized primary-plan digest, and canonical verification scope. Reconcile existing/legacy verifiers and uncertain writes before creating replacements.
5. Recheck primary/verifier revisions at linkage, before substantive execution, and at acceptance. Changed payloads/sources invalidate affected evidence; use the actual authorized replan/renewal route.
6. Verify delivery/readiness in the verifier environment. Dependency release or Done status alone may not deliver the required snapshot. Preserve blocked obligations and their concrete resume routes.
7. Do not auto-approve, activate, change dependencies/status, or recursively create follow-up verifiers. A pending verifier is pending; a cancelled, failed, stale, or blocked one is not satisfied verification.

## Canonical planning baseline

These were the observed normative entry-point digests while writing this series. They are **planning provenance**, not target-project installation evidence. Piece 01 must verify the intended project's full transitive canonical closure, including applicable adapters/resources/tests, and reconcile any material revision change rather than silently reuse this baseline.

| Canonical path relative to `.agents/skills/failure-gate-v4/` | SHA-256 |
|---|---|
| `SKILL.md` | `c62037ac28404b815808fdc2428c2d17b52465d4c1f023fa50c0d5622898b4bb` |
| `reference/implementation.md` | `4b1b756c0d1726b240451a6a82e563a722be2dc9c879f4bb7d54f347d26f2a16` |
| `reference/acceptance.md` | `5d89de3cac03813485cc1781fa67c47c59e659c46fae59ef1d39dd2b1db21bfe` |
| `reference/authorized-continuation.md` | `3dc5590aca87c679b4dbfdcc0fe29c5fdc73192a816b3f82bfd326b28933d8b3` |
| `reference/evidence-and-recovery.md` | `d2c79cd89a5ab8eb6a229df78c07ed0a05d89889446317b724c457bb60667d9a` |
| `reference/execution-monitoring.md` | `b67b9ccc044bcedee8e8b056ccf91a74cee479535b91aaa3455642e09200377b` |
| `reference/owner-directed-closure.md` | `9dff9d6e28e10b70224755d63a0f1aeb44be9f789c47a5700bab86dc46d3b4e4` |
| `reference/runtime-reclaim.md` | `bceea11fe66e7d4ef0433ee8306f87f3ec5cdc1520215fdf59393afcbbedb51f` |
| `reference/staging-and-lifecycle.md` | `a9ab52d787e44c7aa4e199c8662882521d8ccf0ef8a6de0706c7853b5fa69800` |
| `reference/validation-budgets.md` | `62c19d7ef9cbedf9505ba45b3d45460fa909126db30a83fbeb43fa2ae7a09866` |

Routing/verification requirements also come from the following canonical Router files. Pin their full applicable closure in Piece 01.

| Canonical path relative to `.agents/skills/skill-application-router/` | Observed SHA-256 |
|---|---|
| `SKILL.md` | `710a92d8347026ca8f3e0a928335f51e5114befb173a6785efd4b45d84599d19` |
| `references/installation-verification-plan.md` | `6d9da115f654e26252d5c188c34b927d8787b1978546e70fb766ba8f0ad5223a` |
| `references/handoff-binding-and-recovery.md` | `1c8f4198af23d8c904520835c29062677da382b774baa2f850b2adbfa9198ce1` |

The paired definition-confirmation criteria, when applicable, come from Failure Gate's canonical `reference/acceptance.md`. Material regression protection comes from its acceptance contract and existing host requirements. No absent companion skill is silently replaced with a copied definition.
