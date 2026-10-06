#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_NAME = "check-regression-guard";
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITER = path.join(PROJECT_ROOT, "scripts", "failure_gate", "run_writer.py");
const REGRESSION_HEADING = /^## Regression Guard\s*$/gm;
const TASK_STRUCTURE_HEADINGS = [
  /^## What & Why\s*$/m,
  /^## Done looks like\s*$/m,
  /^## Steps\s*$/m,
  /^## Relevant files\s*$/m,
  /^## Pre-existing failures to ignore\s*$/m,
  /^## Validation\s*$/m,
  /^## Regression Guard\s*$/m,
];
const MODES = new Set(["--fix-stub", "--stubs-only"]);
const FIX_STUB = `## Regression Guard
**Covers:** TODO: describe the scenario, boundary, invariant, lifecycle, reliability property, or contract.
**Test location:** TODO: name the test file that will catch a recurrence.
**What it checks:** TODO: state the specific assertion that fails if the regression returns.
`;

function fail(message) {
  console.error(`${SCRIPT_NAME}: ${message}`);
  process.exitCode = 1;
}

function writePlan(file, previousContents, updatedContents) {
  const relative = path.relative(PROJECT_ROOT, file);
  const isWorkspaceFile =
    relative !== "" && !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." && !path.isAbsolute(relative);
  if (!isWorkspaceFile) {
    // A caller may intentionally validate an external plan. It cannot affect
    // this workspace's accepted snapshot, so preserve the standalone behavior.
    writeFileSync(file, updatedContents);
    return;
  }

  const expectedDigest = createHash("sha256")
    .update(Buffer.from(previousContents, "utf8"))
    .digest("hex");
  execFileSync(
    "python3",
    ["-B", WRITER, "--write-stdin", relative, expectedDigest],
    { cwd: PROJECT_ROOT, input: updatedContents, encoding: "utf8" },
  );
}

function parseMode(args) {
  if (args.length > 1 || (args.length === 1 && !MODES.has(args[0]))) {
    throw new Error("usage: node scripts/check-regression-guard.mjs [--fix-stub|--stubs-only]");
  }
  return args[0] ?? "strict";
}

