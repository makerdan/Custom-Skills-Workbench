# Proposed amendments for the existing #107 and #108 reviews

**Referenced-binding revision — 2026-10-10.** Values recorded here for owner-edited resource artifacts are historical observations only. Current revised bindings are in `retired-review-cleanup-bindings.json`; earlier unchanged-byte/body-equivalence claims do not bind revised artifacts. Existing future linkage and draft-safety controls remain intact.

**Disposition:** complete tracked replacement payloads and amendment instructions only. Neither active native record was modified, paused, resumed, attached, approved, or started by this authoring work.

## One-invocation owner request

After this repair is delivered, make one explicitly owner-authorized invocation to reconcile and, only if safe, amend the existing Project tasks `#107` and `#108` through a supported native route. Do not create reviewer/intake tasks or substitute another record.

That invocation must:

1. Read the current full task records for `#102`, `#107`, `#108`, and the delivered repair `#109`; verify exact Project/series/target identity, task state, full descriptions, dependencies, update times, and actual available revisions. The records read during this authoring pass are a historical snapshot, not permission to skip a fresh read.
2. Determine whether either active review has begun substantive work or published a report in its isolated workspace. Those facts are currently UNKNOWN; absence of a report from this checkout is not evidence about the isolated workspaces.
3. Establish, from an authentic supported host route and explicit owner authorization, a safe pause/amendment boundary for each record that needs amendment. Do not interrupt or mutate a running reviewer to establish the route. If either reviewer is working and cannot be safely paused, preserve that record and return the exact owner/provider action.
4. Preserve each actual task ID and existing history. Replace the complete description with the exact full body in the payload file below; keep `#106`, add the real installation task `#102`, and add actual repair task `#109` as the delivery prerequisite after its outputs are actually available. `#106` is a historical/readiness finding and cannot replace `#102`.
5. Read each complete primary and amended reviewer record immediately before and after each supported change. Compare the complete UTF-8 bytes/semantic coverage, project, series, target, primary ref/content digest, exact scope, profile revision/digest/key, full report/correction scope, dependency array, and actual state. Independently read both records before substantive review and at report acceptance. Do not claim atomicity if only bracketing reads are available.
6. On an observed mismatch, incomplete/truncated body, changed owner snapshot, lost dependency, changed scope, unclear activity, or uncertain write, leave the actual task pending reconciliation. Use one bounded authoritative lookup by the actual task IDs/request identity before any retry. Never blind-retry, delete, cancel, reopen, replace, approve, activate, or create a duplicate.
7. Report exact actual before/after full descriptions, UTF-8 byte counts/digests, dependency refs, reviewer activity/report status, readiness, supported operation route, and all remaining unknowns. A successful round trip proves only that exact payload in that exact operation; provider-wide size ceilings/truncation guarantees remain unknown.

If no safe pause/amendment and complete-readback route is supported, do not write. Preserve both active records and return this precise request to the owner: **authorize and identify the host-supported safe pause/update/readback operation for these exact existing refs #107 and #108, preserving ongoing reviewer work, so their complete tracked replacement plans can be applied and fully compared without starting, approving, duplicating, or replacing either review.**

## Existing records at the authoring read

These are direct complete task-reader observations, separately recorded from earlier #106 readiness conclusions:

| Ref | Current actual state | Current dependencies | Current full description |
|---|---|---|---|
| `#107` — Confirm the SKILL.md-only orchestration review | `IN_PROGRESS`; updated `2026-10-07T06:02:40.544Z` | `#106` | 1,600 UTF-8 bytes; SHA-256 `69d624225277bc83313b847920a54870c5acd1787dfdc362b8254a4911d8b527` |
| `#108` — Verify orchestration resources and the full plan | `IN_PROGRESS`; updated `2026-10-07T06:23:28.130Z` | `#106` | 1,737 UTF-8 bytes; SHA-256 `62199e6860e9ccaec78d55946fc54cf3dcc1c7d96593618fd8193a033e313309` |

Current substantive-work state, reports in their isolated workspaces, safe-pause support, supported update route, provider payload ceiling, and whether full descriptions round-trip in a native amendment are all **UNKNOWN**. The corresponding report files are absent from the current checkout, but this does not establish their absence from either active workspace.

The exact current primary `#102` is `MERGED`, has no dependencies, is 11,539 bytes, has SHA-256 `6b2a457b2d3cbe1ffc06e3edb6ce0efa3cc1e579637297ead8b1660ed853cd06`, and was updated `2026-10-07T04:41:02.658Z`. Its full bytes are the owner-pinned content snapshot, not a provider finalization receipt. `#109` is an actual `IN_PROGRESS` repair task, updated `2026-10-07T06:26:24.942Z`, depending on `#106` and `#102`; its full plan is 18,478 bytes, SHA-256 `23ceb738787478e575b839089f086050aea78fefd4e5a9284d4df0d7c7d4b44e`. Add it only as the actual repair-delivery dependency, not as proof that repair files have been delivered to a review workspace.

## Exact complete native description payloads

The following file contents are the complete proposed replacement descriptions, byte-for-byte, with no wrapper text to be added by the future authorized writer. They are not short links standing in for a plan.

