# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API Server on its artifact-assigned port 8080; its routed health path is `/api/healthz`
- `pnpm --filter @workspace/skills-workbench run dev` — run the Skills Workbench on its artifact-assigned port 23687 at `/`
- `pnpm --filter @workspace/mockup-sandbox run dev` — run the Canvas preview on its artifact-assigned port 8081 at `/__mockup`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run test` — run regression-guard checks and package tests
- `bash scripts/failure_gate/run_pnpm.sh <pnpm arguments...>` — run pnpm mutations from the project root or a workspace subdirectory under the cooperative Gate writer lock; raw pnpm commands are not coordinated
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Task Planning

- Before the first heading of every plan, emit the exact Planner Announcement from `.agents/skills/regression-guard/SKILL.md`.
- Apply that canonical skill by substance, not title keywords; use its exclusions, declaration format, section order, N/A reasons, and follow-up conditions. Do not copy or redefine the contract here.
- For the plan checker, add exactly one metadata comment: `<!-- regression-guard: required -->` when the human classification says the plan qualifies, or `<!-- regression-guard: not-applicable -->` when it is excluded. This marker only communicates the Planner's decision to the checker; it does not classify plans or replace the canonical contract.
- Put any required `## Regression Guard` section after `## Pre-existing failures to ignore` and `## Validation`, and before `## Relevant files`, as specified by the canonical skill.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Failure Gate local tooling is STAGED, not ordinary-task authority. See `docs/validation/failure-gate-implementation.md`, its policy/actual approval record, and `docs/validation/failure-gate-evidence-index.md`.
- For validation overlap questions, automatically inspect the indexed local coordinator/file trail; do not start tests, clear leases, kill processes or infer approval from platform task status. Unmonitored callers remain unknown.
- Do not use a platform task number as a local Failure Gate ID. Ordinary activation/completion, cutover, recovery and live reclaim remain blocked wherever the required actual authority or host proof is missing.
- For the named `Custom-Skills-Workbench/failure-gate-v4/18-piece` series only, consult `docs/validation/failure-gate-v4-series-handoff-policy.md` for the owner-authorized cooperative snapshot handoff profile; it does not alter generic skill policy or grant runtime authority.
- For that series' resource assessment only, exclude retired subcriteria `B2-R1` and `B5-R1`, identified by the original anchors in `docs/validation/task-plans/remove-retired-review-requirements.md`. Do not recreate them as requirements, findings, blockers or owner actions. B2's current payload/key/dependency checks and B5's remaining baseline/source/formal-confirmation obligations still apply. Removal is not PASS, independent acceptance, a grant or advancement.
