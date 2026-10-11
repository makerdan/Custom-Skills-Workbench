import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const repoFile = (path) => new URL(`../../${path}`, import.meta.url);
const read = (path) => readFileSync(repoFile(path), "utf8");
const digest = (content) =>
  createHash("sha256").update(content, "utf8").digest("hex");

// Current documentary generation; the previous manifest remains immutable history.
// These source assertions are inert until separately authorized execution.
const manifestPath = "docs/validation/paired-prerequisites-refresh-manifest.json";
const manifest = JSON.parse(read(manifestPath));

function auditPreparation(candidate) {
  const errors = [];
  const preparation = candidate.preparation;
  const rows = ["D1", "D2", "D3", "D4", "S1", "S2", "S3", "S4", "S5", "S6",
    "H1", "H2", "H3", "B1", "B2", "B3", "B4", "B5", "C1", "C2", "C3", "C4"];
  if (JSON.stringify(candidate.requiredCriteria) !== JSON.stringify(rows)) {
    errors.push("preparation:parent-rows");
  }
  if (JSON.stringify(candidate.retiredSubcriteria.map((item) => item.id).sort()) !==
      JSON.stringify(["B2-R1", "B5-R1"])) {
    errors.push("preparation:exclusions");
  }
  if (preparation?.disposition !== "DOCUMENTARY_PREPARATION_COMPLETE_READINESS_BLOCKED" ||
      preparation?.independentAcceptanceGranted !== false ||
      preparation?.recipientDelivery !== "UNVERIFIED" ||
      preparation?.validationLaunches !== 0) {
    errors.push("preparation:authority");
  }
  const payload = read("docs/validation/task-plans/paired-retrospective-confirmation.md");
  for (const criterion of preparation?.originalPrimaryCriteria ?? []) {
    if (!payload.includes(`- ${criterion}`)) errors.push("preparation:original-criterion");
  }
  if (preparation?.originalPrimaryCriteria?.length !== 6) {
    errors.push("preparation:six-originals");
  }
  for (const clause of [
    "No section is vague, self-referential, or deferred to future work.",
    "A future Planner reading the skill file cold could follow it without ambiguity.",
    "Make any changes outside `.agents/skills/paired-task-orchestration/SKILL.md`",
    "Refactor or modify adjacent skills",
    "Add speculative content beyond what the original spec called for",
    "Expand scope to include feature-code changes inspired by the skill's topic",
    "Silently fix gaps without first listing them",
    "Exact `#102`-only read-only exception",
    "Report only in the task conversation.",
    "The separate #120 amendment barrier/applicability cannot use the #102 exception.",
  ]) {
    if (!payload.includes(clause)) errors.push(`preparation:clause:${clause}`);
  }
  for (const entry of candidate.changedSourceLedger) {
    const content = read(entry.path);
    if (entry.current.utf8Bytes !== Buffer.byteLength(content, "utf8") ||
        entry.current.sha256 !== digest(content)) {
      errors.push(`preparation:ledger:${entry.path}`);
    }
  }
  if (preparation?.acceptedRuleSha256 !==
      digest(read(".agents/skills/skill-install-confirmation/SKILL.md")) ||
      !payload.includes(preparation.acceptedRuleSha256) ||
      !payload.includes(digest(read(".agents/skills/paired-task-orchestration/SKILL.md")))) {
    errors.push("preparation:current-source");
  }
  return errors;
}

test("current preparation retains source bindings, all criteria and separate authority", () => {
  assert.deepEqual(auditPreparation(manifest), []);
  const missing = structuredClone(manifest);
  missing.requiredCriteria = missing.requiredCriteria.filter((id) => id !== "B5");
  assert.ok(auditPreparation(missing).includes("preparation:parent-rows"));
  const waiver = structuredClone(manifest);
  waiver.retiredSubcriteria.push({ id: "B2", status: "EXCLUDED" });
  assert.ok(auditPreparation(waiver).includes("preparation:exclusions"));
  const accepted = structuredClone(manifest);
  accepted.preparation.independentAcceptanceGranted = true;
  assert.ok(auditPreparation(accepted).includes("preparation:authority"));
  const stale = structuredClone(manifest);
  stale.changedSourceLedger[0].current.sha256 = "0".repeat(64);
  assert.ok(auditPreparation(stale).some((error) => error.startsWith("preparation:ledger:")));
});

