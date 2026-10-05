# Regression Guard Apply Handoff

Date: 2026-10-05

## Canonical source and guidance

- `.agents/skills/regression-guard/SKILL.md` remains the sole contract. It was not edited or copied.
- `replit.md` directs plan authors to emit the exact Planner Announcement before the first plan heading, classify by substance rather than title, and follow the canonical exclusions, declaration rules, section ordering, N/A protocol, and follow-up conditions.
- The checker accepts the project metadata comments `<!-- regression-guard: required -->` and `<!-- regression-guard: not-applicable -->`. These communicate a human Planner decision; they do not decide applicability.

## Obligation-to-file and test mapping

| Obligation | Implementation | Verification |
| --- | --- | --- |
| Strict, `--fix-stub`, and `--stubs-only` modes | `scripts/check-regression-guard.mjs` | `scripts/test/check-regression-guard.test.mjs` covers declaration validation, stub insertion, and placeholder-only behavior |
| Fail-closed, exact `TASK_PLAN_FILE` scope | The checker rejects empty, non-`.md`, missing, and non-file paths; when set, it reads and edits only the named plan | Scope tests prove an unrelated required plan remains unchanged |
| No title-based applicability guessing | Explicit plan metadata is required if the section is absent; an existing section is validated directly | Tests cover explicit exclusion and a title containing “Fix” without metadata |
| Required declaration, N/A reasons, placeholders, and section order | The checker validates template fields, all canonical N/A categories, self-satisfying declarations, placeholder text, and required ordering | Unit tests cover compliant, malformed, excluded, self-satisfying, N/A, and ordering cases |
| Mechanically checkable test-layer alignment | The checker checks test-file paths and matches known affected artifact roots from `## Relevant files`; e2e paths are allowed for cross-layer tests | Tests cover backend/frontend mismatch and an e2e test crossing artifacts |
| Root validation wiring | `package.json` adds `regression-guard`, runs it before root tests and typecheck, and preserves build coverage because build invokes typecheck first | Unit test asserts ordering/wiring; root commands below were run |
| Test command for the guard | `scripts/package.json` adds the Node test runner; root `test` includes it before existing API and Skills Workbench test commands | Root test result below |

## Implementation snapshot

Changed files:

- `replit.md`
- `package.json`
- `scripts/package.json`
- `scripts/check-regression-guard.mjs`
- `scripts/test/check-regression-guard.test.mjs`
- `docs/validation/regression-guard-apply-handoff.md`

The script’s default discovery considers only tracked Markdown task plans with the project’s structural plan headings. When `TASK_PLAN_FILE` is set, it bypasses discovery and handles exactly that path. `--fix-stub` adds placeholder fields only to plans explicitly marked `required`; strict mode requires a declaration or an explicit exclusion decision. The build command itself remains unchanged and reaches the guard through root `typecheck`.

## Validation commands and raw outcomes

- `node --check scripts/check-regression-guard.mjs && node --check scripts/test/check-regression-guard.test.mjs && git diff --check` — exit 0.
- `pnpm run regression-guard` — exit 0; fix-stub and strict both passed with `0 plan(s) checked`.
- `TASK_PLAN_FILE=.local/tasks/task-20.md pnpm run regression-guard` — exit 0; fix-stub and strict both passed with `1 plan(s) checked`.
- `pnpm run test` — exit 0. Guard tests: `14` passed, `0` failed. API Server tests: `53` passed, `0` failed. Skills Workbench tests: `31` passed, `0` failed.
- `pnpm run typecheck` — exit 0; library, artifact, and scripts typechecks completed.
- `pnpm run build` — exit 1 in this shell because the existing Vite configs require `PORT` and none was set (`PORT environment variable is required but was not provided.`).
- `PORT=5000 pnpm run build` — exit 1 because the Vite configs also require `BASE_PATH` (`BASE_PATH environment variable is required but was not provided.`).
- `PORT=5000 BASE_PATH=/ pnpm run build` — exit 0; all recursive builds completed. This validates compilation with explicit local Vite inputs; it does not verify artifact-specific published base paths.

## Unresolved limitations and scope

- There is no tracked task-plan archive in this project. In this checkout, default discovery therefore found zero plans; current task execution is covered when the runner supplies `TASK_PLAN_FILE`. Plans kept only in the ignored `.local/tasks` directory are intentionally not scanned archive-wide.
- The script checks the documented `(accepted)` marker for a follow-up deferral but cannot verify platform task state. No task-lifecycle integration, CI workflow, Failure Gate behavior, or platform task-board enforcement was added or claimed.
- A root build invoked without local `PORT` and `BASE_PATH` values remains blocked by the existing Vite configuration. No artifact configuration or runtime behavior was changed.
- No API Server, Skills Workbench, or Canvas feature behavior was changed. No secrets were accessed or copied, and no unrelated project files were included.