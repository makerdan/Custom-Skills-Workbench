# FG-02-I — Proposed bootstrap-admission source stage

**Disposition: PROPOSAL-ONLY outcome accepted by owner direction.** The owner accepts the completed answers/assessments as fulfilling Task 96. Future source changes and validation still require their applicable authority; they are not additional conditions on this administrative closure.

The exact closure decision and scope difference are recorded in `failure-gate-fg-02-owner-closeout.md`. No inert implementation or executed regression proof is claimed.

This proposal does not grant authority, allocate a Failure Gate local ID, register a capability, change governing policy, or authorize any command or process launch.

## Initial bindings and reconciled assessment

| Binding | Read-only observation | Source |
| --- | --- | --- |
| Project and root | Skills Workbench; `/home/runner/workspace`; initial proposal HEAD `b883d3ada15bb587010d811cccb1da9c9a7ac808` (historical snapshot) | Initial workspace readback |
| Assigned task plan | Task 96 plan SHA-256 `14469da22af09cb2255a4d972fb552fdfc025a74cc70db4c37a49b2552fe7759` | `.local/tasks/task-96.md` |
| Piece 01 | Planning/discovery acceptance is recorded; it does not grant runtime or code-stage authority. The current task plan identifies Task 82 as the acceptance source. | `failure-gate-fg-01-verifier-report.md`; `failure-gate-v4-series-checkpoint.md` |
| Canonical source closure | Initial discovery matched all 31 regular files in the canonical roots against the Piece 01 manifest: 22 Failure Gate files and 9 Router files. This preserves the initial byte binding, not a new verification during this reconciliation. | `failure-gate-fg-01-source-manifest.md`, SHA-256 `40034926aa094bef673a67623146783d52f682b63a54b7ef58312a5d875c885b` |
| Current policy | Coordinator query returned **STAGED** metadata. An ACTIVE/INACTIVE activation classification remains **UNKNOWN**; no activation is inferred from metadata. | Earlier read-only coordinator query; source observations take precedence over descriptive summaries |
| Local task identity | No FG-02-I local ID established. The query found one historical draft local task with authorization version 0 and no plan. Task 96 is a platform reference, not a local ID. | Earlier coordinator query; no allocator or store mutation performed |
| Current operation decision | **Unavailable.** No current decision record authorizes this different bootstrap/maintenance operation. | Existing operation-specific records below |
| Current effective budget and remaining consumption | **Unavailable/UNKNOWN.** The coordinator source was read in limited scope; no matching current grant or complete remaining-consumption accounting was established. | Earlier read-only query; source map below |
| Independent supervisor for new work | **Unverified.** Historical supervision covered only named, consumed bootstrap callers; ordinary outer supervision is separately recorded as blocked. | `failure-gate-bootstrap-report.md`; `failure-gate-ordinary-supervision-proof.md` |

The user identified “the Agent, the Agent's default settings” as the expected source. This candidate was checked against Replit's official documentation on 2026-10-06. The Task system documentation describes task stages and background-task limits as platform-managed controls, not application-level records; Managing Your Spend describes usage tracking but does not expose a direct application API for current remaining execution budget. These do not provide an app-bindable, operation-specific approval, budget grant, or remaining-consumption readback. The candidate therefore does not satisfy this task's authority-source contract.