| Existing native task | Complete description source | UTF-8 bytes | SHA-256 | Exact proposed dependencies | Report and correction scope |
|---|---|---:|---|---|---|
| `#107` | `docs/validation/task-plans/paired-task-orchestration-definition-confirmation.md` | 12,385 | `60f7ec6e83d96399d1826bbcd4672cae01efb5ce6c242dd1879e5273fd0f0c5c` | `#102`, `#106`, `#109` | `docs/validation/paired-task-orchestration-definition-confirmation.md`; corrections limited to `SKILL.md` |
| `#108` | `docs/validation/paired-task-orchestration-verification-plan.md` | 34,043 | `af09da23dbd98184315f232d223f5eb5a120e444f6a37b9870b75df18cd3702d` | `#102`, `#106`, `#109` | `docs/validation/paired-task-orchestration-verification.md`; resource/plan documents only |

The proposed dependency list preserves actual existing `#106`, adds actual installer/primary `#102`, and adds actual repair task `#109` as a delivery prerequisite. Full workspace delivery must still be independently proved before substantive review. Do not infer that dependency release means the required files exist in an isolated review copy.

### #107 exact scope and snapshot key

Scope: `definition-only:paired-task-orchestration/SKILL.md;report:docs/validation/paired-task-orchestration-definition-confirmation.md;corrections:SKILL.md-only`

```json
["owner-snapshot-handoff-v1","https://github.com/makerdan/Custom-Skills-Workbench|/home/runner/workspace|Skills Workbench Project task-board (immutable UUID unavailable)","Custom-Skills-Workbench/failure-gate-v4/18-piece","paired-task-orchestration","#102","sha256:6b2a457b2d3cbe1ffc06e3edb6ce0efa3cc1e579637297ead8b1660ed853cd06","definition-only:paired-task-orchestration/SKILL.md;report:docs/validation/paired-task-orchestration-definition-confirmation.md;corrections:SKILL.md-only","fgv4-owner-snapshot-handoff-2026-10-07-v1","sha256:5ba6bbc5cf3a9106ed6d4ed2cbacca80fc20b95a3d2fa43ceec5bbe91c3d4228"]
```

### #108 exact scope and snapshot key

Scope: `resource-plan:paired-task-orchestration/three-references+failure-gate-v4/18-pieces+shared-protections+checkpoint-history+FG-02-g02-I/V;report:docs/validation/paired-task-orchestration-verification.md;corrections:resources-and-plan-documents-only`

```json
["owner-snapshot-handoff-v1","https://github.com/makerdan/Custom-Skills-Workbench|/home/runner/workspace|Skills Workbench Project task-board (immutable UUID unavailable)","Custom-Skills-Workbench/failure-gate-v4/18-piece","paired-task-orchestration","#102","sha256:6b2a457b2d3cbe1ffc06e3edb6ce0efa3cc1e579637297ead8b1660ed853cd06","resource-plan:paired-task-orchestration/three-references+failure-gate-v4/18-pieces+shared-protections+checkpoint-history+FG-02-g02-I/V;report:docs/validation/paired-task-orchestration-verification.md;corrections:resources-and-plan-documents-only","fgv4-owner-snapshot-handoff-2026-10-07-v1","sha256:5ba6bbc5cf3a9106ed6d4ed2cbacca80fc20b95a3d2fa43ceec5bbe91c3d4228"]
```

These are versioned owner-snapshot identities, not Router finalized-primary keys, provider receipts, task approvals, or runtime grants. Search both exact and applicable legacy keys before any later authorized operation. A different full primary description, project, task ref, scope, or profile digest invalidates this binding and needs explicit renewed owner scope.

## Payload content and independent gates

The complete #107 body retains the canonical Paired definition-only acceptance procedure, source identity, complete applicability boundaries, actual #102 installation binding, `#102/#106/#109` dependency proposal, exact key, own report, and `SKILL.md`-only correction boundary. The missing `skill-install-confirmation` package is recorded but not copied, installed, verified, or declared universally inapplicable.

The complete #108 body retains all original fixed matrix rows `D1–D4`, `S1–S6`, `H1–H3`, `B1–B5`, and `C1–C4`; all three resource references; the full 18-piece/36-payload replacement plan; shared protections; checkpoint/history; separate report; method/delivery reconciliation; and the one-current-pair/no-recursion/runtime gates. It adds a clause-level overlay only to the explicitly listed orchestration handoff clauses. The original specification, existing series plan, manifests, archives, #102 description, and historical findings are not overwritten.

At draft creation, future delivered inputs may remain pending. Before substantive review, each independent reviewer must inventory the actual bound archives, obligation/pre-install/delivered manifests, canonical closure, native full reads, series/checkpoint/history, resources, full plan, and FG-02 drafts in its own workspace. Bind the actual snapshot bytes. If unavailable, report **AWAITING_DELIVERY**, exact missing paths and delivery owner, and one separately authorized invocation-driven recheck. A task status, dependency, merged #102, or another workspace's copy is not delivery evidence.

The owner snapshot route is limited to cooperative native planning/review handoff. It does not waive any local Failure Gate approval/version/tier/grant/accounting, finite budget, independent supervision, final-writer, source/bootstrap/runtime, recovery/reclaim, or cutover condition. The future FG-02 g02 planning handoff requires a separately generated snapshot of its actual primary; it cannot reuse the #102-bound review keys. No FG-02 task or key is created/materialized here.

## Content-size and delivery limitation

The exact payload sizes above are measured UTF-8 bytes of the complete proposed files. No native amendment write, disposable trial task, or payload-size experiment was attempted. The provider's maximum, truncation behavior, safe pause/update interface, and amendment atomicity remain unknown. A later exact full-payload round trip can establish only that particular payload was preserved in that particular operation. If an authorized write is rejected, truncated, or uncertain, retain these tracked drafts and reconcile the authoritative existing record before any retry; never substitute a shorter title/link plan.
