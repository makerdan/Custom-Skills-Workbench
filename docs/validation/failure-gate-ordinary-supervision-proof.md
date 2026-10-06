# Ordinary Failure Gate supervision and capture — Task 79 evidence

**Observation date:** 2026-10-06  
**Assessment:** Source review complete; ordinary host acceptance **BLOCKED**.  
**Effect:** Do not dispatch ordinary validation through Failure Gate on this evidence.

## Scope and method

This is a read-only review of the current project source and retained evidence. No
coordinator/store, process, workflow, remote service, or live caller state was
read. No tests, package commands, CLI, imports, builds, signals, recovery, or
ordinary dispatch were performed. The current approved read-only route for live
host authority and remaining consumption is unavailable. The last captured
ordinary governance state is **STAGED**; current policy classification remains
**UNKNOWN**.

## Ordinary entry and registration-before-dispatch

| Boundary | Source finding | Acceptance |
| --- | --- | --- |
| CLI entry | `scripts/failure_gate/cli.py` dispatches `run` to `Gate.required_run`; it does not place an independent outer supervisor around CLI entry. | No independent host admission or whole-entry supervision is established. |
| Checked local run | `Gate.required_run` calls `Gate.execute`, which reserves the run and calls `supervised_run` for each declared step. | This is a cooperative project-local path, not proof of independent host supervision for all ordinary callers. |
| Per-step handshake | When `supervisor.run` is invoked, it records launch intent, starts the private watchdog, and waits for a matching `registered` message. The watchdog holds its worker behind a pipe gate; the parent records `watchdog_registered` before sending the gate byte that releases the worker. `Store.event` writes the file projection before its database event record. | Registration-before-worker-dispatch is present in source for this per-step path. No current host evidence proves that an independent supervisor admits ordinary CLI or other callers before their dispatch. |

The local supervisor therefore has a source-level registration handshake, but
the requested independent ordinary entry scope is not verified. Do not treat a
project-local function, the historical health caller, or configured workflows as
an independent host supervisor.

## Limits and exact-operation accounting

The current tracked policy and supervisor source declare finite values:

| Limit | Declared value |
| --- | ---: |
| Queue | 30 seconds |
| Step | 480 seconds |
| Startup | 15 seconds |
| Test | 30,000 ms |
| Hook | 15,000 ms |
| Owner stall | 15 seconds |
| Registration | 2 seconds |
| Cleanup | 20 seconds |
| Capture | 10 seconds |
| Run | 1,200 seconds |
| Installation | 2,700 seconds |
| Maximum raw output | 8 MiB |

`Gate.execute` carries the raw-output budget across steps by subtracting already
captured bytes before each later step. The parent separately caps watchdog
control/evidence output at 1 MiB.

These are code/policy declarations, not a current ordinary-operation grant.
There is no exact ordinary operation, current approved authority/decision, bound
boot and clock interval, current parent/session allocation, or readback of
remaining consumption. The prior health-only 900-second bootstrap was consumed
by its fixed fixture/health scope and is not reused. Current effective ordinary
limits and remaining consumption are **UNKNOWN / BLOCKED**.

## Stop, loss, capture, and acknowledgement

Source review confirms that the cooperative per-step watchdog classifies
execution deadline, explicit cancellation, owner death/stall, registration
timeout, and output overflow as stop conditions. SIGTERM/SIGINT and the
parent's cancellation message request cancellation. During the bounded cleanup
window it signals tracked PID/start-time incarnations with SIGTERM first, then
SIGKILL, and reports stopped only after no owned descendants remain. It caps raw
output at the passed byte limit, drains for at most the capture limit, fsyncs the
capture, and reports whether output was completely drained without overflow.
Healthy release requires stopped work, complete capture, no ownership gap, and
an allowed terminal reason; only a natural finish with raw exit zero is a pass.
The parent also bounds watchdog control/evidence output.

On watchdog loss or an event/journal failure, the parent can signal only exact
owned incarnations it already observed. Unknown or escaped work is not claimed
stopped, and the exclusion remains when ownership or outcome is uncertain.
`Gate.execute` records per-step outcomes and the final run result; unhealthy or
uncertain supervision retains `recovery_required` rather than accepting a
healthy release.

These are implementation properties, not ordinary host acceptance. No current
ordinary operation demonstrated cancellation or escalation, owned-tree
termination, watchdog-loss handling, bounded capture, durable acknowledgement,
or the corresponding remaining-budget consumption. Ordinary behavior for every
item remains **UNKNOWN / BLOCKED**.

| Required proof | Current result |
| --- | --- |
| Independent ordinary entry scope | **BLOCKED** — no independent host supervisor is established around the ordinary CLI entry or other callers. |
| Registration before ordinary dispatch | **Source-level per-step handshake only** — not accepted as an independent host admission proof. |
| Finite limits and remaining consumption | **BLOCKED** — declared values exist, but no current exact-operation grant or remaining-budget readback exists. |
| Stop, cancellation/escalation, owned-tree termination, supervisor-loss behavior | **Source reviewed; ordinary host proof BLOCKED.** |
| Bounded capture and acknowledgement | **Source reviewed; ordinary operation capture/acknowledgement BLOCKED.** |

This finding is separate from Port Authority lock, lease, host-attestation, or
reclaim claims. It neither proves nor changes any of those capabilities.

## Source bindings

SHA-256 values bind the workspace source bytes reviewed for this report. They do
not authenticate a host provider, authorize dispatch, or prove runtime behavior.

| Source | SHA-256 |
| --- | --- |
| `scripts/failure_gate/cli.py` | `61ea7b2ea972ff729bc7d155b8b8c912fb503bedc3afbb3d6b853a4ad8dd1b3d` |
| `scripts/failure_gate/gate.py` | `54d0667da862876d7e395bccef84149f4ade5cf86f76f08017e35777bd233406` |
| `scripts/failure_gate/supervisor.py` | `b92f99fbc5a93ae921e5b620412a12f408bbb9480742fb3ae911ff5da665bf28` |
| `scripts/failure_gate/watchdog.py` | `1c4ce0dcf6fe6ad8d07f733582eb18b0eb5007c428164c2ace01f18ce118e974` |
| `docs/validation/failure-gate-policy.json` | `d945a2970c8721c23b658ea1cee51e6b6a89395280405adbba687614808610ac` |

The consumed health-only result remains limited to the exact callers and scope in
`failure-gate-bootstrap-report.md`. No ordinary run, approval, limit, or result
is inferred from that report.
