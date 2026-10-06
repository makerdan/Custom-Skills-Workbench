# FG-01-I clause and acceptance ledger

**Canonical binding:** `failure-gate-fg-01-source-manifest.md`  
**Project / task:** Skills Workbench, `/home/runner/workspace`, Replit task `#68`  
**Status convention:** this ledger allocates requirements; it does not assert their host acceptance or execution. “Documented” means the requirement is captured and mapped here, not that the behavior passed.

## Rules applying to every row

1. The normative text is the exact canonical path and pinned digest in the source manifest. Each row below retains its canonical case label and source line so the original required behavior remains authoritative and is not shortened into a weaker rule.
2. **Applicability:** apply a case under the canonical row’s stated scope and policy state. Conditional requirements are not applicable only with affirmative evidence satisfying the canonical condition. Missing evidence, unavailable routes, and unknown states are **BLOCKED/UNKNOWN**, never “not applicable.”
3. **Evidence:** Piece 01 retains the original source/host claim, revision/digest, permitted evidence location, role and next action in the linked discovery and capability records. The owning later piece must retain the actual decision/approval, bound source/plan, permitted execution record and raw accepted evidence required by that exact canonical row. A fixture, source match, summary, task status, or agent-written receipt cannot substitute for required host proof.
4. **Pass/fail:** pass only when the exact canonical behavior is demonstrated with its required evidence and current bindings; fail on an observed counterexample or weakened obligation; block when authority, route, source, required evidence, finite bounds, or independent supervision is missing or unknown. Use canonical `NOT_RUN`/fixture states separately from host acceptance. No row is declared a runtime pass by this discovery task.
5. **Owner/dependency:** `Pxx` means the named Piece in the 18-piece series; the implementation/verifier pair in that piece owns the deliverable. In a multi-piece row, Piece 01 owns extraction and initial host mapping; the additional pieces own their listed capability and proof. Later pieces retain the series’ dependency on acceptance of the preceding declared stage. Cross-piece assignment is intentional where policy, implementation, caller integration, and independent proof are separate obligations.

### Row-resolution method and safety preconditions

These fields apply to every stable-ID row in this ledger, alongside the exact canonical text and the owner-piece allocation shown by that row:

1. **Expected behavior:** the complete canonical requirement or acceptance case at the cited path/section/line is authoritative. The short ledger label is an index, not a replacement or weakened outcome.
2. **Piece 01 method:** compare the pinned canonical row with the corresponding primary requirement, host claim, and original source/record reference using bounded read-only inspection. Verify the row's applicability against the canonical condition and the observed policy evidence. If an original source, record, or binding is unavailable, mark that field UNKNOWN/BLOCKED rather than infer it.
3. **Piece 01 evidence:** retain the canonical path/line and digest plus the corresponding host source or original record path/reference and its digest in the source manifest or linked evidence index. For unavailable evidence, retain the exact owner and next action. Source inspection, a test definition, or a prior task status is not execution evidence.
4. **Role and dependency:** the `Owner pieces`/piece-specific acceptance allocation is the implementation/evidence owner; the matching `FG-xx-V` role independently reads that evidence. Piece 01 verifies extraction and initial mapping only; it does not discharge a later piece's dependency or acceptance.
5. **Safety preconditions:** this Piece 01 verification is read-only. No test, project script, store/CLI access, service, workflow, signal, or runtime operation is part of its method. Any later executable method remains PROVISIONAL until actual policy state, exact task/plan/approval bindings, authentic finite limits and remaining consumption, full transitive scope, independent supervision, cleanup reserve, capture, and conflict conditions are verified through an authorized route. Missing any required precondition blocks that execution.
6. **Disposition:** classify each source/mapping observation VERIFIED, FAILED, BLOCKED, or justified NOT APPLICABLE under the common pass/fail rule above. Classify any separately authorized fixture PASSED, FAILED, BLOCKED, or NOT_RUN. Do not promote source-only comparison to host acceptance.

## Exact Piece owner key

| Piece | Owner scope from the tracked 18-piece series | Declared stage |
| --- | --- | --- |
| P01 | Project binding, contract extraction, installation scope | Planning/discovery |
| P02 | Bootstrap authority and finite-budget contract | Source/proposal |
| P03 | Transactional identity and coordinator foundation | Source |
| P04 | Independent supervision and bounded capture | Source |
| P05 | Safely admitted bootstrap runtime proof | Bootstrap runtime |
| P06 | Tier registry and pre-activation planning | Bootstrap runtime |
| P07 | Approval, activation, and authorized changes | Bootstrap runtime |
| P08 | Configuration, snapshots, and raw-result integrity | Bootstrap runtime |
| P09 | Checked execution, transitive scope, and concurrency | Bootstrap runtime |
| P10 | Durable execution telemetry and automatic lookup | Bootstrap runtime |
| P11 | Bounded diagnostics and provenance comparisons | Bootstrap runtime |
| P12 | Classification, baseline policy, and repair ownership | Bootstrap runtime |
| P13 | Final-writer coordination and local validated completion | Bootstrap runtime |
| P14 | Owner-directed administrative closure | Bootstrap runtime |
| P15 | Backup/restore and retained-error recovery | Bootstrap runtime |
| P16 | Evidence health, retention, export, and visibility | Bootstrap runtime |
| P17 | Separately gated runtime reclaim, if applicable | Conditional protected capability |
| P18 | Real caller acceptance, authorized cutover, and full verification | Ordinary-route cutover |

## Piece-specific acceptance allocation

Each tracked piece's own acceptance/evidence/exit contract is separately allocated below. Evidence listed here is the series requirement, not evidence already produced by Piece 01.

