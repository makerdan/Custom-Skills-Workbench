---
name: Skill Install Confirmation
description: >-
  When the Planner installs a new skill (proposes a task that writes a SKILL.md),
  this skill instructs it to also propose a paired confirm task. The confirm task
  reads the installed skill file, checks it against the original spec, identifies
  gaps or incorrect sections, and patches them in place. Scoped exclusively to the
  skill file itself — not to the feature the skill describes.
---

# Skill Install Confirmation

## Purpose and Trigger

Invoke this skill **whenever the Planner installs a new skill** — that is, whenever the Planner proposes a task whose primary deliverable is writing a `SKILL.md` file under `.agents/skills/`.

This skill **must NOT be invoked** for general feature work, bug fixes, or any task that does not produce a `SKILL.md` as its primary output. It is exclusively for skill-file verification and hardening.

> **Self-exemption:** This skill is exempt from applying to itself. Proposing a "Confirm & Harden: Skill Install Confirmation skill" task would produce infinite recursion. When this skill is the one being installed, skip the confirm task.

The two-task shape this skill produces:

- **Task A** — Write the skill (the normal install task).
- **Task B** — Confirm Task A produced a correct, complete, hardened skill file; fix anything it did not.

Task B must `dependsOn` Task A so the confirm agent always sees the real shipped file, never a draft.

---

## Implementation Plan Rules — Task A (Skill Install)

The skill-install plan must follow the project's standard plan format. In particular, its **"Done looks like"** section must contain **at least 2 falsifiable items**. A falsifiable item is one that can be proven wrong if it fails — a concrete, checkable fact about the skill file's content or structure.

**Falsifiable:** "The `## Trigger` section exists and names at least one concrete invocation condition."
**Not falsifiable:** "The skill works correctly." / "The skill is complete."

The "Done looks like" items are the shared contract Task B uses as its verification checklist. Write them as if Task B will read them and check each one mechanically.

---

## Implementation Plan Rules — Task B (Confirm & Harden)

### Scope

The confirm task is **scoped to the skill file only**: `.agents/skills/<name>/SKILL.md`.

This is always the correction boundary. Read-only acceptance-evidence inspection
may extend beyond that file only under the exact owner-authorized existing-primary
exception below; it does not extend repair authority or absorb resource/plan review.

The confirm agent:
1. Reads `.agents/skills/<name>/SKILL.md`.
2. Diffs it against the original spec in the install task's plan to find gaps, incorrect sections, or missing content.
3. Lists every gap before patching (does not silently fix and move on).
4. Patches the file directly.

The confirm agent does **not** change the broader codebase, adjacent skills, or any artifact code. Outside the exact exception below, assessment remains file-only as well.

### "Done looks like" for Task B

Task B's "Done looks like" must mirror each item from Task A's "Done looks like" verbatim, **plus** these two fixed additions:

1. "No section is vague, self-referential, or deferred to future work."
2. "A future Planner reading the skill file cold could follow it without ambiguity."

### Must NOT do (required section in every Task B plan)

The confirm agent must NOT:

- Make any changes outside `.agents/skills/<name>/SKILL.md`
- Refactor or modify adjacent skills
- Add speculative content beyond what the original spec called for
- Expand scope to include feature-code changes inspired by the skill's topic
- Silently fix gaps without first listing them

### Escalation rule

If patching would require replacing or substantially rewriting more than half of the nonblank body lines after the YAML front matter (excluding purely mechanical formatting), the confirm agent must **stop** instead of attempting a wholesale rewrite. Count lines whose content would be deleted or whose meaning would materially change; if that count is greater than half of the nonblank body lines, the threshold is met. Add a clearly labeled HTML comment block after the front matter and before the first heading, summarizing the findings and why the threshold was met. Report to the parent Planner that a separate rewrite task is needed, but do not create or edit that task: Task B is limited to the skill file. Do not use this threshold to avoid ordinary targeted corrections. A confirm task that becomes a full rewrite is a scoping failure, not a success.

---

