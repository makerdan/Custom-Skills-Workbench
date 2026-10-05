# App Support Runtime Safety Apply Handoff

Date: 2026-10-05

## Scope and source mapping

This change applies only **Runtime Safety** from `.agents/skills/app-support-ops/SKILL.md`, using `.agents/skills/port-authority/SKILL.md` and its `reference/runtime-contract.md`. Failure Gate's `reference/runtime-reclaim.md`, `reference/validation-budgets.md`, and `reference/staging-and-lifecycle.md` govern the authorization and budget decisions below. Help and Admin Analytics were not selected.

| Requirement | Project evidence and implementation | Result |
| --- | --- | --- |
| Retain distinct environment-owned artifact ports | The three artifact configurations assign API Server `8080` at `/api`, Skills Workbench `23687` at `/`, and Canvas `8081` at `/__mockup`. API `src/index.ts` and both Vite configs read `PORT`; the Vite configs also require `BASE_PATH`. Workbench and Canvas now require strict port binding for both dev and preview servers. | Configured; current IPv4 runtime values were observed. Changed Vite settings are not active in already-running processes until an authorized restart. |
| Scan for unowned fixed ports | `scripts/check-runtime-ports.mjs` scans service, test, script, workflow/configuration, and operational-document sources; derives the expected artifact port set; verifies artifact `localPort` distinctness and configured `PORT` agreement; permits port zero only for ephemeral listener allocation; and contains narrowly scoped exceptions described below. `scripts/test/runtime-safety.test.mjs` contains failing and passing synthetic cases and an actual-repository assertion. | Implemented, **not run** because no authorized finite validation route was verified. |
| Test server lifecycle | API route tests request an OS-assigned ephemeral listener port, use the assigned address, and close their owned listener in `finally`. Added assertions for closure after successful and throwing callbacks. API test bundles now use unique OS temporary directories rather than a shared `.test-build` directory. | Implemented, **not run**. |
| API health contract | `src/app.ts` mounts the route tree at `/api`; `src/routes/index.ts` includes the health router; `src/routes/health.ts` serves `GET /healthz` with `{ "status": "ok" }` via `res.json`. The API artifact's startup path is `/api/healthz`. A test harness mounts the real health router under `/api` and requests that exact path, checking status, JSON content type, parsing, and the status field. | Test added, **not run**. This isolated harness does not replace the blocked live service/proxy request. |
| No unsupported process controls | No cleanup, signal, outage, or restart endpoint was added. The canonical host adapter throws `HOST_ATTESTATION_UNAVAILABLE` and `FAILURE_GATE_AUTHORIZATION_UNAVAILABLE`. | Reclaim remains disabled; no services were restarted, stopped, or signaled. |

## Capability matrix

`Present`, `absent`, `unclear`, and `not applicable` describe only the scope and evidence stated here; an unavailable project integration does not prove that a hidden platform capability is absent.

| Boundary | State | Evidence |
| --- | --- | --- |
| Client/UI | **Present** | Skills Workbench is a React/Vite web artifact; Canvas is a Vite component-preview artifact. Their artifact paths and service commands are registered. |
| Service and health | **Present** | Express API service, `/api/healthz` JSON route, and artifact startup path exist. Actual health through the live routed service was not checked. |
| Project-owned health probe | **Absent** | No project health-probe client/checker or probe integration was found. The health route is a response endpoint, not a project-owned probe. Negative-response probe cases therefore have no project boundary to exercise. |
| Artifact port configuration | **Present** | Three distinct `localPort` assignments; runtime code reads artifact-provided environment values. The active API, Workbench, and Canvas processes were each observed listening on the corresponding IPv4 port. |
| Ephemeral test port and closure | **Present in code; unverified by execution** | API test helper requests an OS-assigned ephemeral listener port, reads the allocated address, and closes the server in `finally`; success/failure closure regression cases were added. |
| Authorized validation route / assigned tier | **Unclear; blocked** | The project contains package scripts but no project-local checked tier runner, registered tier manifest, or executable Failure Gate route. The assigned tier and host task authorization were not independently discoverable. |
| Failure Gate policy status | **Unclear; blocked** | Canonical Failure Gate instructions are present, but they explicitly do not install a host registry or checked runner. No authoritative evidence established ACTIVE or INACTIVE status for the host. UNKNOWN is not treated as INACTIVE. |
| Finite approved validation budgets | **Unclear; blocked** | Package scripts do not supply an approved outer supervisor or verified queue, execution, cleanup, and cumulative limits. Host-level limits and authorization were not exposed by project files. |
| Managed service workflows | **Present** | The configured workflows run the API Server, Skills Workbench, and Canvas as named services. Their current process trees matched those configured commands. |
| Host attestation and task-bound reclaim authorization | **Absent in the project integration; host capability unclear** | `.agents/skills/port-authority/scripts/host-capabilities.mjs` is an explicit unavailable adapter; no checked reclaim route or independently trusted attestation source was found in the project. |
| Live process cleanup/reclaim | **Not enabled** | No process-control code was wired. Active services were left untouched. |
| Development outage/restart control | **Not applicable to this task** | Not requested or added. No project-owned safe restart mechanism or production-exclusion proof was established. Existing managed workflow configuration alone is not task-bound restart authorization. |
| Selected modes | **Runtime Safety present; Help and Admin Analytics not applicable** | Only Runtime Safety was in scope. |