| Piece / canonical acceptance | Owner and dependency | Required evidence; Piece 01 status |
| --- | --- | --- |
| P01 — Verified host, immutable baseline, full allocation, actual capability/approval inventory, preserved coverage, explicit stage/permission; unresolved capability not ready | P01; no implementation predecessor | Discovery report, source manifest, ledger, capability/evidence locators, inventory, proposal. **Documented; current-policy and historical Router source-provenance gaps explicitly blocked.** |
| P02 — Implementable admission/budget design and inert adapter; real/unavailable routes distinguished; no invented approval/execution | P02 after P01-V | Proposal/actual decision if available, adapter/schema/effective limits/deny cases. P01 supplies discovery inputs only; no P02 design or adapter installation claimed. |
| P03 — Complete inert source/schema foundation without live-store initialization or restore claim | P03 after P02-V | Source/migrations, schema/invariant matrix, storage map, planned isolated cases. P01 inventories existing storage source only; no store opened or initialized. |
| P04 — Source ready for a safely admitted first proof; missing real independent containment blocks proof, not an uncontained test | P04 after P03-V | Source/adapters, verified provider semantics, registration/termination protocol, budget/capture deny matrix, blockers. P01 records provider as unknown/unavailable; no containment readiness claimed. |
| P05 — Actual bootstrap coordinator/admission/budget/containment/evidence proof; fixtures remain fixtures; failures block readiness | P05 after P04-V and a genuine exact grant | Operation/decision, effective limits, real reports/raw exits, registration/termination, records/snapshot/incidents. P01 ran none and reuses no prior grant. |
| P06 — Working registry/planning before activation, preservation of obligations, no arbitrary tier dispatch | P06 after P05-V | Registry/version/plans/guards/bounded discovery/snapshots/coverage. P01 does not execute planning interfaces. |
| P07 — Genuine exact-bound approval-driven activation/change on safe bootstrap subjects; ordinary cutover still pending | P07 after P06-V and verified real decision source | Decision source, pinned content, policy versions, transaction history, denial/race reports. P01 finds the available project evidence insufficient for current approval/cutover. |
| P08 — Valid config launches intended command; invalid config prevents launch; snapshots and parsers cannot manufacture completeness/PASS | P08 after P07-V | Input declarations/identities, manifests, report fixtures and real reports, raw outcomes, safe port proof as applicable. P01 inventories writers/configuration but performs no run. |
| P09 — Exactly authorized checked execution; mismatches/expansion launch nothing; complete supervised results | P09 after P08-V and applicable bootstrapped infrastructure | Real checked run, leases/intents, command graph, concurrency evidence, raw reports. P01's policy state is UNKNOWN; no dispatch accepted. |
| P10 — Truthful installed telemetry, durable applicable-boundary records, scoped read-only investigation | P10 after P09-V | Actual segments/restart observations/query reports/concurrency and corruption cases. P01 did not inspect live store or operate telemetry. |
| P11 — Bounded, subordinate, isolated, auditable auxiliary dispatch | P11 after P10-V | Real decisions, atomic budget ledger, retry evidence, verified comparison snapshot and consumption. P01 did not invoke diagnostics or comparisons. |
| P12 — Separate evidence-backed ownership/provenance/ignore/acceptance decisions without tier change | P12 after P11-V | Lineage, independent corroboration, actual catalog/decision if present, raw reports, repair proofs. P01 records no approved catalog and creates no ignore. |
| P13 — Snapshot-current local completion only with complete evidence and effective participating-writer protection; no platform/shell-bypass claim | P13 after P12-V and verified real writer/isolation route | Terminal records, writer coverage/isolation, selected-tier post-edit report, live final-writer race. P01 preserves all writer gaps; no completion call. |
| P14 — Safe, honest owner-directed administrative closure without weakening later ordinary validation | P14 after P13-V for sequence; distinct owner-direction route | Implemented route/readers, authorized decisions/tests, raw assessments and idempotent audit. P01 does not close any task. |
| P15 — Actual isolated allocator restore proof; production restore/recurring automation excluded | P15 after P14-V and separate exact recovery authority | Backup/checkpoint, isolated restore, later-ID reconciliation, fencing, unchanged incidents/consumption, decision/ack. P01 neither queries nor changes recovery state. |
| P16 — All eight actual evidence-management capabilities mapped and verified; required gaps blocked, optional history remains optional | P16 after relevant earlier proof, especially P15-V | Index/health/export, protected dependencies, policies, redaction/non-authority, real restore reference. P01 provides locators but does not claim those capabilities pass. |
| P17 — Complete applicable protected reclaim integration; live enablement requires authentic providers and scoped proof; affirmative scope evidence is required for N/A | P17 after P04/P15 proof and separate reclaim approval | Applicability/consumer graph, protected sources, actual decisions/claims/intents/outcomes, interface comparison/incidents. P01 records a project caller/CLI deny, so reclaim remains BLOCKED, not N/A. |
| P18 — Current ordinary-route prerequisites/callers, singular approved cutover and complete audit; no automatic merge/deploy | P18 after all required earlier pieces and independent verification | Real local ID/approved plan/decision, callers/two-run acceptance, selected-tier raw outcomes, final-writer/cutover reconciliation. P01 keeps platform lifecycle separate and claims no cutover. |

### Per-piece independent verifier obligations

The `FG-xx-V` reviewer is a separately assigned role in every piece, not the same as the implementation owner. Each verifier must inspect original implementation/evidence, preserve its own findings, and leave missing proof blocked. Rows state the verifier scope/exit from the tracked series; no later verifier ran in this Piece 01 task.