function auditRenewal(candidateManifest, documents) {
  const errors = [];
  const bindings = candidateManifest.currentBindings ?? [];
  const requiredCurrent = [
    "replit.md",
    ".agents/skills/paired-task-orchestration/SKILL.md",
    ".agents/skills/skill-install-confirmation/SKILL.md",
    "docs/validation/failure-gate-v4-task-series.md",
    "docs/validation/failure-gate-v4-series-handoff-policy.md",
    "docs/validation/paired-task-orchestration-verification-plan.md",
    "docs/validation/paired-task-orchestration-verification.md",
    "docs/validation/paired-native-handoff-current-readback-annex.json",
    "docs/validation/failure-gate-v4-series-checkpoint.md",
    "docs/validation/paired-current-handoff-renewal.md",
    "docs/validation/task-plans/task-139-renew-current-resource-handoff-evidence.md",
    "docs/validation/task-plans/remove-retired-review-requirements.md",
    "docs/validation/retired-review-cleanup-native-readback.json",
    "scripts/test/paired-current-handoff-source.test.mjs",
  ];
  for (const path of requiredCurrent) {
    if (!bindings.some((binding) => binding.path === path)) {
      errors.push(`required-binding:${path}`);
    }
  }
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
    const expected = path === "paired-task-orchestration-verification.md"
      ? "owner_edited_revision"
      : "historical_immutable";
    if (!binding || binding.classification !== expected) {
      errors.push(`historical:${path}`);
    }
  }

  const revision = candidateManifest.ownerDirectedRevision ?? {};
  if (
    revision.mode !== "SCOPED_REQUIREMENT_REMOVAL" ||
    revision.originalUnchangedClaimsInvalidated !== true ||
    revision.independentAcceptanceGranted !== false ||
    revision.guardStatus !== "NOT_RUN"
  ) {
    errors.push("revision:boundary");
  }
  for (const id of ["B2-R1", "B5-R1"]) {
    const item = (candidateManifest.retiredSubcriteria ?? []).find(
      (criterion) => criterion.id === id,
    );
    if (!item || item.status !== "EXCLUDED" || item.contributesBlocker !== false) {
      errors.push(`retired:${id}`);
    }
    if ((candidateManifest.requiredCriteria ?? []).includes(id) ||
        (candidateManifest.blockingCriteria ?? []).includes(id)) {
      errors.push(`retired-required:${id}`);
    }
  }
  if (candidateManifest.criterionDisposition?.affected?.B2 !==
      "CURRENT_COMPARISONS_RETAINED_NO_NEW_ACCEPTANCE" ||
      candidateManifest.criterionDisposition?.affected?.B5 !==
      "PARTIAL_BLOCKED_REBIND_CHANGED_SOURCES") {
    errors.push("criteria:remaining-boundaries");
  }
  for (const [path, content] of Object.entries(documents)) {
    if (/B[25]-R1\s+(?:REQUIRED|BLOCKED|PASS|ACCEPTED)\b/i.test(content)) {
      errors.push(`retired-report:${path}`);
    }
  }
  const annexPath = "docs/validation/paired-native-handoff-current-readback-annex.json";
  try {
    const annex = JSON.parse(documents[annexPath]);
    if (annex.ownerDirectedRevision?.snapshotRepresentation !== "OWNER_EDITED_EXCERPTS" ||
        annex.ownerDirectedRevision?.originalUnchangedClaimsInvalidated !== true) {
      errors.push("snapshots:representation");
    }
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      if (value.descriptionRepresentation === "OWNER_EDITED_EXCERPT") {
        if (typeof value.description !== "string" ||
            value.descriptionUtf8Bytes !== Buffer.byteLength(value.description, "utf8") ||
            value.descriptionSha256 !== digest(value.description)) {
          errors.push("snapshots:binding");
        }
      } else if (typeof value.description === "string" &&
                 value.description.startsWith("<!-- owner-edited revision:")) {
        errors.push("snapshots:unlabeled-edit");
      }
      for (const child of Object.values(value)) visit(child);
    };
    visit(annex);
  } catch {
    errors.push("snapshots:missing-or-invalid");
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
    acceptance.acceptingTaskRef !== "#157" ||
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
    !report.includes("No task lifecycle or dependency was changed by this cleanup") ||
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

test("owner-edited revisions exclude only the selected subcriteria, not aggregate gates", () => {
  const documents = sourceDocuments(manifest.currentBindings);
  assert.deepEqual(auditRenewal(manifest, documents), []);
  assert.equal(manifest.criterionDisposition.affected.B2, "CURRENT_COMPARISONS_RETAINED_NO_NEW_ACCEPTANCE");
  assert.equal(manifest.criterionDisposition.affected.B5, "PARTIAL_BLOCKED_REBIND_CHANGED_SOURCES");
  for (const id of ["B2-R1", "B5-R1"]) {
    const required = structuredClone(manifest);
    required.requiredCriteria = [id];
    assert.ok(auditRenewal(required, documents).includes(`retired-required:${id}`));
    const blocked = structuredClone(manifest);
    blocked.retiredSubcriteria.find((item) => item.id === id).contributesBlocker = true;
    assert.ok(auditRenewal(blocked, documents).includes(`retired:${id}`));
    const path = "docs/validation/paired-current-handoff-renewal.md";
    const report = { ...documents, [path]: `${documents[path]}\n${id} REQUIRED\n` };
    assert.ok(auditRenewal(manifest, report).includes(`retired-report:${path}`));
  }
  const discarded = structuredClone(manifest);
  discarded.criterionDisposition.affected.B5 = "PASS";
  assert.ok(auditRenewal(discarded, documents).includes("criteria:remaining-boundaries"));
  const fabricated = structuredClone(manifest);
  fabricated.ownerDirectedRevision.independentAcceptanceGranted = true;
  assert.ok(auditRenewal(fabricated, documents).includes("revision:boundary"));
});

test("edited native snapshots must be labeled and byte-bound, and required bindings cannot disappear", () => {
  const path = "docs/validation/paired-native-handoff-current-readback-annex.json";
  const documents = sourceDocuments(manifest.currentBindings);
  const revised = JSON.parse(documents[path]);
  revised.ownerDirectedRevision.snapshotRepresentation = "ORIGINAL_PROVIDER_RESPONSE";
  assert.ok(auditRenewal(manifest, { ...documents, [path]: JSON.stringify(revised) })
    .includes("snapshots:representation"));
  const tampered = JSON.parse(documents[path]);
  tampered.taskRecords.push({
    description: "<!-- owner-edited revision: fixture -->",
    descriptionRepresentation: "OWNER_EDITED_EXCERPT",
    descriptionUtf8Bytes: 1,
    descriptionSha256: "0".repeat(64),
  });
  assert.ok(auditRenewal(manifest, { ...documents, [path]: JSON.stringify(tampered) })
    .includes("snapshots:binding"));
  const missing = structuredClone(manifest);
  missing.currentBindings = missing.currentBindings.filter((binding) => binding.path !== path);
  assert.ok(auditRenewal(missing, documents).includes(`required-binding:${path}`));
});
