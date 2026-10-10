import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const canonical = readFileSync(
  new URL("../../.agents/skills/paired-task-orchestration/SKILL.md", import.meta.url),
  "utf8",
);

// Contract text is compared across harmless wrapping, not internal coding methods.
const normalize = (text) => text.replace(/\s+/g, " ").trim();
const canonicalNormalized = normalize(canonical);
const reference = (name) =>
  readFileSync(
    new URL(
      `../../.agents/skills/paired-task-orchestration/references/${name}`,
      import.meta.url,
    ),
    "utf8",
  );

const heading =
  "## Failure Gate v4: deliverable locations and limited planner exception";

function exceptionSection() {
  const start = canonical.indexOf(heading);
  assert.notEqual(start, -1, "the canonical exception section must exist");

  const end = canonical.indexOf("\n## Recognize the requested mode", start);
  assert.notEqual(end, -1, "the exception must precede the mode table");
  return canonical.slice(start, end);
}

test("planner staging is limited to Failure Gate v4 paired planning and handoff", () => {
  const section = exceptionSection();

  assert.ok(
    section.includes(
      "Use this exception only for paired task planning/handoff of a Failure Gate v4 series.",
    ),
  );
  assert.ok(
    section.includes(
      "Keep all authoritative deliverables—including scripts, documentation, reports, skills, configuration, code, exports, and complete task plans—outside .local/ in tracked paths that survive task-agent merge and enter repository history.",
    ),
  );
});

test("all six staging prerequisites require proof and complete durable readback", () => {
  const section = exceptionSection();
  const conditions = [
    "1. Establish the requirement from the actual interface, host instructions, or observed rejection. Habit, convenience, or an unsupported assumption is not sufficient.",
    "2. Before staging an Agent-authored payload, preserve its complete authoritative contents in an appropriate tracked path outside .local/. The staging copy must never be the only copy of a deliverable.",
    "3. Treat .local/ contents as disposable transport or runtime artifacts—not as canonical sources, durable evidence, accepted reports, or proof of delivery.",
    "4. Read back and compare the complete staged payload with the authoritative copy. After task submission, independently read back the complete persisted task plan and actual dependencies. A staging file, successful submission message, or task title alone does not establish successful handoff.",
    "5. Record the required staging path, its purpose, the authoritative tracked path, and the observed submission/readback outcome in evidence outside .local/. Missing or truncated contents remain unresolved, not successfully delivered.",
    "6. This exception does not permit using .local/ skill definitions or mirrors as canonical instructions. Canonical skill sources remain under .agents/. It grants no additional task execution, validation, approval, lifecycle, merge, deployment, or runtime authority.",
  ];

  assert.deepEqual(
    [...section.matchAll(/^([1-6])\. /gm)].map((match) => match[1]),
    ["1", "2", "3", "4", "5", "6"],
  );
  for (const condition of conditions) {
    assert.ok(section.includes(condition), `missing staging condition: ${condition}`);
  }
});

test("missing durable-copy or persisted-plan proof blocks the affected handoff", () => {
  const section = exceptionSection();

  assert.ok(
    section.includes(
      "If the required staging workflow cannot preserve the authoritative deliverable outside .local/ or cannot establish complete persisted-task readback, stop the affected handoff and report the specific blocker.",
    ),
  );
  assert.ok(
    section.includes(
      "Do not silently broaden this exception or claim successful delivery.",
    ),
  );
  assert.ok(
    section.includes(
      "Authoring it does not establish that this host requires or supports .local/ staging.",
    ),
  );
});