| Verifier | Required independent inspection / exit | Dependency and evidence owner |
| --- | --- | --- |
| FG-01-V | Independently inspect the target/canonical closure, every inventory/destination/allocation/role/policy-state claim; identify gaps first, repair only scoped discovery records, re-read independently. Exit only with a factual discovery deliverable and named blocker owners/actions. | After FG-01-I artifacts are delivered and actual task dependency/readiness verified. The primary's discovery snapshot listed platform task `#69` as pending/parent-blocked. The verifier's later task API readback finds `#68` MERGED and `#69` IN_PROGRESS with the exact `#68` dependency; this lifecycle is not acceptance or authority. |
| FG-02-V | Trace approval/policy bindings to real sources; reject caller flags, guessed/unverified events/labels, command-as-plan approval and enlarged budgets; repair source/docs without running unapproved work. | After P02-I; source/proposal acceptance. Missing authentic approval/independent budget remains a P05 execution blocker. |
| FG-03-V | Read implementation, not only schema descriptions; inspect transaction boundaries, constraints, histories, denial defaults, tombstones, permanent consumption and competing permission lists; repair source/migrations. | After P03-I; source delivery. P05-V owns runtime coordinator proof; P15-V owns restore proof. |
| FG-04-V | Trace complete execution graph/gate order; inspect escape/remote assumptions, sync-blocking risks, register-before-dispatch, finite test/hooks and late-zero handling. | After P04-I; readback verifies inert supervision only. P05 remains runtime readiness gate. |
| FG-05-V | Independently inspect real storage, route wiring, raw reports and supervisor evidence for P02–P04; reproduce only approved bounded cases, repair actual missing runtime pieces, retain failed/blocked state. | After P05-I under actual authority; exit with bootstrap readiness only, never ordinary activation. |
| FG-06-V | Compare registry definitions to actual command graphs/config/discovery/reports; use isolated denial cases; prove pre-activation planning cannot create a pass. | After P06-I; real planning/source coverage; unsupported checks blocked and no all-tier sweep. |
| FG-07-V | Exercise actual available decision ingestion and negative cases for forged/stale/mismatched bindings, forbidden status/command/merge approvals, Replit event actor semantics, races/projections; inspect atomic records. | After P07-I; genuine source only; unavailable trusted adapters blocked. |
| FG-08-V | Exercise approved config/snapshot/report paths; inspect redaction, malformed inputs, stable targets, config conflicts, dependency/generated changes, report omissions and mutation; rebind repaired evidence. | After P08-I; every required input/result adapter accepted or explicitly blocked. |
| FG-09-V | Verify selected-tier execution, non-environment plan binding, mismatch rejection without fallback, duplicate/queue behavior, resource exclusion, graph expansion denial and child-safe cancellation. | After P09-I; accepted bootstrap runner only; no ordinary cutover. Denial uses instrumented fixtures, not unauthorized tiers. |
| FG-10-V | Compare actual events to actual launches, crash/record-failure windows, rotation/duplicates/missing logs and finish evidence; verify automatic overlap lookup and classification. | After P10-I; only evidenced managed telemetry is healthy; no tamper-proof claim. |
| FG-11-V | Verify three distinct permitted isolation retries, concurrency, exhausted/narrowed budgets, denied selectors/tier substitution and source-isolated comparisons without working-tree/production mutation. | After P11-I; unsupported isolation stays blocked and cannot authorize another tier. |
| FG-12-V | Verify exact, mismatched, expired/revoked/ambiguous matches, independent corroboration, contaminated snapshots, intermittency, owned repairs and positive/negative task-local bindings. | After P12-I; missing catalog/governance creates no authority; unresolved outcome blocks validated completion. |
| FG-13-V | Inspect actual writers and checker—not only locks—then perform the approved live installed-path race and negative evidence cases; repair/revalidate affected evidence. | After P13-I and actual safe route; missing live race/effective coverage blocks completion and ordinary cutover. |
| FG-14-V | Test owner-closure honesty under missing/failed validation, missing runner, repeated direction, audit/race failure, active child, legacy modes and unresolved repairs. Never close a real user task without exact direction. | After P14-I under isolated authorized fixtures; native platform interface absence reported separately. |
| FG-15-V | Verify actual restoration, backup/checkpoint, later-ID reconciliation, fencing, original incidents/consumption and durable acknowledgements; repair recovery defects. | After P15-I with exact recovery authority; never clear exclusions to make a check pass. |
| FG-16-V | Verify all eight evidence-management capabilities and source/index mapping, restore/lineage/absence/health/retention/export/mode visibility. | After P16-I; optional history remains optional; missing required evidence capability blocked. |
| FG-17-V | Independently verify protected reclaim integration if applicable; otherwise justify non-applicability from affirmative project scope/consumer evidence. | After P17-I; fixtures never enable live reclaim. If required provider/approval is missing, remains blocked with owner/action. |
| FG-18-V | Freshly verify the entire canonical-to-host contract and every applicable ledger item; revalidate evidence/current inputs; publish gaps before scoped repairs; independently re-read repairs and all required live caller/restore/final-writer/cutover proofs. | After full P18-I delivery and all required prerequisites. Report verified installation only with accepted evidence for every applicable requirement; otherwise partial/blocked/failed. No recursive verifier task. |

## Normative clause allocation