## Task-Creation Rules (Planner)

For a **new** install primary, the Planner must call `bulkCreateProjectTasks` with **both tasks in one call**. The install task must have an `alias`. The confirm task's `dependsOn` must reference that alias — this is a hard requirement, not optional.

Before creating the pair, the Planner must ensure Task A contains the complete, authoritative skill specification and the exact destination path `.agents/skills/<name>/SKILL.md`. Do not replace the specification with a summary or make the confirm task depend on context that is absent from Task A.

Task A's `alias` must be unique within the bulk-create call. Task B must refer to that exact alias in `dependsOn`; do not substitute a guessed task ID or a title. Both tasks must be included in the same call so the dependency can be resolved by the task system.

### Existing-primary retrospective route

The same-call rule remains mandatory for new primaries. It cannot be recreated as history after the install task already exists. A separate dependent confirmation may be planned for an existing primary only when the workspace owner or authorized user explicitly resolves that retrospective confirmation is required and authorizes its separate task planning.

For that route, the Planner must:

1. Read the complete authoritative primary record through a verified host interface. Confirm the Project, real task reference, Install operation, target skill, scope, complete finalized plan and digest, original source binding, and actual lifecycle. A title, task status, merge, or installation alone is not sufficient.
2. Preserve the original source and task record. Do not edit, recreate, replace, or relabel the primary, and do not claim the two tasks were created in one call.
3. Copy every original primary “Done looks like” item into the confirmation plan verbatim, then append both fixed confirmation items above. Keep corrections limited to the target `SKILL.md`. Except under the exact owner-authorized exception below, if any original item cannot be assessed within the file-only scope, stop and report **BLOCKED**. An unavailable or ambiguous original plan blocks either route. Do not omit or rewrite an item, widen the correction boundary, or infer a waiver; request a separately authorized resolution.
4. Keep this confirmation distinct from required resource/plan verification. If another task would exceed the current drafting window or required task count, surface the conflict and obtain a separate explicit batching decision before any write; do not merge the scopes or drop either obligation.
5. Search for an existing confirmation using the Router's canonical stable binding (Project identity, target skill, primary task namespace/reference, finalized plan digest, and confirmation scope) and applicable legacy identities. Reuse it only after its complete plan, real dependency, lifecycle, and evidence are read back and match. Otherwise, create exactly one separate confirmation task through the verified host interface, with a real dependency on the existing primary. Do not invent another key, or duplicate an uncertain or already committed write.
6. Read back the complete persisted confirmation plan and actual dependency. Verify verbatim acceptance-item parity, the two fixed additions, file-only correction scope, and the required “Must NOT do” section. If the host cannot prove the persisted plan or dependency, report **BLOCKED**, with the responsible owner and next action.
7. Keep task creation, task approval, execution, and acceptance separate. Before confirmation runs, require the actual installed canonical file and original specification to be available to the confirmer. A dependency or completed primary status alone does not prove delivery or acceptance.

This route defines a prospective reconciliation procedure; it does not make every historical install subject to retrospective confirmation or grant native task access, task creation, approval, or execution by itself.

### Owner-authorized read-only evidence exception — one bound existing primary

The owner separately authorized this narrow amendment for the following binding,
not a general relaxation of file-only confirmation:

- Project: origin `https://github.com/makerdan/Custom-Skills-Workbench`, root
  `/home/runner/workspace`, current Skills Workbench Project task-board namespace.
  No immutable namespace UUID is inferred.
- Series: `Custom-Skills-Workbench/failure-gate-v4/18-piece`.
- Target: `.agents/skills/paired-task-orchestration/SKILL.md`.
- Existing installation primary: actual Project task `#102`, “Update Orchestration
  and Replan Series”; complete original description is 11,539 UTF-8 bytes,
  SHA-256 `6b2a457b2d3cbe1ffc06e3edb6ce0efa3cc1e579637297ead8b1660ed853cd06`.