test("canonical-source, pairing, approval, and execution boundaries remain intact", () => {
  const sectionStart = canonical.indexOf(heading);
  assert.notEqual(sectionStart, -1, "the canonical exception section must exist");
  const priorAuthority = canonical.slice(0, sectionStart);
  const priorAuthorityNormalized = normalize(priorAuthority);

  assert.ok(
    priorAuthorityNormalized.includes(
      "Never use alternate/copied skill definitions or `.local` mirrors as canonical inputs.",
    ),
  );
  assert.ok(
    priorAuthorityNormalized.includes("Do not impose Failure Gate on unrelated work."),
  );
  assert.ok(
    canonicalNormalized.includes(
      "Task creation, task execution, and advancement are separate decisions.",
    ),
  );
  assert.ok(canonicalNormalized.includes("Approval remains with the user."));
  assert.ok(
    canonicalNormalized.includes(
      "No automatic retry, activation, cancellation, status/dependency rewrite, scope waiver, budget renewal, new repair task, merge, or deployment follows from this state machine.",
    ),
  );
  assert.ok(
    canonicalNormalized.includes(
      "Read the complete committed primary back and verify finalized scope/revision.",
    ),
  );
  assert.ok(
    canonicalNormalized.includes("Read the entire persisted verifier back, recheck primary bindings around"),
  );
});

test("routine work is delegated while material exceptions and protected plans remain controlled", () => {
  const start = canonical.indexOf("## Outcomes, routine work, and material exceptions");
  const end = canonical.indexOf("\n## Read before acting", start);
  assert.ok(start >= 0 && end > start);
  const policy = normalize(canonical.slice(start, end));

  assert.ok(policy.includes("Normal programming within approved boundaries is the default."));
  assert.ok(policy.includes("without separate approvals, per-choice decision records, step-by-step narration, exhaustive method checklists, or routine method-change ledgers."));
  assert.ok(policy.includes("Selecting among unspecified equivalent methods is not itself a protected-plan amendment."));
  assert.ok(policy.includes("Exceptions, waivers, changed acceptance criteria, or reduced required coverage."));
  assert.ok(policy.includes("Material changes to approved scope, authority, execution permissions, or limits."));
  assert.ok(policy.includes("Material changes to safety, privacy, compatibility, data integrity, ownership, recovery, or completion boundaries."));
  assert.ok(policy.includes("Changes to expressly fixed requirements or protected executable plans."));
  assert.ok(policy.includes("Actual protected-payload changes still require their governing amendment route, bindings, and full readback."));
  assert.ok(policy.includes("Retain required approval, execution, incident, provenance, repair, and acceptance evidence"));
});

test("the verifier checks approved outcomes rather than reconstructing coding decisions", () => {
  assert.ok(canonicalNormalized.includes("The primary delivers the required outcome."));
  assert.ok(canonicalNormalized.includes("The verifier independently assesses the delivered outcome against the approved criteria, not the author's individual coding decisions."));
  assert.ok(canonicalNormalized.includes("Independent post-repair readback/review"));
  assert.ok(canonicalNormalized.includes("A repair author's claim alone is not independent evidence."));
  assert.ok(canonicalNormalized.includes("Require actual delivered inputs"));
});

test("supporting references preserve routine autonomy and required acceptance evidence", () => {
  for (const name of [
    "acceptance-and-confirmation.md",
    "series-state-and-handoff.md",
    "host-hook-contract.md",
  ]) {
    const text = normalize(reference(name));
    assert.match(text, /(?:[Nn]ormal programming|routine coding)/, name);
    assert.match(text, /acceptance/, name);
    assert.match(text, /protected.*(?:plan|payload)/, name);
    assert.match(text, /approval.*execution.*incident.*provenance.*acceptance/, name);
  }
});

test("illustrative layouts and coordination choices do not become new acceptance gates", () => {
  const series = normalize(reference("series-state-and-handoff.md"));
  const hook = normalize(reference("host-hook-contract.md"));
  assert.ok(series.includes("optional guidance, not a mandated schema, architecture, work-family checklist, or additional acceptance gate."));
  assert.ok(series.includes("Required identity, authority, delivery, and acceptance bindings remain mandatory"));
  assert.ok(hook.includes("An ownership-aware reservation/CAS is one example, not a required internal architecture"));
  assert.ok(hook.includes("equivalent verified mechanism must provide the applicable exclusion, version, and conflict guarantees."));
});

test("authoring-only revision implies neither checks nor task creation", () => {
  assert.ok(canonicalNormalized.includes("Revise definition/resources"));
  assert.ok(canonicalNormalized.includes("no implied task creation, feature implementation, checks, publication, or enforcement"));
  assert.ok(canonicalNormalized.includes("it does not create confirmation/review tasks or run checks unless separately authorized."));
});