| Ledger group | Canonical obligation clauses covered | Owner pieces | Dependency / Piece 01 evidence and later acceptance rule |
| --- | --- | --- | --- |
| G-01 | `SKILL.md` §§ Purpose/boundary, discovery, invariants, planning, task identity, task-local failures/environment, validation; `implementation.md` §§ scope/migration, host adaptation; `staging-and-lifecycle.md` §§1–2 | P01, P02, P05, P06, P07, P18 | P01 binds actual project, source, current governing-state evidence and stage without inferring authority; later owners must use verified ACTIVE, verified INACTIVE, or fail closed on UNKNOWN. |
| G-02 | `implementation.md` §§ authority/approvals, policy setup, identity/single-source authorization, transactional lifecycle, authorization vs run snapshots, tier registry/checked execution; `acceptance.md` Required host tests and paired confirmation | P02, P03, P06, P07, P18 | P01 maps actual plan/decision/persistence and missing routes; later owners prove exact identity/version/decision binding and durable lifecycle under real approval. |
| G-03 | `SKILL.md` execution scope, monitoring, overlap, independent callers and configuration; `implementation.md` execution/configuration/port/compatibility clauses; `validation-budgets.md` §§1–7; `execution-monitoring.md` §§1–6 | P04, P05, P08, P09, P10, P11, P18 | P01 inventories command graphs, existing callers, config and observed monitors; later owners prove bounded dispatch, whole-tree supervision, lock/resource behavior, captures, and unchanged independent invocations. |
| G-04 | `implementation.md` run evidence, baseline policy, completion, recovery/retention; `acceptance.md` completion/evidence clauses; `evidence-and-recovery.md` §§1–8 | P03, P12, P13, P14, P15, P16 | P01 points to existing original records and distinguishes absent/unknown history; later owners prove actual evidence lineage, ownership, closure, backup/restore, retention and export behavior without dropping failures. |
| G-05 | `authorized-continuation.md` §§1–5; `staging-and-lifecycle.md` §§3–6 | P02, P04, P05, P09, P10, P15, P18 | P01’s proposal/handoff records exact permitted scope, consumed authority, unresolved blockers and next decision owner; later execution retains original accounting, cleanup reserve, independent supervision and recovery separation. |
| G-06 | `runtime-reclaim.md` §§1–8 and reclaim-linked budget/staging clauses | P04, P15, P17, P18 | P01 records the local denial and missing protected proof. P17 remains blocked unless affirmative scope evidence proves non-applicability or the separate protected approval/attestation/protocol is actually available and accepted. |
| G-07 | Router `SKILL.md` routing, authority, application, verification handoff, install, catalog boundaries and completion report; `installation-verification-plan.md` source/scope, three baselines, task plan, handoff, blocked conditions and reporting; `delivery-reconciliation.md` phases and difference classification; `handoff-binding-and-recovery.md` identity, uncertain writes, immutable plan, lifecycle and readiness | P01, P06, P07, P08, P13, P15, P16, P18 | P01 pins the original specification and complete closure, exact plan/delivery snapshots, report destinations and task binding. P18 owns real platform caller/dependency/cutover acceptance; relevant pieces own plan, decision, snapshot, evidence, writer and recovery contracts. |
| G-08 | Optional POSIX writer adapter README §§ host checklist, lifetime, supervision, proof | P04, P13, P18 | The adapter is optional source, not installed host authority. P01 records the existing project lock and unverified participants; P13/P18 must prove the actual cooperating final-write boundary or a justified equivalent. |

## Failure Gate acceptance cases

### Core acceptance matrix (`reference/acceptance.md`, lines 56–196)

Every source row below is individually assigned. Detailed behavioral text is retained at the cited pinned canonical row; the common evidence and pass/fail rules above apply without weakening that text.

