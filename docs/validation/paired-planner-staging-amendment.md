# Paired orchestration planner-staging amendment

## Request, authority, and scope

Owner request, verbatim:

> change the canonical skill paired task orchestration for Failure Gate v4 so this amendment is included

This is the narrowly authorized definition adaptation assigned as Project task **#120 — Amend canonical Paired Task Orchestration with the Failure Gate v4 planner-staging exception**. The target is only the current canonical `.agents/skills/paired-task-orchestration/SKILL.md`; this is not a Failure Gate installation, cutover, series restart, native-review amendment, workspace-skill publication, or permission to stage files or submit tasks. This report and `scripts/test/paired-planner-staging-source.test.mjs` are the other authorized tracked deliverables.

The live native record returned for #120 was `IN_PROGRESS`, with dependency `#116`, and its complete task description was read. The actual #116 record was `MERGED`; its historical report and task description remain unchanged. Its result applies only to the prior source bytes and does not confirm the amendment below. The separate #119 review is for resources and the full plan, not this changed definition. It was read as `PROPOSED` and later read as `IN_PROGRESS` during this work, with dependency `#116`; no #119 content or lifecycle was changed. These changing task states do not establish finalized-plan evidence or independent acceptance for #120.

Canonical-source selection followed `.agents/` only. The separately named `.agents/skills/skill-install-confirmation/SKILL.md` remains absent in this checkout. It was not copied, reconstructed, or replaced by a mirror. The available Paired acceptance and Router contracts still require genuine independent definition confirmation and Router handoff safeguards; their requirements are not waived by this amendment.

## Source identity and digests

The pre-edit canonical bytes were captured at `/tmp/paired-task-orchestration-SKILL.pre-task-120.md`, outside `.local/`, before editing. The tracked Git baseline also retains those original bytes.

| Source | Bytes | SHA-256 | Finding |
|---|---:|---|---|
| Pre-edit `.agents/skills/paired-task-orchestration/SKILL.md` | 15,475 | `cbc4e9209b00c7b9bf9eee4966cc5e1e31252942b1001b027b923ab5c00d9415` | Read in full and preserved before the edit. |
| Amended `.agents/skills/paired-task-orchestration/SKILL.md` | 18,258 | `1060bbef83e521a9f591d62e52caf2d3e97cb5d23f904b6a939051ea02708456` | Readback showed the single insertion below; no old lines were removed or changed. |
| `references/series-state-and-handoff.md` | — | `e0fb9d7e2e2e80c7c7f2b36c2356aceda09f10f56118255392cda97899fb5b3c` | Read in full; retained the outside-`.local/` durable-record, binding, delivery, and acceptance rules. |
| `references/acceptance-and-confirmation.md` | — | `c83bb5977a42866b67bb7c029ca16512df23c4fd7da2aae04884ce3b4f39db3c` | Read in full; independent definition confirmation remains separate from resource and host acceptance. |
| Router `SKILL.md` | — | `49e3db86b0f5b8c7efba871d7404c40336cb3caf544427a429065b1088f6586f` | Read in full; canonical `.agents` inputs and existing confirmation obligations remain controlling. |
| Router `handoff-binding-and-recovery.md` | — | `7e95d74645e0c1184b2ae24488ffd5936237fb6fc1d9596734a3e57bb1fe0ff5` | Read in full; finalization, complete payload, dependency, readback, and uncertainty rules remain unchanged. |
| Router `delivery-reconciliation.md` | — | `fd908bd54a3d2db4d25cc6a3f2e6fbdfece0e9276a28e02db48d5dcfdfa3f3ca` | Read in full; material obligation changes require authorized reconciliation and current evidence. |
| Failure Gate v4 `SKILL.md` | — | `c62037ac28404b815808fdc2428c2d17b52465d4c1f023fa50c0d5622898b4bb` | Read in full; staging creates no Failure Gate authority and does not alter gates. |
| Regression Guard `SKILL.md` | — | `99b8edc59eeac835656b1098402d18b53525163fd763e18f832c6ebda2f91285` | Read in full; compatibility-contract coverage is required and supplied below. |
| `replit.md` | — | `8ec46d5583f215fbc46b7be3cb02d2b1d45276b343b48c539ecc616473e3e3bd` | Read in full; Failure Gate ordinary governance is STAGED and platform task numbers are not local Gate IDs. |

The amended definition has 284 lines, below the 500-line limit. Its frontmatter is unchanged. All three relative links in the definition resolve to files in the canonical package. A byte-level comparison against the pre-edit snapshot showed that the only difference is the single insertion at lines 66–82, after the canonical-source and Failure Gate authority paragraphs and before “Recognize the requested mode.”

## Exact diff

The following is the complete insertion; no prior text was deleted or rewritten:

