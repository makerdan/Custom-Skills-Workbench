# Proposed diagnostic-only watchdog evidence and recovery phase

**PROPOSED — not approved, implemented or executed. No installation retry.**

## Actual blocker

Corrected isolated fixtures passed 29/29. The first real caller typechecked
successfully, then its registered `pnpm test` step stopped with
`watchdog failed; retain exclusion`. The parent adapter did not retain the
subordinate error type/detail, so its cause is unknown.

Do not call this an app failure, a known process-read defect, a baseline,
intermittency proof, or a passing installation. Do not alter the observer to
ignore errors on a hypothesis.

## Exact existing incident and tested context

- Namespace `d63a3d51-4dea-4a99-9e6a-d01410b7e017`;
  local task `FG-00000001`, not platform task authorization.
- Current run `62ad8676-50d9-478f-843e-1eccb6918dbf`,
  purpose `bootstrap_format_amendment`, `running`,
  `recovery_required=1`, INCOMPLETE.
- Child operation `3d658bf1-d839-4c0e-a8b4-0ab92d367d79`;
  parent `b37664c6-e279-4104-a10f-9ea6aec200f7`.
- Actual prior approval is in
  `failure-gate-completion-observation-approval.json`.
- Current policy `local-v1.1`,
  digest `b6d5094e1edf7b746d6b096f4ce1f8266797ee4492893c95c70515e4d3206ee1`.
- Tested tooling
  `dea1eb3ebba74e2e25ad40fe1c8cb935e08abd2fe474d42de75cfa63b71ff54f`.
- Original inherited deadline `6320.443256004` on boot
  `f43c3eaf-c84d-4eb0-b417-6c0fa001da5a`. The existing grant cannot silently
  be renewed, reused after this failure, or treated as another retry.
- Authoritative original rows/events and file paths are indexed in
  `failure-gate-evidence-index.md`; raw partial test output is
  `.failure-gate/runs/62ad8676-50d9-478f-843e-1eccb6918dbf/tests/raw.log`.

Registered identity bindings needing fresh readback:

| Role | PID / start ticks |
| --- | --- |
| Outer watchdog / worker | `6648/583622`, `6653/583627` |
| Typecheck watchdog / worker | `6663/583715`, `6668/583720` |
| Tests watchdog / worker | `6828/584411`, `6833/584418` |
| Outer observed remaining owned descendants, stopped with SIGTERM | `6849/584451`, `6879/584498` |

All registered watchdog/worker identities were observed absent; outer outcome
reports stopped work and complete capture, but healthy release false. Known
quiescence is not recovery authority. Any new occupancy, contender, journal gap
or unknown owned state blocks release.

## Requested separate owner scope

1. **Evidence-only hardening:** in `scripts/failure_gate/supervisor.py` and
   `watchdog.py`, preserve bounded typed subordinate error observations and
   useful bounded traceback/phase information in the existing protected file
   trail/coordinator before reporting BLOCKED. Do not include environment
   values, locals, credentials or user data. Maintain the original error,
   retained exclusion, owned cleanup and all finite limits even if evidence
   writing itself fails.
2. **Focused fixtures:** add deterministic isolated cases proving actual error
   detail survives, remains bounded, cannot become PASS, and journal failure
   cannot suppress owned-work cleanup. This is evidence hardening, not an
   unverified observer behavioral fix.
3. **Exact incident recovery:** recheck workspace/root/current boot, canonical
   source/policy/actual approval, original intent/outcome records, all known
   exact owned incarnations and possible contenders. Preserve original partial
   output and failure; transactionally record the scoped decision and release
   only this retained incident after fresh durable readback. No age deletion,
   forged healthy release or blanket recovery endpoint.
4. **One registered non-tier diagnostic:** only after admitted fixtures and
   acknowledged recovery, supervise exactly `pnpm test` once to collect the
   actual subordinate outcome on the newly pinned evidence-enabled closure.
   Mark it diagnostic, not required-tier/installation acceptance. No
   `typecheck`, full tier sweep, second diagnostic or automatic retry.

Capture a new actual owner response before changing/using the governing
evidence route or releasing this incident. The resulting approved source
closure/decision must be pinned; no prospective hash or approval is invented.
Resolve uncertain evidence effects by existing operation/readback, not a blind
write retry. No cause-specific behavioral repair is authorized by this phase.

## New finite grant proposed

**10 additional minutes total**, separately accounted while retaining all prior
time, failures, run IDs and attempt counts. This is a proposed explicit
additional grant, not a silent reset of the expired/failed parent operation.

- At most one isolated fixture-suite pass: 30-second execution, 0.2-second grace,
  2-second verification, 1-second capture, 1 MiB output.
- Exact recovery, source/evidence inspection and readback share the same
  monotonic parent deadline; each read/write/queue phase is bounded.
- At most one diagnostic invocation: 300-second execution, further narrowed
  by remaining parent budget; 30-second queue; 15-second startup/owner stall;
  2-second registration; 20-second termination; 10-second capture;
  30,000-ms test / 15,000-ms hook; at most 8 MiB combined output.
- Typed error detail/traceback at most 8 KiB; full watchdog control-channel
  evidence remains within the existing aggregate bound.
- Any fixture, recovery or diagnostic uncertainty stops further dispatch.
  Lost acknowledgement retains exclusion. No extra launch slot is retry consent.

## Phase acceptance and next boundary

Fixtures prove bounded durable error detail with unchanged fail-closed lifecycle.
Recovery has an acknowledged exact disposition without converting prior failure
to PASS. The one diagnostic yields complete bounded observations or an explicitly
preserved typed failure. If its watchdog fails, retain its new incident and stop;
do not launch a second command or promise cause classification.

Use observed detail to prepare the next specific correction if warranted.
A diagnostic returning zero establishes only that attempt's observation, not
two real caller acceptance, proof of a fixed intermittent defect or provenance.

No ordinary activation/cutover, live reclaim, unrelated signals, service restart,
production/data/schema mutation, remote CI, baseline ignore, repair waiver,
platform task mutation, publication or full installation sweep. Protected host
attestation/global writer integration remain unavailable or unverified.