| Ledger ID | Canonical case | Owner pieces |
| --- | --- | --- |
| A-001 | `acceptance.md:L56` — Policy states | P01, P02, P05, P18 |
| A-002 | `acceptance.md:L57` — Staging states | P01, P02, P05, P18 |
| A-003 | `acceptance.md:L58` — Task-wide staging gate | P02, P05, P18 |
| A-004 | `acceptance.md:L59` — Implicit reclaim | P17, P18 |
| A-005 | `acceptance.md:L60` — Retained lifecycle | P03, P09, P15, P18 |
| A-006 | `acceptance.md:L61` — Exact recovery | P15 |
| A-007 | `acceptance.md:L62` — Gate and watchdog | P04, P05, P09, P10 |
| A-008 | `acceptance.md:L63` — Manifest shapes | P03, P08, P09 |
| A-009 | `acceptance.md:L64` — Portability | P01, P03, P08 |
| A-010 | `acceptance.md:L65` — Project adapters | P01, P03, P06 |
| A-011 | `acceptance.md:L66` — Missing optional features | P01, P16 |
| A-012 | `acceptance.md:L67` — Missing governance | P01, P02, P07, P18 |
| A-013 | `acceptance.md:L68` — No existing tiers/tests | P01, P02, P06 |
| A-014 | `acceptance.md:L69` — Safe discovery/retries | P01, P02, P11 |
| A-015 | `acceptance.md:L70` — Allocation | P03 |
| A-016 | `acceptance.md:L71` — Namespace | P03 |
| A-017 | `acceptance.md:L72` — Bootstrap | P02, P05 |
| A-018 | `acceptance.md:L73` — Authorized continuation | P02, P15 |
| A-019 | `acceptance.md:L74` — Next scoped proposal | P01, P02 |
| A-020 | `acceptance.md:L75` — First-proof sequence | P05 |
| A-021 | `acceptance.md:L76` — Failed execution continuation | P15 |
| A-022 | `acceptance.md:L77` — Activation | P07 |
| A-023 | `acceptance.md:L78` — Once-approved policy | P02, P07 |
| A-024 | `acceptance.md:L79` — Proactive policy setup | P02, P07 |
| A-025 | `acceptance.md:L80` — Policy/bootstrap/cutover separation | P02, P05, P18 |
| A-026 | `acceptance.md:L81` — Approved plan input | P06, P07, P18 |
| A-027 | `acceptance.md:L82` — New bound decision | P07 |
| A-028 | `acceptance.md:L83` — Approval event source | P07 |
| A-029 | `acceptance.md:L84` — Event semantics and reuse | P07 |
| A-030 | `acceptance.md:L85` — Decision source stability | P07 |
| A-031 | `acceptance.md:L86` — Tier lock | P06, P07 |
| A-032 | `acceptance.md:L87` — Agent initiation boundary | P09, P18 |
| A-033 | `acceptance.md:L88` — Independent origin preservation | P18 |
| A-034 | `acceptance.md:L89` — Transitive execution manifest | P09 |
| A-035 | `acceptance.md:L90` — Approved shared composition | P09 |
| A-036 | `acceptance.md:L91` — Actual scope violation | P09 |
| A-037 | `acceptance.md:L92` — Delegated authority | P09, P18 |
| A-038 | `acceptance.md:L93` — Direct diagnostic restriction | P11 |
| A-039 | `acceptance.md:L94` — Comparison scope | P11 |
| A-040 | `acceptance.md:L95` — Cumulative auxiliary budgets | P02, P11 |
| A-041 | `acceptance.md:L96` — Budget reset resistance | P02, P09, P15 |
| A-042 | `acceptance.md:L97` — Bounded separate policies | P02 |
| A-043 | `acceptance.md:L98` — Acceptance without tier sweep | P09, P18 |
| A-044 | `acceptance.md:L99` — Permitted reruns and transitions | P09, P13 |
| A-045 | `acceptance.md:L100` — Monitor installation mapping | P10 |
| A-046 | `acceptance.md:L101` — Single-flight race | P09, P10 |
| A-047 | `acceptance.md:L102` — Queue revalidation | P09 |
| A-048 | `acceptance.md:L103` — Parallel substep preservation | P09 |
| A-049 | `acceptance.md:L104` — Cross-task resource exclusion | P09 |
| A-050 | `acceptance.md:L105` — Child lifetime and uncertain death | P04, P09, P10 |
| A-051 | `acceptance.md:L106` — Durable launch ordering | P03, P04, P10 |
| A-052 | `acceptance.md:L107` — Post-spawn logging failure | P04, P10 |
| A-053 | `acceptance.md:L108` — Crash-window reconciliation | P03, P10, P15 |
| A-054 | `acceptance.md:L109` — Event provenance and reasons | P10 |
| A-055 | `acceptance.md:L110` — Overlap classification | P10, P12 |
| A-056 | `acceptance.md:L111` — Clock and coverage uncertainty | P04, P10 |
| A-057 | `acceptance.md:L112` — Concurrent structured file writes | P03, P10, P13 |
| A-058 | `acceptance.md:L113` — Persistent log and rotation | P10, P16 |
| A-059 | `acceptance.md:L114` — Log access and privacy | P16 |
| A-060 | `acceptance.md:L115` — Automatic overlap lookup | P10 |
| A-061 | `acceptance.md:L116` — Missing-log investigation | P10, P16 |
| A-062 | `acceptance.md:L117` — Investigation and closure boundaries | P14, P16 |
| A-063 | `acceptance.md:L118` — Independent caller execution | P18 |
| A-064 | `acceptance.md:L119` — Compatibility without task-route cutover | P18 |
| A-065 | `acceptance.md:L120` — Checked plan input adapters | P06, P18 |
| A-066 | `acceptance.md:L121` — Checked rejection without fallback | P07, P09, P18 |
| A-067 | `acceptance.md:L122` — Tier-specific plan scope | P06, P09 |
| A-068 | `acceptance.md:L123` — Independent evidence separation | P18 |
| A-069 | `acceptance.md:L124` — Independent raw outcomes | P18 |
| A-070 | `acceptance.md:L125` — Shared execution preservation | P18 |
| A-071 | `acceptance.md:L126` — Compatibility repair provenance | P18 |
| A-072 | `acceptance.md:L127` — Required configuration preflight | P08 |
| A-073 | `acceptance.md:L128` — Configuration values and provenance | P08 |
| A-074 | `acceptance.md:L129` — Base path and deployment configuration | P08 |
| A-075 | `acceptance.md:L130` — Port assignment and conflicts | P08, P09 |
| A-076 | `acceptance.md:L131` — Build-only port values | P08 |
| A-077 | `acceptance.md:L132` — Defaults | P08 |
| A-078 | `acceptance.md:L133` — Derived tier status | P06, P08 |
| A-079 | `acceptance.md:L134` — Overrides | P06, P08 |
| A-080 | `acceptance.md:L135` — Boundary | P06, P07 |
| A-081 | `acceptance.md:L136` — Task substitution | P06, P07 |
| A-082 | `acceptance.md:L137` — Result checks | P08 |
| A-083 | `acceptance.md:L138` — Policy edit | P07 |
| A-084 | `acceptance.md:L139` — Completion | P13 |
| A-085 | `acceptance.md:L140` — Ad-hoc route | P13 |
| A-086 | `acceptance.md:L141` — Approvals | P13 |
| A-087 | `acceptance.md:L142` — Transitions | P13 |
| A-088 | `acceptance.md:L143` — Rejection | P13 |
| A-089 | `acceptance.md:L144` — Crash safety | P13, P15 |
| A-090 | `acceptance.md:L145` — Races | P13 |
| A-091 | `acceptance.md:L146` — Final-write coordination | P13 |
| A-092 | `acceptance.md:L147` — Optional writer-lock adapter | P13 |
| A-093 | `acceptance.md:L148` — Snapshots | P08, P13 |
| A-094 | `acceptance.md:L149` — Output exclusions | P09, P10 |
| A-095 | `acceptance.md:L150` — Isolation | P09 |
| A-096 | `acceptance.md:L151` — Provenance | P12 |
| A-097 | `acceptance.md:L152` — Retries | P11, P12 |
| A-098 | `acceptance.md:L153` — Alternate diagnostics | P11 |
| A-099 | `acceptance.md:L154` — Independence | P12, P18 |
| A-100 | `acceptance.md:L155` — Matching | P12 |
| A-101 | `acceptance.md:L156` — Lifecycle | P12, P15 |
| A-102 | `acceptance.md:L157` — Ownership | P12 |
| A-103 | `acceptance.md:L158` — Completeness | P12, P13 |
| A-104 | `acceptance.md:L159` — Results | P13 |
| A-105 | `acceptance.md:L160` — Uncatalogued default | P12 |
| A-106 | `acceptance.md:L161` — Task-local positive | P12 |
| A-107 | `acceptance.md:L162` — Task-local negative | P12 |
| A-108 | `acceptance.md:L163` — Evidence acceptance | P12, P13 |
| A-109 | `acceptance.md:L164` — Capability boundary | P11, P16 |
| A-110 | `acceptance.md:L165` — Local dispatch | P09 |
| A-111 | `acceptance.md:L166` — Ordinary-task route | P18 |
| A-112 | `acceptance.md:L167` — Active-phase sequence | P07, P18 |
| A-113 | `acceptance.md:L168` — User review boundary | P13, P18 |
| A-114 | `acceptance.md:L169` — Workflow separation | P18 |
| A-115 | `acceptance.md:L170` — No managed completion | P13, P18 |
| A-116 | `acceptance.md:L171` — Plan identity | P06, P07 |
| A-117 | `acceptance.md:L172` — Recovery | P15 |
| A-118 | `acceptance.md:L173` — Terminal states | P13, P14 |
| A-119 | `acceptance.md:L174` — Owner closure authority | P14 |
| A-120 | `acceptance.md:L175` — Owner closure evidence | P14 |
| A-121 | `acceptance.md:L176` — Owner closure mode | P14 |
| A-122 | `acceptance.md:L177` — Owner closure missing validation | P14 |
| A-123 | `acceptance.md:L178` — Owner closure lifecycle | P14 |
| A-124 | `acceptance.md:L179` — Owner closure idempotency | P14 |
| A-125 | `acceptance.md:L180` — Owner closure boundaries | P14 |
| A-126 | `acceptance.md:L181` — Agent-native owner closure | P14, P18 |
| A-127 | `acceptance.md:L182` — Security | P03, P04, P07, P16 |
| A-128 | `acceptance.md:L183` — Migration | P03, P07, P15, P18 |
| A-129 | `acceptance.md:L184` — Bootstrap cutover | P05, P18 |
| A-130 | `acceptance.md:L185` — Evidence index | P16 |
| A-131 | `acceptance.md:L186` — Backup and restore readiness | P15 |
| A-132 | `acceptance.md:L187` — Stale allocator backup | P03, P15 |
| A-133 | `acceptance.md:L188` — Restore writers and permissions | P15 |
| A-134 | `acceptance.md:L189` — Classification lineage | P12 |
| A-135 | `acceptance.md:L190` — Corroboration duplication | P12 |
| A-136 | `acceptance.md:L191` — Evidence availability states | P16 |
| A-137 | `acceptance.md:L192` — Evidence health inspection | P16 |
| A-138 | `acceptance.md:L193` — Retention dependencies | P16 |
| A-139 | `acceptance.md:L194` — Portable evidence export | P16 |
| A-140 | `acceptance.md:L195` — Export non-authority | P16 |
| A-141 | `acceptance.md:L196` — Owner closure visibility | P14, P16 |

