import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const canonical = readFileSync(
  new URL("../../.agents/skills/paired-task-orchestration/SKILL.md", import.meta.url),
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

  assert.ok(
    priorAuthority.includes(
      "Never use alternate/copied skill definitions or .local mirrors as canonical inputs.",
    ),
  );
  assert.ok(
    priorAuthority.includes("Do not impose Failure Gate on unrelated work."),
  );
  assert.ok(
    canonical.includes(
      "Task creation, task execution, and advancement are separate decisions.",
    ),
  );
  assert.ok(canonical.includes("Approval remains with the user."));
  assert.ok(
    canonical.includes(
      "No automatic retry, activation, cancellation, status/dependency rewrite, scope waiver, budget renewal, new repair task, merge, or deployment follows from this state machine.",
    ),
  );
  assert.ok(
    canonical.includes(
      "Read the complete committed primary back and verify finalized scope/revision.",
    ),
  );
  assert.ok(
    canonical.includes("Read the entire persisted verifier back, recheck primary bindings around"),
  );
});