```diff
+## Failure Gate v4: deliverable locations and limited planner exception
+
+Use this exception only for paired task planning/handoff of a Failure Gate v4 series. Keep all authoritative deliverables—including scripts, documentation, reports, skills, configuration, code, exports, and complete task plans—outside .local/ in tracked paths that survive task-agent merge and enter repository history.
+
+Exception: when the actual host planner or task interface demonstrably requires a .local/ path for task creation, submission, or handoff, the Agent may create or use the minimum necessary temporary staging copy there, subject to ALL of these conditions:
+
+1. Establish the requirement from the actual interface, host instructions, or observed rejection. Habit, convenience, or an unsupported assumption is not sufficient.
+2. Before staging an Agent-authored payload, preserve its complete authoritative contents in an appropriate tracked path outside .local/. The staging copy must never be the only copy of a deliverable.
+3. Treat .local/ contents as disposable transport or runtime artifacts—not as canonical sources, durable evidence, accepted reports, or proof of delivery.
+4. Read back and compare the complete staged payload with the authoritative copy. After task submission, independently read back the complete persisted task plan and actual dependencies. A staging file, successful submission message, or task title alone does not establish successful handoff.
+5. Record the required staging path, its purpose, the authoritative tracked path, and the observed submission/readback outcome in evidence outside .local/. Missing or truncated contents remain unresolved, not successfully delivered.
+6. This exception does not permit using .local/ skill definitions or mirrors as canonical instructions. Canonical skill sources remain under .agents/. It grants no additional task execution, validation, approval, lifecycle, merge, deployment, or runtime authority.
+
+If the required staging workflow cannot preserve the authoritative deliverable outside .local/ or cannot establish complete persisted-task readback, stop the affected handoff and report the specific blocker. Do not silently broaden this exception or claim successful delivery.
+
+A temporary staging path is not a Failure Gate plan/ID binding, approval source, grant, tier assignment, authorization registry, durable run log, or completion evidence. Failure Gate's genuine authority, selected-tier, finite-budget, independent-supervision, writer/lifecycle, source/bootstrap/runtime, recovery/reclaim and delivery gates remain unchanged. This exception cannot override a higher-priority prohibition or unavailable host permission. Authoring it does not establish that this host requires or supports .local/ staging.
```

## Six-condition and boundary readback

| Requirement | Source readback |
|---|---|
| 1. Demonstrate actual host necessity; no assumption, habit, or convenience | Present verbatim in condition 1. |
| 2. Preserve the complete authoritative tracked copy before staging; never stage the sole deliverable | Present verbatim in condition 2. |
| 3. Classify `.local/` only as disposable transport/runtime, not canonical source, evidence, report, or delivery proof | Present verbatim in condition 3. |
| 4. Compare the complete staged payload and independently read back the persisted complete plan and actual dependencies | Present verbatim in condition 4. |
| 5. Record path, purpose, authoritative location, and observed submission/readback outside `.local/`; missing/truncated content remains unresolved | Present verbatim in condition 5. |
| 6. Keep canonical sources in `.agents/` and grant no task, validation, approval, lifecycle, merge, deployment, or runtime authority | Present verbatim in condition 6. |

The block-on-missing-copy/readback rule is explicit and requires stopping the affected handoff with the specific blocker. The section also says a temporary path is not a Failure Gate binding, grant, tier assignment, registry, run log, or completion evidence; actual Gate authority, budget, supervision, writer/lifecycle, source/bootstrap/runtime, recovery/reclaim, and delivery gates remain unchanged. A higher-priority prohibition or missing host permission still controls. Authoring the exception proves neither that staging is required nor that the host supports it.

The surrounding pre-existing clauses remain byte-for-byte unchanged: canonical inputs come only from `.agents/`; Failure Gate is not imposed on unrelated work; task creation, execution, and advancement remain separate; approvals remain with the user; full primary and verifier readback remains required; and the existing no-automatic-retry/activation/merge/deployment boundary remains intact.

## Regression guard

`scripts/test/paired-planner-staging-source.test.mjs` reads the actual canonical `SKILL.md` from its `.agents/` path. Its static assertions cover the Failure Gate v4 scope, all six conditions, the missing-proof stop, no unsupported host requirement claim, and retained canonical-source, full-readback, approval, and execution boundaries. It creates no files, submits no task, does not impersonate a planner, and asserts no live host integration. Its status is **NOT_RUN** under the task's validation limits.

## Actual host findings and remaining blockers

- No real `.local/` staging requirement was demonstrated or exercised. No `.local/` staging copy was created or used for this amendment.
- The actual #120 and #116 native records were read. #120's full plan is available by record readback, but the returned record and the documented project-task interface exposed no final-write/finalization receipt or equivalent barrier evidence. No dependent confirmation task was created or attached.
- The required fresh independent definition-only confirmation is **PENDING/BLOCKED**, not passed. The #116 result and its prior source digest cannot certify these new bytes. The separate #119 resources/full-plan review cannot substitute for definition confirmation.
- The canonical `skill-install-confirmation` companion remains absent at `.agents/skills/skill-install-confirmation/SKILL.md`. No substitute or universal non-applicability claim was invented. The remaining owner action is to provide the authentic canonical companion or an authoritative applicability resolution, and the supported finalization/confirmation route needed for a genuine dependent review.
- The current `origin/main` baseline is `e8038f36ba88615ea7cd4c8c288cf39f396baf6c`; its Git tree has no `.agents/skills/paired-task-orchestration/SKILL.md` entry. The project branch is 13 commits ahead, at `374188141e5d2ea561543792502f2cf3ae83d61b`. External PR delivery is unavailable for that verified baseline; no unrelated package contents were pushed or published to manufacture one.
- Existing series manifests/checkpoints, the #102 baseline, original archives, historical reports, legacy keys, and task descriptions were not changed. No reviewer was modified, no FG-02 or later pair was created/advanced, and no Failure Gate activation or skill publication occurred.

## Validation record

Allowed source/document readback only: complete source reads; pre/post SHA-256 capture; comparison proving insertion-only change; frontmatter and line-count inspection; canonical relative-link existence checks; and inspection of the guard and this report.

**NOT RUN:** the new guard, any other tests, imports, builds, plan/scaffold guards, hooks, direct diagnostics, coordinator/store commands, services/signals, remote CI, cleanup/reclaim, activation, deployment, and any real staging demonstration. No task-local validation tier, grant, finite budget, or independent supervisor was supplied. These source readbacks are not runtime validation or independent confirmation.