### Finite-budget acceptance matrix

The eighteen budget acceptance assertions form **nineteen** source rows (the heading row is excluded).

| Ledger ID | Canonical case | Owner pieces |
| --- | --- | --- |
| B-001 | `validation-budgets.md:L256` — All entry points/direct bypass | P04, P09 |
| B-002 | `validation-budgets.md:L257` — Policy applicability | P02, P05, P18 |
| B-003 | `validation-budgets.md:L258` — Invalid/changed limits | P02, P09 |
| B-004 | `validation-budgets.md:L259` — Cumulative dispatch | P02, P09, P11 |
| B-005 | `validation-budgets.md:L260` — Narrowed lineage | P02, P09 |
| B-006 | `validation-budgets.md:L261` — Structured evidence/capture | P04, P10, P16 |
| B-007 | `validation-budgets.md:L262` — Phase expiry | P04, P09 |
| B-008 | `validation-budgets.md:L263` — Clock/admission | P04, P09 |
| B-009 | `validation-budgets.md:L264` — Test/hook wiring | P04, P09 |
| B-010 | `validation-budgets.md:L265` — Async/sync/hooks/subprocesses | P04, P09 |
| B-011 | `validation-budgets.md:L266` — Late zero/masking | P04, P09 |
| B-012 | `validation-budgets.md:L267` — Post-spawn journal failure | P03, P04, P10 |
| B-013 | `validation-budgets.md:L268` — Retained disposition | P03, P15 |
| B-014 | `validation-budgets.md:L269` — Independent startup/loss | P04 |
| B-015 | `validation-budgets.md:L270` — New termination descendants | P04 |
| B-016 | `validation-budgets.md:L271` — Watch/remote misuse | P04, P09 |
| B-017 | `validation-budgets.md:L272` — Evidence/recovery deadlines | P04, P15, P16 |
| B-018 | `validation-budgets.md:L273` — Inputs/shutdown snapshots | P08, P09 |
| B-019 | `validation-budgets.md:L274` — Preservation/readiness | P04, P18 |

### Staging/lifecycle and runtime-reclaim clauses

