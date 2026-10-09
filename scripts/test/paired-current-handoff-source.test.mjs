import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const repoFile = (path) => new URL(`../../${path}`, import.meta.url);
const read = (path) => readFileSync(repoFile(path), "utf8");
const digest = (content) =>
  createHash("sha256").update(content, "utf8").digest("hex");

const manifestPath = "docs/validation/paired-current-handoff-manifest.json";
const manifest = JSON.parse(read(manifestPath));

function auditRenewal(candidateManifest, documents) {
  const errors = [];
  const bindings = candidateManifest.currentBindings ?? [];
  for (const binding of bindings) {
    const content = documents[binding.path];
    if (typeof content !== "string") {
      errors.push(`missing:${binding.path}`);
      continue;
    }
    if (Buffer.byteLength(content, "utf8") !== binding.utf8Bytes) {
      errors.push(`bytes:${binding.path}`);
    }
    if (digest(content) !== binding.sha256) {
      errors.push(`digest:${binding.path}`);
    }
  }

  const requiredHistorical = [
    "paired-task-orchestration-manifest.json",
    "paired-task-orchestration-handoff-amendment-manifest.json",
    "paired-task-orchestration-verification.md",
    "paired-planner-staging-independent-confirmation.md",
  ];
  for (const path of requiredHistorical) {
    const binding = (candidateManifest.historicalBindings ?? []).find(
      (item) => item.path.endsWith(path),
    );
    if (!binding || binding.classification !== "historical_immutable") {
      errors.push(`historical:${path}`);
    }
  }

  const scope = candidateManifest.scopeLimits ?? {};
  if (scope.seriesPieces !== 18 || scope.payloads !== 36) {
    errors.push("scope:series-shape");
  }
  if (scope.fg01Acceptance !== "DISCOVERY_ONLY") {
    errors.push("scope:fg01");
  }
  if (
    scope.fg02Unfinished !== true ||
    scope.currentNativePair !== "NONE_CREATED" ||
    scope.automaticAdvancement !== false ||
    scope.localGateGrant !== "NONE"
  ) {
    errors.push("scope:authority-or-stage");
  }

  const acceptance = candidateManifest.acceptance ?? {};
  if (
    acceptance.status !== "PENDING_INDEPENDENT_RESOURCE_REVALIDATION" ||
    acceptance.acceptingTaskRef !== "#140" ||
    acceptance.authorMayAcceptOwnRepair !== false ||
    acceptance.taskStatusIsAcceptance !== false
  ) {
    errors.push("acceptance:independent-evidence-required");
  }

  const checkpoint = documents[
    "docs/validation/failure-gate-v4-series-checkpoint.md"
  ];
  if (
    typeof checkpoint !== "string" ||
    !checkpoint.includes("Current resource-handoff locator — 2026-10-09") ||
    !checkpoint.includes("#107/#108 are CANCELLED archived predecessors") ||
    !checkpoint.includes("#116/#126 are MERGED replacements") ||
    !checkpoint.includes("current native FG-02 pair is **NONE CREATED**") ||
    !checkpoint.includes("FG-02 g02 remains the earliest unfinished piece") ||
    !checkpoint.includes("No local Gate ID, tier, grant, approval, validation PASS") ||
    !checkpoint.includes("NOT_RUN")
  ) {
    errors.push("checkpoint:current-stage-or-not-run");
  }

  const report = documents["docs/validation/paired-current-handoff-renewal.md"];
  if (
    typeof report !== "string" ||
    !report.includes("PENDING INDEPENDENT RESOURCE REVALIDATION") ||
    !report.includes("The current report, manifest, checkpoint, and guard remain **PENDING independent assessment**") ||
    !report.includes("No task was created or mutated") ||
    /\*\*(?:Disposition|Acceptance|Result):\s*(?:ACCEPTED|PASS)\b/i.test(report)
  ) {
    errors.push("report:pending-or-authority-boundary");
  }

  return errors;
}

function sourceDocuments(bindings) {
  const documents = {};
  for (const binding of bindings) {
    documents[binding.path] = read(binding.path);
  }
  documents["docs/validation/failure-gate-v4-series-checkpoint.md"] = read(
    "docs/validation/failure-gate-v4-series-checkpoint.md",
  );
  documents["docs/validation/paired-current-handoff-renewal.md"] = read(
    "docs/validation/paired-current-handoff-renewal.md",
  );
  return documents;
}

test("current source, replit, report, and checkpoint bindings match delivered bytes", () => {
  assert.deepEqual(
    auditRenewal(manifest, sourceDocuments(manifest.currentBindings)),
    [],
  );
  assert.equal(manifest.regressionGuard.status, "NOT_RUN");
  assert.equal(
    manifest.regressionGuard.path,
    "scripts/test/paired-current-handoff-source.test.mjs",
  );
});

test("a changed source digest and missing required source are rejected", () => {
  const first = manifest.currentBindings[0];
  const goodDocuments = sourceDocuments(manifest.currentBindings);
  const altered = { ...goodDocuments, [first.path]: `${goodDocuments[first.path]}x` };
  assert.ok(auditRenewal(manifest, altered).some((error) => error.startsWith("bytes:")));

  const missing = { ...goodDocuments };
  delete missing[first.path];
  assert.ok(auditRenewal(manifest, missing).some((error) => error === `missing:${first.path}`));
});

test("historical bindings cannot be relabeled current or discarded", () => {
  const changed = structuredClone(manifest);
  const item = changed.historicalBindings.find((binding) =>
    binding.path.endsWith("paired-task-orchestration-verification.md"),
  );
  item.classification = "current";
  assert.ok(
    auditRenewal(changed, sourceDocuments(changed.currentBindings)).includes(
      "historical:paired-task-orchestration-verification.md",
    ),
  );

  const missing = structuredClone(manifest);
  missing.historicalBindings = missing.historicalBindings.filter(
    (binding) => !binding.path.endsWith("paired-task-orchestration-manifest.json"),
  );
  assert.ok(
    auditRenewal(missing, sourceDocuments(missing.currentBindings)).includes(
      "historical:paired-task-orchestration-manifest.json",
    ),
  );
});

test("native task status or report presence cannot fabricate acceptance", () => {
  const fabricated = structuredClone(manifest);
  fabricated.acceptance.status = "ACCEPTED";
  fabricated.acceptance.taskStatusIsAcceptance = true;
  fabricated.nativeEvidence = {
    "#126": { status: "MERGED" },
    "#140": { status: "PENDING" },
  };
  assert.ok(
    auditRenewal(fabricated, sourceDocuments(fabricated.currentBindings)).includes(
      "acceptance:independent-evidence-required",
    ),
  );

  const documents = sourceDocuments(manifest.currentBindings);
  documents["docs/validation/paired-current-handoff-renewal.md"] =
    `**Disposition: ACCEPTED because #126 is MERGED.**\n${documents["docs/validation/paired-current-handoff-renewal.md"]}`;
  assert.ok(
    auditRenewal(manifest, documents).includes(
      "report:pending-or-authority-boundary",
    ),
  );
});
