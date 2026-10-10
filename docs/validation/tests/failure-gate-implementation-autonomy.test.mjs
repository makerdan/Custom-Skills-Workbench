// INERT SOURCE DELIVERY. NOT_RUN under the authoring task.
// A later execution needs an actually permitted route and applicable bounds.
// These static assertions prove neither independent semantic acceptance nor
// host authority, supervision, activation, runtime behavior or policy approval.
// Standard library only; no child processes, project imports, hooks or stores.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const readDocument = (name) => {
  const url = new URL(`../${name}`, import.meta.url);
  const size = statSync(url).size;
  assert.ok(size <= 1_048_576, `Document read ceiling exceeded: ${name}`);
  return readFileSync(url, "utf8");
};
const sha256 = (text) =>
  createHash("sha256").update(text, "utf8").digest("hex");
const plan = readDocument("failure-gate-v4-task-series.md");
const bindings = JSON.parse(
  readDocument("failure-gate-implementation-autonomy-bindings.json"),
);
const start = "## Shared implementation-autonomy contract\n";
const end = "<!-- implementation-autonomy: end -->";
const contractOf = (text) => {
  const from = text.indexOf(start);
  const through = text.indexOf(end, from);
  assert.ok(from >= 0 && through >= from, "Missing full autonomy contract");
  assert.equal(text.indexOf(start, from + start.length), -1);
  return text.slice(from, through + end.length);
};
const contract = contractOf(plan);
const containsAll = (text, clauses) => {
  for (const clause of clauses) {
    assert.ok(text.includes(clause), `Missing static contract: ${clause}`);
  }
};

test("all 18 ordered pieces and 36 complete original payloads remain", () => {
  const pieces = [...plan.matchAll(/^## Piece (\d{2}) —/gm)].map((m) => m[1]);
  const expected = Array.from({ length: 18 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  assert.deepEqual(pieces, expected);
  const labels = [...plan.matchAll(/^# FG-(\d{2})-([IV]) —/gm)].map(
    (m) => `FG-${m[1]}-${m[2]}`,
  );
  assert.deepEqual(labels, expected.flatMap((id) => [`FG-${id}-I`, `FG-${id}-V`]));
  assert.equal(
    sha256(plan.slice(plan.indexOf("## Piece 01 —"))),
    bindings.preEdit.originalPieceAndHistorySha256,
    "Original acceptance, outcome, shared safeguards or history changed",
  );
  for (const heading of [
    "### Binding, owner, inputs, and outputs",
    "### Authorization and validation",
    "### Every verification task is audit-first, then scoped repair",
    "## Expected outcomes, evidence and task-level acceptance",
  ]) {
    assert.equal(plan.split(heading).length - 1, 36, heading);
  }
});

test("default autonomy delegates methods, not acceptance or authority", () => {
  containsAll(contract, [
    "without renewed owner design decisions, per-choice approval",
    "or a routine decision diary",
    "Required observable behavior, original acceptance/outcomes and evidence are fixed",
    "not additional acceptance criteria",
    "This delegates methods, not authority",
    "not prescribed architecture, a programming-step checklist",
    "already-authorized assigned defects after listing gaps",
    "fresh independent post-repair acceptance",
    "Source-only work is not permission for imports, syntax checks, tests, builds, CLI/store operations or live wiring",
    "does not launch it",
    "requires a separately scoped decision",
  ]);
});

test("changed evidence, governing versions and actual exceptions remain bounded", () => {
  containsAll(contract, [
    "do not require renewed tier authorization",
    "Relevant prior evidence becomes stale",
    "authorized validation must cover the new relevant inputs",
    "Changed governing runner/checker/wrapper/tier/policy versions",
    "applicable review and binding before results are accepted",
    "Selecting among unspecified equivalent methods is not itself a protected-plan amendment",
    "deferred-method resolution",
    "authorized method-only correction route",
    "old/new instructions where changed",
    "authority, evidence impact",
    "payload bindings",
    "not a diary of ordinary coding choices",
    "Never silently amend a protected native plan",
    "changed required behavior, public semantics, acceptance, coverage, scope, tier/parameters/limits",
    "unavailable authentic authority/capability",
    "Do not synthesize an approval",
    "block only affected execution/acceptance",
  ]);
});

test("deterministic reuse requires an existing genuine policy and a fresh decision", () => {
  containsAll(contract, [
    "genuinely verified, current, already-approved deterministic policy",
    "exactly matching tasks",
    "a fresh exact-bound decision for each task",
    "Do not request repeated human policy approval",
    "Unmatched/uncertain inputs, changed policy terms or stale bindings",
    "neither approves a new deterministic policy",
    "nor asserts that one is active or available",
  ]);
});

test("both g02 drafts contain the full contract without weakening their original bodies", () => {
  for (const role of ["i", "v"]) {
    const path = `task-plans/fg-02-g02-${role}.md`;
    const draft = readDocument(path);
    assert.equal(contractOf(draft), contract);
    const original = draft.replace(`${contract}\n\n`, "");
    const baseline = bindings.preEdit.files.find(
      (row) => row.path === `docs/validation/${path}`,
    );
    assert.ok(baseline, "Missing original draft binding");
    assert.equal(sha256(original), baseline.sha256);
    containsAll(draft, [
      "Source/proposal",
      "Cases NOT_RUN until separately authorized",
      "readback",
    ]);
    assert.match(draft, /[Ii]mports/);
    assert.match(draft, /syntax checks/);
    assert.match(draft, /tests, builds/);
    assert.match(draft, /CLI/);
    assert.match(draft, /store|stores/);
    assert.match(draft, /live wiring/);
  }
  containsAll(plan, [
    "insert that contract verbatim after the task title",
    "A link, section name, digest, short checklist or inaccessible shared reference",
    "Provider payload limits are not permission to abridge",
  ]);
});

test("source locators retain pending independent acceptance and NOT_RUN", () => {
  for (const path of [
    "failure-gate-v4-series-checkpoint.md",
    "paired-current-handoff-status.md",
  ]) {
    containsAll(readDocument(path), [
      "failure-gate-implementation-autonomy-amendment.md",
      "failure-gate-implementation-autonomy-bindings.json",
      "NOT_RUN",
    ]);
  }
  containsAll(contract, [
    "Source delivery is not host acceptance",
    "task lifecycle is not authority",
    "report/guard creation is not activation",
    "Independent amendment acceptance remains pending",
    "no FG-02 card or series advancement follows",
  ]);
  assert.equal(bindings.guardExecution, "NOT_RUN");
  assert.equal(bindings.independentAcceptance, "PENDING");
});