| Ledger ID | Canonical clause/case | Owner pieces |
| --- | --- | --- |
| S-001 | `staging-and-lifecycle.md:§1` — Discover governance before selecting a route | P01, P02, P05, P18 |
| S-002 | `staging-and-lifecycle.md:§2` — Separate staging and genuine activation | P02, P05, P06, P07, P18 |
| S-003 | `staging-and-lifecycle.md:§3` — Mandatory recovery disposition and authoritative exclusion | P03, P09, P15 |
| S-004 | `staging-and-lifecycle.md:§4` — Independent gate and whole-tree supervision | P04, P05, P09 |
| S-005 | `staging-and-lifecycle.md:§5` — Untrusted input shapes and structured outcomes | P08, P09 |
| S-006 | `staging-and-lifecycle.md:§6` — Verification and preservation | P01, P12, P18 |
| R-OWN | `runtime-reclaim.md:§2` — Trusted host/platform, Failure Gate, and Port Authority responsibilities are separate; none can mint another role's authority | P01, P04, P17, P18 |
| R-001 | `runtime-reclaim.md:L327` — Valid exact route | P17, P18 |
| R-002 | `runtime-reclaim.md:L328` — Missing or forged source | P17 |
| R-003 | `runtime-reclaim.md:L329` — Binding substitution | P17 |
| R-004 | `runtime-reclaim.md:L330` — Production and invalid attestation | P17 |
| R-005 | `runtime-reclaim.md:L331` — Replay and concurrency | P17 |
| R-006 | `runtime-reclaim.md:L332` — Authority during escalation | P17 |
| R-007 | `runtime-reclaim.md:L333` — Strict acknowledgements | P17 |
| R-008 | `runtime-reclaim.md:L334` — Lost responses and deadlines | P17, P15 |
| R-009 | `runtime-reclaim.md:L335` — Partial effects and survivors | P17, P15 |
| R-010 | `runtime-reclaim.md:L336` — Recovery and crash windows | P15, P17 |
| R-011 | `runtime-reclaim.md:L337` — Retained-error recovery | P15, P17 |
| R-012 | `runtime-reclaim.md:L338` — Gate/watchdog | P04, P17 |
| R-013 | `runtime-reclaim.md:L339` — Malformed shapes | P08, P17 |
| R-014 | `runtime-reclaim.md:L340` — Evidence and coverage | P16, P17 |
| R-015 | `runtime-reclaim.md:L341` — Admission and supervision | P04, P17 |

### Router verification-plan acceptance

| Ledger ID | Canonical requirement | Owner pieces |
| --- | --- | --- |
| V-01 | `installation-verification-plan.md:§ Required plan output, ordered task V-01` — Discover sources, references, Project format and capabilities; keep wiring pending | P01, P18 |
| V-02 | `installation-verification-plan.md:§ Required plan output, ordered task V-02` — Pin clause obligations, provisional methods and permitted resolution; delivered identity remains pending | P01, P18 |
| V-03 | `installation-verification-plan.md:§ Required plan output, ordered task V-03` — After primary delivery, independently verify readiness/handoff, rediscover wiring and classify differences | P01, P18 |
| V-04 | `installation-verification-plan.md:§ Required plan output, ordered task V-04` — Resolve methods only through authority without changing obligations; read back revised executable payload | P01, P18 |
| V-05 | `installation-verification-plan.md:§ Required plan output, ordered task V-05` — Run applicable checks and recheck evidence binding at report acceptance | P18; P01 documents blocked/not-run status |

P01 supplies the source/planning manifest and provisional host map required by V-01/V-02. The primary's discovery snapshot listed the existing P01 verifier task `#69` as pending/parent-blocked. The later verifier task API readback is recorded separately in the verifier report; it does not turn task lifecycle into acceptance. V-03–V-05 remain future obligations, not P01 results.

### Router task-handoff acceptance matrix

These are required host-acceptance scenarios, not claims that task APIs or host tests are installed. For this discovery, P01 pins and maps the case; P18 owns real caller/dependency/cutover acceptance. Additional owner pieces handle the named decision, source, snapshot, evidence, completion, or recovery contract.

