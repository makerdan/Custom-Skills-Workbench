# Skill Mirror Sync Apply Handoff

Date: 2026-10-05

## Canonical contract and boundaries

- `.agents/skills/skill-mirror-sync/SKILL.md` remains the sole contract. Its SHA-256 is `fe85daf4e4cbcb5784d09cd5f5ad940054121c21685a954293ee8db58fc471dc`; it was not edited or copied.
- `WORKSPACE_SKILLS_SOURCE` is the only authority. The helper does not infer or substitute another source.
- The generated projection is isolated at `.agents/skills/.workspace-projections/`. Project-authored skill siblings are preserved.
- Runtime mirror paths and metadata are inspected read-only by the status command. Repository code does not write, repair, delete, or reverse-promote `.local/custom_skills/` data.
- Generated projection and transaction files are ignored by Git so workspace-provided instructions are not added to tracked files.

## Obligation-to-implementation and test mapping

| Contract obligation | Implementation | Evidence |
| --- | --- | --- |
| Require an explicit readable source and non-empty opaque revision; fail closed without an old-projection fallback | `scripts/src/workspace-skill-sync.mjs` source discovery and loader | `scripts/test/workspace-skill-sync.test.mjs` covers missing source, missing root, empty revision, and refusing to load a prior projection |
| Deterministic immediate skill directories, recursive regular files, safe paths, and SHA-256 fingerprints | `scripts/src/workspace-skill-sync.mjs` source discovery and manifest generation | Tests cover sorted nested files, independent fingerprint calculation, symlinks, unexpected entries, invalid names, case/Unicode collisions, and a FIFO |
| Reject malformed, stale, incomplete, extra, or changed projections | `scripts/src/workspace-skill-sync.mjs` projection validator | Tests cover malformed manifests, missing and extra files, tampered bytes, revision mismatch, and content changes that retain the same revision |
| Ownership-aware lock, safe stale-lock recovery, helper-owned cleanup, guarded staging/backup renames, rollback, and interrupted-refresh recovery | `scripts/src/workspace-skill-sync.mjs` refresh transaction | Tests cover active-lock preservation, dead and stale lock recovery, cleanup of only marked staging directories, recovery of a synthetic interrupted transaction, and install-rename rollback |
| Revalidate immediately before returning skill instructions | `scripts/src/workspace-skill-sync.mjs` loader | A test tampers with the installed projection after refresh and confirms that loading rejects it |
| Read-only mirror status and bounded exit outcomes | `scripts/workspace-skill-status.mjs`, `scripts/src/workspace-skill-sync.mjs`, and the root `workspace-skill:status` script in `package.json` | Tests cover pass (0), mismatch (1), unavailable source (2), missing mirror (3), malformed sidecars, output redaction, pnpm argument forwarding, and no status-side mutations |
| Keep generated content and transaction artifacts out of tracked files | `.gitignore` | Changed-file review confirms no projection, source, or runtime mirror content was added |

## Changed files

- `.gitignore`
- `package.json`
- `scripts/src/workspace-skill-sync.mjs`
- `scripts/workspace-skill-status.mjs`
- `scripts/test/workspace-skill-sync.test.mjs`
- `docs/validation/skill-mirror-sync-apply-handoff.md`

No canonical skill definition, source workspace directory, runtime mirror, runtime metadata sidecar, product artifact, or user-upload flow was changed.

## Validation outcomes

### Pre-edit baseline

- `pnpm --filter @workspace/scripts run test` — exit 0; 14 passed, 0 failed.
- `pnpm --filter @workspace/scripts run typecheck` — exit 0.
- `TASK_PLAN_FILE=.local/tasks/task-27.md pnpm run regression-guard` — exit 0; the scoped plan passed.
- The working tree was clean before implementation.

### Final scoped checks

- `pnpm --filter @workspace/scripts run test` — exit 0; 27 passed, 0 failed.
- `pnpm --filter @workspace/scripts run typecheck` — exit 0.
- `TASK_PLAN_FILE=.local/tasks/apply-skill-mirror-sync.md pnpm run regression-guard` — exit 0; the scoped plan passed.
- `node --check scripts/src/workspace-skill-sync.mjs && node --check scripts/workspace-skill-status.mjs && node --check scripts/test/workspace-skill-sync.test.mjs && git diff --check` — exit 0.
- The canonical skill checksum still matches the task contract.
- `pnpm workspace-skill:status -- --skill skill-mirror-sync` — exit 2; output was `workspace-skill status: unavailable-source (skill-mirror-sync)`. This is the expected fail-closed result because this environment has no configured `WORKSPACE_SKILLS_SOURCE`; the platform sidecar is also unavailable.

## Platform-owned blocked check

- **Owner:** Workspace/platform skill provisioning and mirror-sync owner.
- **Blocked operation:** Establish the authoritative `WORKSPACE_SKILLS_SOURCE` and expose authoritative runtime mirror metadata for `skill-mirror-sync`.
- **Next action:** Provision/expose those platform-owned inputs, then rerun `pnpm workspace-skill:status -- --skill skill-mirror-sync`. Do not edit the runtime mirror or fabricate its metadata to turn the check into a pass.

No source path, private workspace content, secret, mirror value, or reconstructed registry is included in this handoff.