Official references: [Task system](https://docs.replit.com/core-concepts/agent/task-system) and [Managing Your Spend](https://docs.replit.com/billing/managing-spend). This documentation check does not prove that no other host capability exists; it establishes that “Agent default settings” is not a verified source through the documented application interface.

During initial documentary discovery, canonical digests were compared against the Piece 01 manifest using file hashing; no coordinator/database, process, service, workflow, or platform task API was queried in that initial phase. Later discovery used the read-only Store interface, and subsequent user-requested planning used platform task APIs. No canonical source, project-local authority or store state was changed.

## Authoritative query reconciliation

Under the user's evidence-precedence instruction and update request, actual queried-source results govern the records/fields and observation time returned, ahead of stale documentary summaries. The earlier coordinator query returned governance STAGED, one historical draft local task FG-00000001 with authorization version 0 and no plan, zero plan_review and bounded_bootstrap_review decisions, no plan_reviewed events, and no bounded-bootstrap-v1 metadata. The historical report's bootstrap decision, four run IDs and associated evidence were absent from the inspected sources.

The coordinator was not reopened in this update. Query observations are authoritative for the inspected records at query time; they neither create a matching decision nor establish complete current consumption, expiry, revocation or new-operation supervision. The historical bootstrap consumption report does not override the inspected missing decision/accounting lineage.

The platform task query confirms intake Tasks 99, 100 and 101 are merged and have no dependencies. Their separate result reports were subsequently found in unsynced Git history and read directly: approval intake at `249e7a83c0ca14d81da5464aee1159ffd08bbf40:docs/validation/failure-gate-fg-02-source-stage-approval-intake.md`, budget intake at `902b8b8b2191d137e4805115a2b5827bb36f08e9:docs/validation/failure-gate-fg-02-budget-accounting-intake.md`, and supervisor intake at `3151b83eea52c3cc78b9288d6311ed2ee47e9778:docs/validation/failure-gate-fg-02-supervisor-evidence-intake.md`. Each completed documentary intake with a BLOCKED prerequisite outcome and no new authority or execution.

All three inspected an older checkout missing the current FG-02 subject documents and performed no coordinator query themselves. Those findings are snapshot-specific; the documents are present in this checkout, and the dossiers cannot override the earlier primary source-query observations. Documentary availability is resolved here, but the reports did not obtain an authentic matching decision, finite grant/accounting, or independent supervisor record. Their scoped owner/evidence requests remain relevant after rebinding to the available current subject documents. No checkout, merge, synchronization or import of the reports was performed. See the handoff for immutable Git locators and the factual recheck for evidence precedence.

## Approval and budget source map

| Candidate source | What the record supports | FG-02-I applicability |
| --- | --- | --- |
| `failure-gate-bootstrap-approval.json` | Historical owner response for the exact `installation.coordination-bootstrap` plan and fixed four-caller sequence. The report says the 900-second allowance was consumed; the queried store lacked its matching decision/accounting lineage. | **Not applicable; operation-bound and no current corroborated grant.** It cannot approve this source stage or a new bootstrap run. |
| `failure-gate-installation-approval.json` | Historical local conversation approval for the prior installation scope, with a 2,700-second allowance and two complete acceptance passes. The Piece 01 proposal says those allowances are historical and not reusable. | **Not a current grant or budget.** |
| `failure-gate-host-integration-inventory-approval.json` | A 300-second read-only source/coordinator review; the record says budget exhausted, completion timing unverified, and expressly excludes code changes, tests, builds, registry mutation, activation, and task mutation. | **Not applicable; exhausted and excluded code.** |
| `failure-gate-staged-admission-proposal.md` | A separate, explicitly proposed staged-admission scope with prospective 15-minute parent and narrowed phase values. Its heading says “PROPOSED ONLY — no source edits, code execution, approval or budget”; the parent allowance is conditional on an actual specific owner response. | **Not an approval or current budget for FG-02-I.** Its proposed values are not reused. |
| Interactive local plan review (`Gate.approve_plan`) | `scripts/failure_gate/gate.py` validates the exact local plan and installation bindings, requires a TTY and the exact `approve <local_id> <plan_digest>` phrase, then writes a `plan_review` decision row and `plan_reviewed` event atomically in `.failure-gate/coordinator.sqlite3`. The recorded payload binds the plan and digest, policy and tier digests, plan path, and empty parameters; reviewer identity is not authenticated. | **Configured route for ordinary local plan review, not verified for bootstrap/maintenance admission.** The host map records zero actual plan-review decisions; no current FG-02-I local ID or decision exists. |
| Installation approval (`Gate.install`) | The installation route checks the exact captured receipt and answer in `failure-gate-installation-approval.json`, then stores a bound installation decision and metadata in the coordinator. | **Historical installation decision, not a current FG-02-I decision or reusable budget.** |
| Fixed bootstrap approval/capture route | `scripts/failure-gate-bootstrap.py review/prove` and `bootstrap.capture_owner_decision` validate the receipt for the exact fixed bootstrap subject and check its coordinator decision, metadata, reservations and evidence. Those corresponding records were absent in the earlier query. | **Source route for `installation.coordination-bootstrap` only.** Historical consumption is reported, not current corroborated accounting; no applicable source-stage grant. |
| Replit plan-approval event | The capability record says no trusted non-terminal plan-approval source or adapter was exposed or verified in this workspace. | **Unavailable/unverified.** |
| `failure-gate-policy.json` `limits` and `supervisor.LIMITS` | Local code-owned limit declarations and input ceilings, not an independently authoritative grant, current remaining-consumption record, or proof of independent oversight. | **Representation evidence only; not budget authority.** |
| Replit Agent default settings (candidate identified by the user) | Official documentation describes platform-managed task/background controls, not an application-visible exact approval decision or remaining-budget API. | **Not a verified source for this contract.** |
| Task 96, task status, local files, fixture receipts, or prior approvals | Project task assignment and documentary artifacts. | **Not authority or a current budget source.** |

No applicable approved bootstrap/maintenance decision or current finite budget was established from permitted source discovery and the earlier read-only coordinator query. This is **UNKNOWN / BLOCKED**, not proof that no external owner or platform capability exists.

## Configured route and budget-source resolution

The host has a configured local approval route, but it is domain- and record-specific:

- **Ordinary local plan review:** `Gate.approve_plan` is the configured human-review route. A real accepted review is recorded transactionally as a local `plan_review` decision and event in the coordinator. The coordinator query returned zero such decisions/events; a route's presence does not create approval for this task. The local identity is not authenticated, and the code is not a Replit platform-event adapter.
- **Installation:** `Gate.install` consumes the exact prior installation receipt and stores the installation decision/binding in the coordinator. That is the historical prior installation, not a new bootstrap or source-stage decision.
- **Bootstrap/maintenance:** the fixed capture route reads the real response from `failure-gate-bootstrap-approval.json`, validates its full pinned subject, then checks the corresponding coordinator decision, boot-bound clock, reservations, and evidence. It authorized only `installation.coordination-bootstrap`, bound to `FG-00000001`, the fixed source closure and four-caller sequence. The handoff reports its one-shot budget consumed. It cannot be borrowed or renewed for FG-02-I.
- **Replit platform plan-approval event:** no trusted event source/capture adapter is configured or verified. Agent default settings, platform task status, and generic task/command/merge actions are not substitutes.

The budget sources are also distinct from code ceilings:

- **Ordinary work:** policy and `supervisor.LIMITS` provide finite configured maxima/representations. Effective authorization and remaining consumption require a matching local task/plan decision and coordinator accounting. Queried metadata is STAGED; the query found no matching decision, complete remaining consumption was not established, and the ordinary CLI lacks verified independent outer supervision. No current task-bound ordinary budget or safe launch route is established.
- **Fixed bootstrap:** the historical plan/receipt describes its finite envelope. Authoritative accounting would be the bound coordinator metadata/decision/run/event lineage and associated evidence. The earlier query found that lineage absent, conflicting with the report's historical consumed claim. No present remaining value or reusable grant is asserted.
- **Task 96:** no local ID, current approval decision, current budget grant, remaining-consumption readback, or independent validation supervisor is established. No validation launch is authorized.

The descriptive capability manifest now explicitly maps these separate decision routes, persistence locations, budget-source roles, and status limits. It remains a locator, not a live registry or authority.

## Documentary revision pins

The following records were SHA-256 bound read-only on 2026-10-06. These are preserved initial discovery hashes, not current hashes of documents subsequently reconciled. They identify reviewed historical bytes and do not confer authority.

| Record | SHA-256 |
| --- | --- |
| `.local/tasks/task-96.md` | `14469da22af09cb2255a4d972fb552fdfc025a74cc70db4c37a49b2552fe7759` |
| `failure-gate-fg-01-source-manifest.md` | `40034926aa094bef673a67623146783d52f682b63a54b7ef58312a5d875c885b` |
| `failure-gate-fg-01-installation-proposal.md` | `b65eff0981d86a1bde892aa7ccdebcf13a404d62dd5aff9b4e22f1c910f0427a` |
| `failure-gate-fg-01-verifier-report.md` | `6be495b2168d499633bdfb6dbac019762e93e80aa7ceb71c3a0746643589ec30` |
| `failure-gate-staged-admission-proposal.md` | `f6fd2909f9cd929f2c184a134c251037f4418e7a27649efe9bfe9dd74b03fea7` |
| `failure-gate-bootstrap-plan.json` | `2d80af0404f2117fe8ca34111c41d73924cdf503cc6f35279529fd7a4399313c` |
| `failure-gate-bootstrap-approval.json` | `31f7c78a9611b709d4ae2fbcea4d873b639183df5fa8e07e429eec916ba7adcf` |
| `failure-gate-installation-approval.json` | `dd915735139f21fffecb035889774bb4f4d233f220ece49b54519aec4637a120` |
| `failure-gate-host-integration-inventory-approval.json` | `5c9e2090cf2620fd5e02d382e7bef78e4135517841297e667e5ae9ef8c2b6bb7` |
| `failure-gate-bootstrap-review.json` | `a07d5f86a6b3a20fb57f003c6efd5f6b975bd2ffa700c215a578ab9d0953ea18` |
| `failure-gate-bootstrap-handoff.md` | `bb99450fb770c63ca1c0bc38ae5872601332c2a31525195e7daae7a00b39feb4` |
| `failure-gate-bootstrap-report.md` | `ebeff2c1f4dedfd3dc77ceb7cb19a791c986aa0721a151943eee95b939d2d143` |
| `failure-gate-ordinary-supervision-proof.md` | `9d966e7639b7db8d75869fffaa41292843e3f2fa6ae6cb37193af1b4309652d7` |
| `failure-gate-host-integration-map.md` | `96f06e0ce4b856445725380ce64f7764a7eb37dd2ec89baf5fc1965a6ac128cc` |
| `failure-gate-policy.json` | `d945a2970c8721c23b658ea1cee51e6b6a89395280405adbba687614808610ac` |
| `failure-gate-capabilities.json` | `716bea4de4f2e1c3cc1c4530bdf737542433510b7d4b1e6c212942dae8508cb7` |

## Exact scope proposed for a separate decision

If the responsible local approval and budget owners provide an applicable supported route, the requested *source-only* operation would be:

- **Operation label (proposal only):** `installation.bootstrap-admission-contract-stage`.
- **Capability:** one bounded source-authoring capability; no tier is selected and no runtime dispatch is permitted.
- **Local identity:** a fresh, verified project-local namespace and local ID, obtained through the actual authorized allocator before any governed operation. Do not use platform Task 96 or historical `FG-00000001`.
- **Plan/source binding:** a finalized plan version and digest; the then-current canonical Failure Gate and Router source closure; and a fresh digest of every listed host input and proposed output. Rebind if any source changes.
- **Parameters:** exact empty object `{}`. No caller-selectable operation, tier, path, command, environment, deadline, budget, retry, or evidence reference.
- **Permitted future source paths only:** a new inert admission module under `scripts/failure_gate/`, a versioned schema under `docs/validation/`, focused denial cases in `scripts/failure_gate/tests.py`, and the tracked proposal/handoff. The final plan must pin the exact paths and their transitive source closure before approval.
- **Transitive scope:** bounded reads of the pinned canonical package, the current bootstrap plan/approval/handoff/report, policy/capability records, `bootstrap.py`, `cli.py`, `gate.py`, `store.py`, `supervisor.py`, and the named task plan. No imports, CLI, store, test, build, hook, workflow, service, worker, scheduler, remote target, process signal, or hidden command path.
- **Preservation:** do not edit or wire `bootstrap.py`, `cli.py`, policy, runtime tier/capability registries, package scripts, workflows, existing review routes, independent callers, or coordinator state under this proposed source-only scope. The existing capability locator received only the explicitly requested descriptive decision/budget-source mapping; it grants no authority and is not runtime wiring. The new adapter must remain inert and unregistered.

This is not permission to create those sources. The current task assignment does not replace a project-local approval, source binding, or budget record.

## Effective-limit contract required before any future dispatch

No effective numerical limit or remaining budget is presently authorized. The following is the required schema/validation contract, not a set of assigned values:

1. The authority source must provide an exact, versioned record binding operation, namespace/local ID, plan version/digest, source-closure digest, one named bounded capability, permitted parameters, transitive allowlist, policy/authorization version, stable decision reference/digest, budget-source reference/version, issuance/expiry, revocation state, and current cumulative consumption.
2. The record must provide explicit finite values for each applicable phase, parent/session, attempt count and cumulative attempt cost, cleanup reserve, and evidence-capture duration and byte ceiling. Missing fields, extra fields, zero/negative values, booleans, non-integers, NaN/Infinity, overflow, disabled limits, and unauthorized enlargement deny before dispatch. No defaults or fallback route.
3. Use the verified host representation: current `supervisor.validate_limits` requires the exact known map, strict Python integers (booleans are rejected), positive values no greater than the per-field code ceiling or `2147483647`, and `run_seconds <= installation_seconds`. These are safe-shape checks only; the code ceilings are not an approval or source for current grant values.
4. Validate aggregate arithmetic against the authority-provided parent bound before dispatch. Each child/phase/attempt must be no greater than every applicable parent and original narrowed ancestor; the sum of sequential phase costs plus reserved cleanup and evidence must fit the parent. Overflow or unknown aggregation semantics denies.
5. Atomically reserve the authorized attempt and its cost before any future process launch. A started, failed, or cancelled attempt remains consumed; no re-labeling, wrapper/session reset, refund, or retry. Parallel work shares the same parent lifetime and authorized aggregate resource accounting.
6. Use the original verified monotonic clock and parent deadline for elapsed time. Wall time is issuance/expiry metadata only. A stale boot/clock binding cannot renew a deadline. Recheck authority and remaining budget after any queue and immediately before dispatch.
7. Revocation, expiry, decision/source/plan drift, or unknown consumption blocks new dispatch. After authorized dispatch, only already-bound finite cleanup may supervise the exact owned work; uncertain termination, evidence, or acknowledgement retains exclusion and requires separate recovery authority.
8. Evidence limits must bound collection while streaming, preserve raw outcomes and the authoritative acknowledgement, and never convert missing/truncated evidence into success.

The real budget-source mapping and actual values are still required from the responsible local budget/approval owner. Historical `900`, `2700`, and `300` second allowances are explicitly not reused.

## Authority-domain separation

| Domain | Required separate source | Status for this proposal |
| --- | --- | --- |
| Bootstrap/source-stage | Exact current maintenance decision and fresh finite budget bound to this operation and source closure | **BLOCKED / unavailable** |
| Ordinary activation | Its existing exact plan-approval route and deterministic policy decision | Remains separate; ordinary governance **STAGED**, current state **UNKNOWN** |
| Diagnostics/comparison | Separately approved bounded capability and shared attempt accounting | No grant |
| Recovery | Exact incident/run/lease decision, bounded recovery budget, and acknowledged provider | No grant |
| Reclaim | Trusted host attestation, authentic disruption approval, protected checked claim and outcome acknowledgement | **BLOCKED**; not borrowable |
| Cutover | Separate scoped cutover approval after required proofs | **Not approved** |

No domain may borrow this proposed source-stage capability or any historical bootstrap evidence. Existing independent callers and the prior governing route remain untouched.

## Decision needed and acceptance boundary

The responsible approval owner must identify a supported current route that can record the actual decision and exact source/plan binding. The responsible budget owner must provide the authoritative budget source/version, the explicit finite values above, current consumption, expiry/revocation handling, and a verified independent supervisor for any future test or process launch. If no applicable route is available, those capabilities remain unavailable; do not install a guessed adapter.

After those records are actually available, the implementation scope would still require a separately bound decision before editing. The source-only acceptance would require an inert, unregistered adapter/schema that rejects caller-authored approval/budget claims, mismatched/stale bindings, invalid/enlarged limits, aggregate/narrowing violations, and cross-domain borrowing. Focused fixtures would be authored but **not run** absent a separate exact validation grant and independently verified finite supervision. Fixture outcomes, if later authorized, would not establish host approval or runtime readiness.

Explicit exclusions: live bootstrap or ordinary validation; policy activation; allocator/store initialization or mutation; local ID allocation without its verified route; budget renewal; caller/CLI wiring; recovery; reclaim; cutover; deployment; remote checks; service/workflow changes; platform task mutation; baseline waiver; and claiming runtime readiness.
