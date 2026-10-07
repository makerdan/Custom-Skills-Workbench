import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const repoFile = (path) => new URL(`../../${path}`, import.meta.url);
const read = (path) => readFileSync(repoFile(path), "utf8");
const digest = (content) =>
  createHash("sha256").update(content, "utf8").digest("hex");

const policy = read("docs/validation/failure-gate-v4-series-handoff-policy.md");
const manifest = JSON.parse(
  read("docs/validation/paired-task-orchestration-handoff-amendment-manifest.json"),
);
const amendments = read("docs/validation/paired-task-orchestration-review-amendments.md");
const definitionPlan = read(
  "docs/validation/task-plans/paired-task-orchestration-definition-confirmation.md",
);
const resourcePlan = read(
  "docs/validation/paired-task-orchestration-verification-plan.md",
);

function sameSnapshotKey(expected, observed) {
  return expected.length === observed.length &&
    expected.every((value, index) => value === observed[index]);
}

function hasRequiredDependencies(actual, required) {
  return required.every((dependency) => actual.includes(dependency));
}

test("cooperative snapshot stays a named-series draft policy, not provider finalization", () => {
  assert.match(policy, /handoff_policy=cooperative_snapshot/);
  assert.match(policy, /proposed series-specific profile/);
  assert.match(policy, /independent acceptance is \*\*PENDING\*\*/);
  assert.match(policy, /native amendments \*\*NOT ATTEMPTED\*\*/);
  assert.match(policy, /does not change Router, Paired Task Orchestration, Failure Gate, Regression Guard/);
  assert.match(policy, /does \*\*not\*\* claim that the Router's provider-finalization prerequisite was met/);
  assert.match(policy, /does not supply compare-and-swap, immutable provider revisions, atomic attachment, global writer exclusion, scheduler control/);
  assert.equal(manifest.lifecycle.runtimeAuthority, "NONE_GRANTED");
  assert.equal(manifest.lifecycle.nativeAmendments, "NOT_ATTEMPTED");
});

test("definition-only and resource/plan review scopes remain separate", () => {
  assert.match(definitionPlan, /Corrections, if later separately authorized and independently accepted, are limited to `paired-task-orchestration\/SKILL\.md`/);
  assert.match(definitionPlan, /paired-task-orchestration-definition-confirmation\.md/);
  assert.match(definitionPlan, /Do not change any resource, report, plan, archive, manifest, installation history, or task-board record/);
  assert.match(resourcePlan, /corrections:resources-and-plan-documents-only/);
  assert.match(resourcePlan, /resource-package:three-supplied-references/);
  assert.match(resourcePlan, /all three resources, complete 18-piece\/36-payload plan/);
  assert.match(policy, /skill-install-confirmation\/SKILL\.md` package is absent/);
  assert.match(policy, /not repaired, installed, verified, copied, mirrored, or treated as universally inapplicable/);
});

test("each proposed native description is the complete bound payload, not a shortened link", () => {
  for (const ref of ["#107", "#108"]) {
    const binding = manifest.reviewBindings[ref];
    const payload = read(binding.completeDescription.path);
    const utf8Bytes = Buffer.byteLength(payload, "utf8");

    assert.equal(binding.completeDescription.byteForByteNativeDescription, true);
    assert.equal(utf8Bytes, binding.completeDescription.utf8Bytes);
    assert.equal(digest(payload), binding.completeDescription.sha256);
    assert.ok(payload.length > 10_000, `${ref} payload unexpectedly looks abbreviated`);
    assert.deepEqual(binding.proposedDependencies, ["#102", "#106", "#109"]);
    assert.ok(binding.proposedDependencies.includes("#102"));
    assert.ok(binding.proposedDependencies.includes("#106"));
    assert.ok(binding.proposedDependencies.includes("#109"));

    const truncated = payload.slice(0, -1);
    assert.notEqual(Buffer.byteLength(truncated, "utf8"), utf8Bytes);
    assert.notEqual(digest(truncated), binding.completeDescription.sha256);
  }

  assert.match(amendments, /not short links standing in for a plan/);
});

test("snapshot drift, wrong dependencies, and uncertain writes remain blockers", () => {
  const exactKey = manifest.reviewBindings["#107"].key;
  const changedPrimary = [...exactKey];
  changedPrimary[5] = "sha256:changed-primary";
  const changedPolicy = [...exactKey];
  changedPolicy[8] = "sha256:changed-policy";

  const fixtures = [
    { name: "exact owner snapshot", actual: [...exactKey], expected: true },
    { name: "changed primary bytes", actual: changedPrimary, expected: false },
    { name: "changed policy digest", actual: changedPolicy, expected: false },
  ];
  for (const fixture of fixtures) {
    assert.equal(
      sameSnapshotKey(exactKey, fixture.actual),
      fixture.expected,
      fixture.name,
    );
  }

  const required = ["#102", "#106", "#109"];
  assert.equal(
    hasRequiredDependencies(manifest.reviewBindings["#107"].proposedDependencies, required),
    true,
  );
  assert.equal(hasRequiredDependencies(["#106", "#109"], required), false);
  assert.match(amendments, /blind-retry/);
  assert.match(policy, /do not blindly retry, delete, replace, reopen, approve, or activate/);
});

test("pending delivery blocks substantive review without waiving runtime controls", () => {
  assert.match(policy, /Missing inputs produce \*\*AWAITING_DELIVERY\*\*/);
  assert.match(policy, /A merged `#102`, dependency link, task label, or source copy in another workspace is not delivery proof/);
  assert.match(definitionPlan, /one separately authorized invocation-driven recheck/);
  assert.match(resourcePlan, /one separately authorized invocation-driven recheck/);
  assert.match(policy, /does not approve either task, satisfy a validation tier, authorize implementation, start a command/);
  assert.match(policy, /supply a finite budget, establish independent supervision, final-writer coordination, a local Failure Gate grant, runtime readiness, recovery\/reclaim, or cutover/);
  assert.match(policy, /All original source\/bootstrap\/runtime controls remain in force/);
  assert.equal(manifest.futureFg02KeyTemplate.materialized, false);
  assert.equal(manifest.futureFg02KeyTemplate.currentNativePair, "NOT_CREATED");
});

test("the authored guard remains source-only and explicitly NOT_RUN", () => {
  assert.equal(manifest.regressionSource.path, "scripts/test/paired-task-handoff-policy.test.mjs");
  assert.equal(manifest.regressionSource.status, "NOT_RUN");
  assert.match(policy, /Provider payload ceilings and truncation behavior remain unknown/);
});