| Ledger ID | Canonical case | Owner pieces |
| --- | --- | --- |
| H-001 | `router-task-handoff-acceptance.md:L13` — New primary | P01, P18 |
| H-002 | `router-task-handoff-acceptance.md:L14` — Existing surfaced Install/Apply | P01, P18 |
| H-003 | `router-task-handoff-acceptance.md:L15` — Surfaced durable Draft/Plan | P01, P18 |
| H-004 | `router-task-handoff-acceptance.md:L16` — Suggestion or uncommitted draft | P01, P18 |
| H-005 | `router-task-handoff-acceptance.md:L17` — Wrong or ambiguous primary | P01, P18 |
| H-006 | `router-task-handoff-acceptance.md:L18` — Finalization and mutation | P01, P13, P18 |
| H-007 | `router-task-handoff-acceptance.md:L19` — Failed/cancelled primary | P01, P18 |
| H-008 | `router-task-handoff-acceptance.md:L20` — Completed surfaced primary | P01, P18 |
| H-009 | `router-task-handoff-acceptance.md:L21` — Repeated surfacing and duplicate race | P01, P03, P18 |
| H-010 | `router-task-handoff-acceptance.md:L22` — Source becomes available | P01, P18 |
| H-011 | `router-task-handoff-acceptance.md:L23` — Legacy key and drift | P01, P06, P18 |
| H-012 | `router-task-handoff-acceptance.md:L24` — Dependency creation/readback | P01, P18 |
| H-013 | `router-task-handoff-acceptance.md:L25` — Companion confirmation | P01, P18 |
| H-014 | `router-task-handoff-acceptance.md:L26` — No recursion or approval side effects | P01, P07, P18 |
| H-015 | `router-task-handoff-acceptance.md:L27` — Direct verification-only request | P01, P18 |
| H-016 | `router-task-handoff-acceptance.md:L28` — R-01 first Install versus missing Apply source | P01, P18 |
| H-017 | `router-task-handoff-acceptance.md:L29` — R-02 persisted plan truncation | P01, P07, P18 |
| H-018 | `router-task-handoff-acceptance.md:L30` — R-03 cancelled or failed verifier | P01, P18 |
| H-019 | `router-task-handoff-acceptance.md:L31` — R-03 stale or blocked verifier | P01, P18 |
| H-020 | `router-task-handoff-acceptance.md:L32` — R-04 post-barrier primary change | P01, P13, P18 |
| H-021 | `router-task-handoff-acceptance.md:L33` — R-04 change before execution | P01, P08, P18 |
| H-022 | `router-task-handoff-acceptance.md:L34` — R-05 reference/specification drift | P01, P18 |
| H-023 | `router-task-handoff-acceptance.md:L35` — R-05 delivered-source evidence | P01, P08, P16, P18 |
| H-024 | `router-task-handoff-acceptance.md:L36` — R-06 uncertain primary commit | P01, P15, P18 |
| H-025 | `router-task-handoff-acceptance.md:L37` — R-06 uncertain verifier commit | P01, P15, P18 |
| H-026 | `router-task-handoff-acceptance.md:L38` — R-07 canonical key equivalence | P01, P06, P18 |
| H-027 | `router-task-handoff-acceptance.md:L39` — R-08 release without delivery | P01, P18 |
| H-028 | `router-task-handoff-acceptance.md:L40` — Report-only mode reconciliation | P01, P18 |
| H-029 | `router-task-handoff-acceptance.md:L41` — Required companion missing | P01, P18 |
| H-030 | `router-task-handoff-acceptance.md:L42` — Complete package installation | P01, P18 |
| H-031 | `router-task-handoff-acceptance.md:L43` — Multi-target bundle | P01, P18 |
| H-032 | `router-task-handoff-acceptance.md:L44` — Completed primary reporting | P01, P18 |
| H-033 | `router-task-handoff-acceptance.md:L45` — Verified-snapshot final acceptance | P01, P08, P13, P18 |
| H-034 | `router-task-handoff-acceptance.md:L46` — Verifier amendment after linkage | P01, P07, P18 |
| H-035 | `router-task-handoff-acceptance.md:L47` — Identity resolution discovery | P01, P18 |
| H-036 | `router-task-handoff-acceptance.md:L48` — Missing-source verification planning | P01, P18 |
| H-037 | `router-task-handoff-acceptance.md:L49` — D-01 two-phase creation | P01, P18 |
| H-038 | `router-task-handoff-acceptance.md:L50` — D-02 expected baseline mutation | P01, P08, P18 |
| H-039 | `router-task-handoff-acceptance.md:L51` — D-03 relocated entry point | P01, P18 |
| H-040 | `router-task-handoff-acceptance.md:L52` — D-04 equivalent implementation | P01, P18 |
| H-041 | `router-task-handoff-acceptance.md:L53` — D-05 incorrect command assumption | P01, P18 |
| H-042 | `router-task-handoff-acceptance.md:L54` — D-06 requirement weakening | P01, P18 |
| H-043 | `router-task-handoff-acceptance.md:L55` — D-07 ambiguous equivalence | P01, P18 |
| H-044 | `router-task-handoff-acceptance.md:L56` — D-08 independent handoff inspection | P01, P18 |
| H-045 | `router-task-handoff-acceptance.md:L57` — D-09 legacy missing handoff | P01, P18 |
| H-046 | `router-task-handoff-acceptance.md:L58` — D-10 method resolution and task lineage | P01, P07, P18 |
| H-047 | `router-task-handoff-acceptance.md:L59` — D-11 missing amendment route | P01, P07, P18 |
| H-048 | `router-task-handoff-acceptance.md:L60` — D-12 material renewal | P01, P07, P18 |
| H-049 | `router-task-handoff-acceptance.md:L61` — D-13 delivery mutation during verification | P01, P08, P13, P18 |
| H-050 | `router-task-handoff-acceptance.md:L62` — D-14 definition parity and Apply boundary | P01, P18 |
| H-051 | `router-task-handoff-acceptance.md:L63` — D-15 output-only acceptance | P01, P18 |
| H-052 | `router-task-handoff-acceptance.md:L64` — D-16 evidence-preserving correction | P01, P08, P16, P18 |

## Canonical test and adapter allocation

All tests below are source-pinned inputs in the manifest. They were not executed for Piece 01. A source test, fixture, or prior recorded test result does not equal host acceptance.

| Ledger ID | Pinned test/source | Acceptance clauses and owning pieces |
| --- | --- | --- |
| T-001 | `tests/test_activation_policy_guidance.py` | Policy/source setup and bootstrap/cutover separation; P02, P07, P18. |
| T-002 | `tests/test_authorized_continuation.py` | Authorized continuation, bounded next proposal, lifecycle/report boundaries; P02, P15, P18. |
| T-003 | `tests/test_staging_lifecycle.py` | ACTIVE/INACTIVE/UNKNOWN, staging, recovery, supervisor and input gates; P01, P02, P05, P07, P15, P17, P18. |
| T-004 | `tests/test_validation_budgets.py` | Finite entry points, inherited limits, phase deadlines, descendants, capture and cleanup; P02, P04, P09, P11, P15, P18. |
| T-005 | `tests/test_runtime_reclaim_contract.py` | Protected reclaim bindings, errors, concurrency and no-signal denials; P04, P15, P17, P18. |
| T-006 | `tests/test_audit_regressions.py` | Capture/clock/lifecycle and classification/acceptance boundary; P04, P08, P10, P12, P13. |
| T-007 | `tests/authoring_supervision.py` and `scripts/run-authoring-tests.py` | Test-only fixture supervision/launcher; does not prove actual host authority; P04/P05 source review only. |
| T-008 | `reference/adapters/posix-writer-lock/{writer_lock.py,tests/test_writer_lock.py}` | Optional primitive and its isolated tests; P13 source option only, not required host implementation or live writer proof. |

## Delivery-stage assessment

This Piece 01 ledger covers all 141 core acceptance rows, 19 finite-budget cases, 6 staging/lifecycle clauses, 15 runtime-reclaim cases plus the distinct role boundary, all 18 implementation and all 18 independent-verifier contracts, 5 Router verification-plan tasks, 52 Router handoff cases, and the canonical test-source files. Its coverage statement is about extraction and allocation only. All later runtime cases retain their own owner, prerequisites and evidence requirements; their status is **NOT RUN / BLOCKED where current authority or proof is absent**. The tracked series records the three original Router planning-time digests, but the historical file blobs/provenance were not found in the accessible read-only Git history. That content/provenance comparison remains **UNKNOWN / BLOCKED** in the source manifest.
