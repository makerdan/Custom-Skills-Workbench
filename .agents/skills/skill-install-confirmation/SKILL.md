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

The confirm agent:
1. Reads `.agents/skills/<name>/SKILL.md`.
2. Diffs it against the original spec in the install task's plan to find gaps, incorrect sections, or missing content.
3. Lists every gap before patching (does not silently fix and move on).
4. Patches the file directly.

The confirm agent does **not** touch the broader codebase, adjacent skills, or any artifact code.

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

If the skill file is so incomplete that patching it would require rewriting more than half its content, the confirm agent must **stop**, document findings in a comment block at the top of the file, and surface a new task instead of attempting a wholesale rewrite. A confirm task that becomes a full rewrite is a scoping failure, not a success.

---

## Task-Creation Rules (Planner)

For a **new** install primary, the Planner must call `bulkCreateProjectTasks` with **both tasks in one call**. The install task must have an `alias`. The confirm task's `dependsOn` must reference that alias — this is a hard requirement, not optional.

### Existing-primary retrospective route

The same-call rule remains mandatory for new primaries. It cannot be recreated as history after the install task already exists. A separate dependent confirmation may be planned for an existing primary only when the workspace owner or authorized user explicitly resolves that retrospective confirmation is required and authorizes its separate task planning.

For that route, the Planner must:

1. Read the complete authoritative primary record through a verified host interface. Confirm the Project, real task reference, Install operation, target skill, scope, complete finalized plan and digest, original source binding, and actual lifecycle. A title, task status, merge, or installation alone is not sufficient.
2. Preserve the original source and task record. Do not edit, recreate, replace, or relabel the primary, and do not claim the two tasks were created in one call.
3. Copy every original primary “Done looks like” item into the confirmation plan verbatim, then append both fixed confirmation items above. Keep the confirmation scope limited to the target `SKILL.md`. If any original item cannot be assessed within that file-only scope, or the original plan is unavailable or ambiguous, stop and report **BLOCKED**. Do not omit or rewrite an item, widen the correction boundary, or infer a waiver; request a separately authorized resolution.
4. Keep this confirmation distinct from required resource/plan verification. If another task would exceed the current drafting window or required task count, surface the conflict and obtain a separate explicit batching decision before any write; do not merge the scopes or drop either obligation.
5. Search for an existing confirmation using the Router's canonical stable binding (Project identity, target skill, primary task namespace/reference, finalized plan digest, and confirmation scope) and applicable legacy identities. Reuse it only after its complete plan, real dependency, lifecycle, and evidence are read back and match. Otherwise, create exactly one separate confirmation task through the verified host interface, with a real dependency on the existing primary. Do not invent another key, or duplicate an uncertain or already committed write.
6. Read back the complete persisted confirmation plan and actual dependency. Verify verbatim acceptance-item parity, the two fixed additions, file-only correction scope, and the required “Must NOT do” section. If the host cannot prove the persisted plan or dependency, report **BLOCKED**, with the responsible owner and next action.
7. Keep task creation, task approval, execution, and acceptance separate. Before confirmation runs, require the actual installed canonical file and original specification to be available to the confirmer. A dependency or completed primary status alone does not prove delivery or acceptance.

This route defines a prospective reconciliation procedure; it does not make every historical install subject to retrospective confirmation or grant native task access, task creation, approval, or execution by itself.

### Confirm task title pattern