## Port assignments and process snapshot

| Artifact | Artifact assignment | Runtime command/configuration | Observed process environment and IPv4 listener |
| --- | --- | --- | --- |
| API Server | `artifacts/api-server/.replit-artifact/artifact.toml`: `localPort = 8080`, path `/api`; production `PORT = 8080`; startup health path `/api/healthz` | Development workflow runs the API package's `dev` command; `src/index.ts` requires `PORT` and passes it to `app.listen`. | PID 351, `node --enable-source-maps ./dist/index.mjs`: `PORT=8080`, listener `8080`. |
| Skills Workbench | `artifacts/skills-workbench/.replit-artifact/artifact.toml`: `localPort = 23687`, path `/`; service `PORT=23687`, `BASE_PATH=/` | Vite config uses environment values for dev and preview, with strict binding. | PID 247, configured Vite command: `PORT=23687`, `BASE_PATH=/`, listener `23687`. |
| Canvas | `artifacts/mockup-sandbox/.replit-artifact/artifact.toml`: `localPort = 8081`, path `/__mockup`; service `PORT=8081`, `BASE_PATH=/__mockup` | Vite config uses environment values for dev and preview, now with strict binding. | PID 254, configured Vite command: `PORT=8081`, `BASE_PATH=/__mockup`, listener `8081`. |

Read-only evidence was collected on 2026-10-05 with `ps -eo pid,ppid,comm,args --width 240` and a filtered `/proc` inspection that read only `PORT`, `BASE_PATH`, and `NODE_ENV` for the three observed service processes, then matched their socket inodes to `/proc/net/tcp`. The process listing showed each under the active managed workflow's process tree. No other environment values were displayed or used. This is a point-in-time IPv4 observation, not a reclaim manifest, host attestation, ownership grant, or IPv6-aware inventory. No service was cleared or signaled.

The artifact configs and operational `replit.md` now agree on all three assignments. The `.replit` root file contains deployment/workflow metadata but no service port overrides. Artifact-assigned ports were not changed.

## Port scanner policy

The repository check covers fixed numeric listener arguments, loopback URLs, Vite-style `port` values, numeric port/`PORT`/`localPort` assignments, and documented `port N` references in project runtime sources and `docs/validation/`. Artifact TOMLs are the source for the distinct assigned-port set. An environment-driven listener is accepted; a fixed listener or URL in ordinary project code is rejected.

Narrow exceptions:

- Explicit ephemeral listener allocation is accepted only in the API route test harness. The tests read the OS-assigned address instead of choosing a test port.
- `127.0.0.1:1106` is the Replit object-storage credential sidecar URL in `artifacts/api-server/src/lib/objectStorage.ts`; the test stub and this handoff refer to that same external sidecar. It is not a project listener. The exception is limited to those exact files and URL.
- `docs/validation/regression-guard-apply-handoff.md` retains exact historical `PORT`-only build commands. They were compile-only Vite inputs, not service listeners or current artifact assignments; the scanner permits only those existing lines.

The scanner's synthetic rejection, environment-driven acceptance, and repository-wide checks are encoded in tests. They were not executed in this task because the validation authorization gate below was unavailable.

## Validation inventory, conflicts, and budgets

Discovered project entry points:

| Entry point | Transitive work observed in source | Budget/authority finding |
| --- | --- | --- |
| `pnpm run test` | Regression Guard, `scripts` Node tests, API bundling plus Node tests, and Workbench Node tests | No project checked runner or verified outer deadline. Node test and hook limits are not configured in these package commands. |
| `pnpm run typecheck` | Regression Guard, `tsc --build` for workspace libraries, artifact/script typechecks | No verified outer deadline, queue/cleanup budget, or task-bound route. |
| `pnpm run build` | Typecheck followed by recursive package builds | Vite configs require artifact-provided `PORT` and `BASE_PATH`; no defaults were invented. No verified outer deadline. |
| `pnpm --filter @workspace/api-server run test` | Esbuild bundle in a unique temporary directory, then `spawnSync` of Node `--test` | API runner does not set a spawn timeout or explicit Node test/hook timeouts. |
| `pnpm --filter @workspace/skills-workbench run test` | Node `--experimental-strip-types --test` for two test files | No explicit Node test/hook timeout or verified outer supervisor in the package script. |
| `pnpm --filter @workspace/scripts run test` | Node `--test ./test/*.test.mjs` | No explicit Node test/hook timeout or verified outer supervisor in the package script. |
| `pnpm --filter @workspace/api-spec run codegen` | Orval cleans and regenerates `lib/api-client-react/src/generated` and `lib/api-zod/src/generated`, then runs `typecheck:libs` | Generated sources are shared with typechecking. The repository does not prove a host schedule that overlaps these callers, but the shared-output boundary exists. No lock was added without a verified authorized route and approved budgets. |

No Playwright, Vitest, or Jest validation configuration, repository validation lock, checked tier runner, or CI workflow was found in the inspected project. `.replit`'s post-merge timeout is not evidence of test-runner supervision. `scripts/test/runtime-safety.test.mjs` and the health/lifecycle additions have no configured effective test or hook limits yet; do not infer finite approved budgets from test defaults.

## Authorized checks and raw outcomes

| Check | Raw outcome | Assessment |
| --- | --- | --- |
| Read-only project source/config inventory and service process snapshot | Completed; commands and observations summarized above. The filtered process check reported API `8080`, Workbench `23687`, and Canvas `8081`. | Discovery only; not validation or task-tier evidence. |
| Port scanner synthetic hardcoded fixture | **NOT RUN** | No verified checked/authorized finite validation route and assigned tier. |
| Port scanner environment-driven fixture and repository scan | **NOT RUN** | Same blocker. |
| Ephemeral listener success/failure closure tests | **NOT RUN** | Same blocker. |
| API health route test through `/api/healthz` in the isolated route harness | **NOT RUN** | Same blocker. |
| Live API health request through the configured artifact/proxy route | **NOT RUN** | Same blocker; no manual probe was used as a substitute. |
| API negative health-probe cases | **NOT APPLICABLE at a project-owned boundary** | No project-owned probe exists. Host-native probe body validation, redirects, HTTP/network failures, and timeout/cancellation enforcement remain **BLOCKED/UNCLEAR** because no verified probe integration or bounded authorized route was available. |
| Two consecutive authorized runs on the current snapshot | **BLOCKED before dispatch; neither run launched** | Host policy status, tier grant, checked route, and approved finite budgets are unknown. No direct package command, shell timeout, alternate runner, port clearing, or process kill was used. |

No tests, builds, typechecks, workflow restarts, or direct health requests were run. Therefore there are no raw validation exit codes, effective authorized time budgets, or accepted current-snapshot test results to report.

## Control state and production/process safety

- **Artifact port assignments:** configured and independently matched to current IPv4 process listeners. Existing values are preserved.
- **Fixed-port regression check:** implemented with narrow allowlists and failing/passing fixtures; execution is blocked.
- **Test listener ownership and closure:** source changes implement ephemeral allocation and `finally` cleanup, with success/failure regressions; execution is blocked.
- **API health response contract:** existing route and expected JSON are documented and a positive routed test is added; execution and live-route verification are blocked.
- **Validation budgets and checked route:** blocked; project scripts have no verified approved queue, execution, cleanup, test/hook, or cumulative budget source.
- **Shared generated API outputs:** documented conflict boundary; no serialization activated without host authorization and approved budgets.
- **Process reclaim:** disabled. The project's canonical adapter is unconfigured and there is no exact task-bound authorization, independent host attestation, ownership manifest, checked evidence route, or verified termination procedure.
- **Development outage/restart control:** not added. The current task prohibits restarting services, and no production-exclusion or safe restart evidence was established.
- **Production boundary:** no production operation was performed; production configuration and live services were not changed. The Vite `strictPort` edits affect the next managed start; currently running Vite processes were deliberately not restarted.

## Blocker and next owner/action

The **Replit host/task-validation integration owner** must provide or expose the authoritative ACTIVE/INACTIVE policy result, the exact checked or otherwise authorized route for this task, its approved tier, and finite queue, execution, cleanup, evidence-capture, and cumulative budgets with whole-process-tree supervision. The same owner must confirm whether the platform health probe can validate the real `/api/healthz` status, JSON media type/body, redirects, failures, and request deadline. Until then, the task-specific test route remains blocked; do not bypass it with package scripts, a shell timeout, a replacement runner, a direct health request, or process intervention.