function findPlanFiles() {
  if (Object.hasOwn(process.env, "TASK_PLAN_FILE")) {
    const namedPath = process.env.TASK_PLAN_FILE;
    if (!namedPath) {
      throw new Error("TASK_PLAN_FILE is set but empty; provide a path ending in .md.");
    }
    if (!namedPath.endsWith(".md")) {
      throw new Error(`TASK_PLAN_FILE must end in .md: ${namedPath}`);
    }

    const resolvedPath = path.resolve(process.cwd(), namedPath);
    let info;
    try {
      info = statSync(resolvedPath);
    } catch {
      throw new Error(`TASK_PLAN_FILE does not exist: ${namedPath}`);
    }
    if (!info.isFile()) {
      throw new Error(`TASK_PLAN_FILE is not a file: ${namedPath}`);
    }
    return [resolvedPath];
  }

  let trackedMarkdown;
  try {
    trackedMarkdown = execFileSync("git", ["ls-files", "-z", "--", "*.md"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    throw new Error(
      `could not list tracked Markdown files${detail ? `: ${detail}` : ""}`,
    );
  }

  return trackedMarkdown
    .split("\0")
    .filter(Boolean)
    .map((file) => path.resolve(process.cwd(), file))
    .filter((file) => {
      try {
        const contents = readFileSync(file, "utf8");
        const structuralHeadings = TASK_STRUCTURE_HEADINGS.filter((heading) =>
          heading.test(contents),
        );
        return (
          contents.includes("## What & Why") && structuralHeadings.length >= 2
        );
      } catch {
        return false;
      }
    });
}

function getMetadata(contents) {
  const matches = [
    ...contents.matchAll(/<!--\s*regression-guard:\s*([^>]*?)\s*-->/gi),
  ];
  if (matches.length > 1) {
    return { error: "multiple regression-guard metadata comments" };
  }
  if (matches.length === 0) {
    return { value: null };
  }

  const value = matches[0][1].trim();
  if (value !== "required" && value !== "not-applicable") {
    return {
      error:
        "regression-guard metadata must be exactly 'required' or 'not-applicable'",
    };
  }
  return { value };
}

function findGuardSections(contents) {
  const matches = [...contents.matchAll(REGRESSION_HEADING)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const nextHeading = contents.slice(start).search(/^##\s+/m);
    const end = nextHeading < 0 ? contents.length : start + nextHeading;
    return {
      headingStart: match.index,
      bodyStart: start,
      bodyEnd: end,
      body: contents.slice(start, end),
      index,
    };
  });
}

function extractField(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...body.matchAll(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*(.*)$`, "gm"))];
  return {
    count: matches.length,
    value: matches[0]?.[1]?.trim() ?? "",
  };
}

function containsPlaceholder(value) {
  return (
    /\b(?:TBD|TODO|FILL\s*IN|PLACEHOLDER)\b/i.test(value) ||
    /<[^>\n]*(?:scenario|file path|assertion|what|fill in)[^>\n]*>/i.test(value)
  );
}

function isTestLocation(location) {
  return (
    /(^|\/)(__tests__|tests?|e2e|cypress|playwright)(\/|$)/i.test(location) ||
    /(?:^|\/)[^/]*\.(?:test|spec)\.[a-z0-9]+$/i.test(location)
  );
}

function isAcceptedDeferral(location) {
  return /^Deferred to task #\d+ \(accepted\) — .{8,}$/i.test(location);
}

function getRelevantPaths(contents) {
  const headings = [...contents.matchAll(/^## Relevant files\s*$/gm)];
  if (headings.length !== 1) return [];
  const start = headings[0].index + headings[0][0].length;
  const nextHeading = contents.slice(start).search(/^##\s+/m);
  const end = nextHeading < 0 ? contents.length : start + nextHeading;
  const body = contents.slice(start, end);
  return [
    ...body.matchAll(/\b((?:artifacts|scripts|lib)\/[A-Za-z0-9._/-]+)/g),
  ].map((match) => match[1].replace(/[.,;:)]+$/, ""));
}

function checkLayer(testLocation, contents, errors) {
  const relevantPaths = getRelevantPaths(contents);
  const affectedArtifacts = [
    "artifacts/api-server",
    "artifacts/skills-workbench",
    "artifacts/mockup-sandbox",
  ].filter((root) => relevantPaths.some((file) => file.startsWith(`${root}/`)));

  if (affectedArtifacts.length === 0 || isAcceptedDeferral(testLocation)) return;
  if (
    /(^|\/)(e2e|cypress|playwright)(\/|$)/i.test(testLocation)
  ) {
    return;
  }

  const matchingArtifact = affectedArtifacts.find((root) =>
    testLocation.startsWith(`${root}/`),
  );
  if (!matchingArtifact) {
    errors.push(
      `Test location must be in the affected artifact (${affectedArtifacts.join(", ")}) or an e2e test when the regression crosses layers.`,
    );
  }
}

function sectionOrderErrors(contents, section) {
  const errors = [];
  const precedingHeadings = [
    "## Pre-existing failures to ignore",
    "## Validation",
  ];
  for (const heading of precedingHeadings) {
    const position = contents.indexOf(heading);
    if (position >= 0 && position > section.headingStart) {
      errors.push(`${heading} must appear before ## Regression Guard.`);
    }
  }
  const relevantFilesPosition = contents.indexOf("## Relevant files");
  if (
    relevantFilesPosition >= 0 &&
    relevantFilesPosition < section.headingStart
  ) {
    errors.push("## Regression Guard must appear before ## Relevant files.");
  }
  return errors;
}

function validateSection(contents, section) {
  const errors = [];
  const body = section.body.trim();
  const selfSatisfying = /^\*\*Self-satisfying\*\*\s*[—-]\s*(.+)$/im.exec(body);
  const naMarker = /^\*\*N\/A\*\*\s*$/im.test(body);
  const whyNa = extractField(body, "Why N/A");
  const fields = {
    covers: extractField(body, "Covers"),
    testLocation: extractField(body, "Test location"),
    whatItChecks: extractField(body, "What it checks"),
  };
  const hasTemplateFields = Object.values(fields).some((field) => field.count > 0);
  const declarationKinds = Number(Boolean(selfSatisfying)) + Number(naMarker);

  if (declarationKinds > 1 || (declarationKinds === 1 && hasTemplateFields)) {
    errors.push("use only one declaration form: template fields, N/A, or Self-satisfying.");
    return errors;
  }

  if (selfSatisfying) {
    if (containsPlaceholder(selfSatisfying[1]) || selfSatisfying[1].trim().length < 12) {
      errors.push("Self-satisfying declaration needs a concrete, non-placeholder description.");
    }
    return [...errors, ...sectionOrderErrors(contents, section)];
  }

  if (naMarker) {
    if (whyNa.count !== 1 || !whyNa.value || containsPlaceholder(whyNa.value)) {
      errors.push("N/A declaration must include one specific, non-placeholder **Why N/A:** reason.");
      return errors;
    }
    if (!hasValidNaReason(whyNa.value)) {
      errors.push(
        "**Why N/A:** must explain one valid reason: real-timing race, unmockable external API behavior, visual regression without screenshot infrastructure, or feature removal.",
      );
    }
    return [...errors, ...sectionOrderErrors(contents, section)];
  }

  if (whyNa.count > 0 || declarationKinds === 0) {
    for (const [label, field] of Object.entries(fields)) {
      if (field.count !== 1) {
        errors.push(`expected exactly one **${fieldLabel(label)}:** field.`);
      } else if (!field.value || containsPlaceholder(field.value)) {
        errors.push(`**${fieldLabel(label)}:** must contain real, non-placeholder content.`);
      }
    }
    if (whyNa.count > 0) {
      errors.push("**Why N/A:** is only valid with a standalone **N/A** declaration.");
    }
    if (fields.testLocation.count === 1 && fields.testLocation.value) {
      const location = fields.testLocation.value.replace(/^`|`$/g, "");
      if (
        !isAcceptedDeferral(location) &&
        (!isTestLocation(location) || path.isAbsolute(location) || location.includes(".."))
      ) {
        errors.push("**Test location:** must name a relative test file or a properly documented accepted deferral.");
      }
      checkLayer(location, contents, errors);
    }
    if (fields.covers.count !== 1 || fields.testLocation.count !== 1 || fields.whatItChecks.count !== 1) {
      return errors;
    }
  }

  return [...errors, ...sectionOrderErrors(contents, section)];
}

function fieldLabel(key) {
  return {
    covers: "Covers",
    testLocation: "Test location",
    whatItChecks: "What it checks",
  }[key];
}

function hasValidNaReason(reason) {
  const normalized = reason.toLowerCase();
  const words = reason.trim().split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;
  return [
    /race condition|wall-clock|real timing|genuine timing|real-world timing/.test(normalized),
    /unmockable external api|live third-party|third-party service|upstream endpoint/.test(normalized),
    /visual regression|screenshot|pixel.diff/.test(normalized) &&
      /no screenshot|no pixel.diff|lacks screenshot|without screenshot|no infrastructure/.test(normalized),
    /feature (?:is )?removed|removes the feature|code path is gone|no behavior left/.test(normalized),
  ].some(Boolean);
}

function validatePlan(file, mode) {
  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch (error) {
    return [`cannot read plan: ${error.message}`];
  }

  const sections = findGuardSections(contents);
  const metadata = getMetadata(contents);

  if (mode === "--fix-stub") {
    if (
      metadata.value === "required" &&
      sections.length === 0
    ) {
      const insertion = contents.indexOf("## Relevant files");
      const updated =
        insertion >= 0
          ? `${contents.slice(0, insertion).replace(/\s*$/, "\n\n")}${FIX_STUB}\n${contents.slice(insertion)}`
          : `${contents.replace(/\s*$/, "")}\n\n${FIX_STUB}\n`;
      try {
        writePlan(file, contents, updated);
      } catch (error) {
        return [`could not safely write plan: ${error.message}`];
      }
      console.log(`${path.relative(process.cwd(), file)}: inserted Regression Guard stub.`);
    }
    return [];
  }

  if (mode === "--stubs-only") {
    if (sections.some((section) => containsPlaceholder(section.body))) {
      return ["unfilled placeholder found in ## Regression Guard."];
    }
    return [];
  }

  const errors = [];
  if (metadata.error) errors.push(metadata.error);
  if (sections.length > 1) {
    errors.push("multiple ## Regression Guard sections found.");
    return errors;
  }
  if (sections.length === 0) {
    if (metadata.value === "not-applicable") return errors;
    if (metadata.value === "required") {
      errors.push("missing ## Regression Guard section; run --fix-stub and fill in the declaration.");
    } else if (!metadata.error) {
      errors.push(
        "missing Planner applicability metadata; choose required or not-applicable using the human classification.",
      );
    }
    return errors;
  }

  const section = sections[0];
  if (metadata.value === "not-applicable") {
    // A declaration is still checked when present; metadata only resolves the
    // missing-section case and never overrides what a human wrote.
  }
  errors.push(...validateSection(contents, section));
  return errors;
}

function main() {
  let mode;
  try {
    mode = parseMode(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
    return;
  }

  let planFiles;
  try {
    planFiles = findPlanFiles();
  } catch (error) {
    fail(error.message);
    return;
  }

  let violations = 0;
  for (const file of planFiles) {
    const errors = validatePlan(file, mode);
    if (errors.length > 0) {
      violations += errors.length;
      for (const error of errors) {
        console.error(`${path.relative(process.cwd(), file)}: ${error}`);
      }
    }
  }

  if (mode === "--fix-stub") {
    console.log(`Regression Guard fix-stub pass complete (${planFiles.length} plan(s) checked).`);
    return;
  }
  if (violations > 0) {
    console.error(`Regression Guard check failed with ${violations} violation(s).`);
    process.exitCode = 1;
    return;
  }
  console.log(`Regression Guard check passed (${planFiles.length} plan(s) checked).`);
}

main();