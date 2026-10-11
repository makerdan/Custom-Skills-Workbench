# Failure Gate v4 — exception-focused implementation autonomy (revision 2)

Prepared October 10, 2026 from the canonical .agents/skills/failure-gate-v4/
source in /@makerdantheman/Custom-Skills-Workbench. No alternate/custom skill
mirror was used as the source. This is a downloadable definition revision;
it is not installed into that project's canonical source or published workspace-wide.

## Revision 2: control exceptions, not routine programming

The owner directed: “The skill should control exceptions and changes to the
acceptance rules—not narrate or separately approve every routine programming step.”

Routine programming is now the explicit default. Remove per-choice approval,
step narration and method-change ledger requirements. Optional examples are outside
the normative reference and are not a mandatory verification checklist. Records
remain required for actual exceptions, material boundary/protected-plan changes,
authorized runs, incidents, provenance and acceptance—not each coding decision.
The concise normative reference replaces revision 1’s method-by-method discussion.

## Changes retained from revision 1

- Make routine implementation choices the Agent's responsibility within approved
  scope: internal structure, compatible representations, existing-tool adapters,
  fixture/test authoring, parsers, bounded queries, documentation and scoped repairs.
- Separate these choices from policy changes, protected-plan amendments, live
  operations, new side effects and execution permission. Governing version review,
  authentic approval and fresh bindings remain mandatory when applicable.
- State concise-plan fields and safe sharing of common instructions without
  dropping complete materialized payloads, original obligations or readback gates.
- Clarify that ordinary in-scope app edits require fresh affected evidence, not
  renewed unchanged tier approval; exactly matching policies still yield fresh
  bound decisions without repeated human policy approval after actual cutover.
- Add work-family examples, boundary scenarios and document-contract regression
  tests. Extend the existing authoring policy selector to include those tests.
- Move the existing semantic plan scaffold verbatim to a linked reference; core
  instructions remain under 500 lines. No required scaffold fields were removed.
- Preserve every unrelated reference, test and optional adapter byte-for-byte;
  SOURCE-MANIFEST.json records original and revised source hashes.

## Verification and limits

Performed: source readback, preservation comparison, core-length/frontmatter,
reference-link and package-integrity checks. The exact outcomes are delivered
alongside the ZIP in its SOURCE-VERIFICATION.json.

NOT_RUN: all executable authoring tests, optional writer-adapter tests, project
checks and real host acceptance. New tests are authored, not passing-test evidence.
Historical results in README belong to their original bound snapshots only.
No policy approval, budget grant, checked run, store initialization, runtime
migration, recovery/reclaim, activation, cutover, task advancement or deployment
occurred while authoring this revision. Independent formal definition/host
acceptance is not claimed.

## Adoption

ZIP layout: failure-gate-v4/ containing SKILL.md, the complete reference closure,
optional adapter, authoring launcher/tests, release notes and source manifest.
For .agents-compatible hosts, the canonical destination remains
.agents/skills/failure-gate-v4/. Use the host's actual authorized definition
installation/update and independent confirmation route. Do not edit disposable
mirrors, silently rebase existing installation plans, or assume the new source
is an execution grant. Existing project Task #149 concerns planning documents,
not installation of this new definition revision.