- Authorization and full-record comparison:
  `docs/validation/skill-install-confirmation-applicability-review.md` and
  `docs/validation/skill-install-confirmation-scope-readback.json`.
  These records document evidence and scope; they are not task approval or
  runtime authorization registries.

For this binding only, a subsequently separately authorized confirmer may inspect
the original primary's broader deliverables and applicable independently accepted
evidence read-only to assess every original acceptance item. The confirmation
plan must still contain all six original items verbatim, both fixed additions,
and the complete required “Must NOT do” section. Neither summaries nor installed
output may replace the original criteria.

Corrections remain exclusively within the target `SKILL.md`. Referenced resources,
the 18-piece plan and payloads, checkpoint/history, installer handoff, original
source, task records and other deliverables must not be changed by the confirmer.
Resource/plan verification remains a distinct independent obligation with its own
task, evidence, report, correction permissions and acceptance. The confirmer
checks that applicable independently accepted evidence supports each broader
criterion; it must not perform or certify the separate resource/plan review in
that reviewer's place. Unaccepted, missing, stale, mismatched or incomplete evidence
leaves the affected criteria and overall confirmation acceptance **BLOCKED**.
Report existence, a dependency, or a merged task label cannot supply acceptance.

Preserve the original primary and source, existing review lineage, Router stable
binding and legacy duplicate reconciliation, complete persisted-plan and actual
dependency readback, delivered-input readiness and separate batching decisions.
Do not relabel an older definition-only review as satisfying the expanded
assessment contract or invent same-call history. A mismatched Project, series,
target, primary or plan digest cannot use this exception; stop **BLOCKED** and
request a new separately authorized resolution rather than carrying permission
forward or inventing a duplicate key.

The owner's amendment authorization covers this canonical rule and its
reconciliation report only. It does not authorize confirmation task planning or
writes, approval, execution, independent acceptance, runtime activity or series
advancement. Each still requires its separately applicable authority. Independent
acceptance of this amendment and the bound confirmation remain pending; the
amendment itself grants neither.

### Confirm task title pattern

Use `Confirm & Harden: <skill-name>` for Task B. Use the skill's human-readable `name` from its front matter when present; otherwise use the `<name>` directory basename. The title must identify the skill being checked.


### Required task content

Task A must:

- State that its primary deliverable is `.agents/skills/<name>/SKILL.md`.
- Include the complete user-approved specification and relevant constraints needed to write the skill.
- Include a `Done looks like` section with at least two falsifiable checks, each describing a concrete property that can be verified in the resulting skill file.
- Declare an `alias` for Task B to depend on.

Task B must:

- Name the exact skill file path and depend on Task A's alias.
- Direct the confirm agent to compare the delivered file with the complete specification in Task A, list all identified gaps before editing, and patch only after that list is recorded.
- Include a `Done looks like` section containing every Task A check copied verbatim, followed by the two fixed additions defined above.
- Include a `Must NOT do` section containing every restriction listed above.

Do not paraphrase Task A's checks in Task B, even to make them shorter. Do not add checks to Task B that broaden its file-only scope.


### Creation and dependency failure handling

Create Task A and Task B together with one `bulkCreateProjectTasks` call. After the call, verify from its result that both tasks were created and that Task B depends on Task A. Do not report the pair as complete if the result does not establish both facts.

If `bulkCreateProjectTasks` is unavailable or cannot express the required alias and dependency, do not create the tasks separately or silently drop the dependency. Report the blocker and preserve the two-task contract for a Planner with the required capability.


### Confirm-agent execution sequence

1. Read the delivered skill file and the complete specification and checks recorded in Task A.
2. Compare the file against every specification requirement and Task A check. List each gap, incorrect section, and missing requirement in the task conversation before changing the file; keep this list out of project files to preserve the file-only scope.
3. If the escalation threshold below is not met, patch only `.agents/skills/<name>/SKILL.md`.
4. Recheck every Task A item and both fixed Task B items. Report the gaps found, the edits made, and any unmet check or blocker.

If Task A does not contain the complete specification or its checks, stop and report the missing input instead of guessing what the skill should say.
