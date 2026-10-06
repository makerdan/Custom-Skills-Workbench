import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../check-regression-guard.mjs",
);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

function withTempDir(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "regression-guard-"));
  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function plan(contents, metadata = "<!-- regression-guard: required -->") {
  return `${metadata}
# Test task

## What & Why
A task summary.

## Done looks like
- A concrete outcome.

## Pre-existing failures to ignore
- None.

## Validation
- Run the unit tests.

## Regression Guard
${contents}

## Relevant files
- artifacts/api-server/src/routes/example.ts
`;
}

function withoutGuard(contents) {
  return contents.replace(
    /^## Regression Guard\s*\n[\s\S]*?(?=^## Relevant files\s*$)/m,
    "",
  );
}

function invoke(cwd, args = [], extraEnv = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}

function assertPassed(result) {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

function assertFailed(result, message) {
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, message);
}

const validTemplate = `**Covers:** A backend route receives an invalid upload and must reject it without saving data.
**Test location:** artifacts/api-server/test/routes.test.ts
**What it checks:** Asserts the response is a validation error and no upload record or object is persisted.`;

test("accepts a compliant, layer-appropriate template declaration", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(file, plan(validTemplate));
    assertPassed(invoke(directory, [], { TASK_PLAN_FILE: file }));
  });
});

test("rejects malformed, incomplete, and placeholder declarations", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(file, plan("**Covers:** TBD"));
    const result = invoke(directory, [], { TASK_PLAN_FILE: file });
    assertFailed(result, /expected exactly one \*\*Test location:\*\* field/);
    assert.match(result.stderr, /placeholder/i);
  });
});

test("accepts the canonical N/A reason categories and rejects vague reasons", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    const validReasons = [
      "This race condition requires genuine wall-clock timing because fake timers cannot reproduce the concurrent scheduler behavior involved.",
      "The failure depends on unmockable external API behavior from a live third-party service that cannot be faithfully reproduced in the local test harness.",
      "This visual regression has no deterministic pixel assertion because the project has no screenshot or pixel-diff infrastructure.",
      "The feature is removed entirely and its code path is gone, so there is no remaining behavior that an automated test could guard.",
    ];
    for (const reason of validReasons) {
      writeFileSync(file, plan(`**N/A**\n**Why N/A:** ${reason}`));
      assertPassed(invoke(directory, [], { TASK_PLAN_FILE: file }));
    }

    writeFileSync(file, plan(`**N/A**
**Why N/A:** It is hard to test.`));
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: file }), /valid reason/);
  });
});

test("accepts a concrete self-satisfying declaration and rejects a placeholder", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(
      file,
      plan("**Self-satisfying** — the deliverable is the guard script and its automated regression tests."),
    );
    assertPassed(invoke(directory, [], { TASK_PLAN_FILE: file }));

    writeFileSync(file, plan("**Self-satisfying** — TODO"));
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: file }), /concrete, non-placeholder/);
  });
});

test("uses explicit exclusion metadata and never classifies from title keywords", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(
      file,
      withoutGuard(plan("", "<!-- regression-guard: not-applicable -->")),
    );
    assertPassed(invoke(directory, [], { TASK_PLAN_FILE: file }));

    writeFileSync(
      file,
      withoutGuard(plan("", "")).replace("# Test task", "# Fix a broken workflow"),
    );
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: file }), /missing Planner applicability metadata/);
  });
});

test("--fix-stub inserts only for explicitly qualifying plans and strict rejects the stub", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(file, plan("", "<!-- regression-guard: required -->").replace(
      "## Regression Guard\n",
      "",
    ));
    assertPassed(invoke(directory, ["--fix-stub"], { TASK_PLAN_FILE: file }));
    const updated = readFileSync(file, "utf8");
    assert.match(updated, /## Regression Guard/);
    assert.match(updated, /TODO:/);
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: file }), /placeholder/i);

    const excluded = path.join(directory, "excluded.md");
    writeFileSync(
      excluded,
      withoutGuard(plan("", "<!-- regression-guard: not-applicable -->")),
    );
    const before = readFileSync(excluded, "utf8");
    assertPassed(invoke(directory, ["--fix-stub"], { TASK_PLAN_FILE: excluded }));
    assert.equal(readFileSync(excluded, "utf8"), before);
  });
});

test("--stubs-only ignores missing sections but rejects placeholders in existing ones", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(file, withoutGuard(plan("", "")));
    assertPassed(invoke(directory, ["--stubs-only"], { TASK_PLAN_FILE: file }));

    writeFileSync(file, plan("**Covers:** a described scenario with incomplete fields"));
    assertPassed(invoke(directory, ["--stubs-only"], { TASK_PLAN_FILE: file }));

    writeFileSync(file, plan("**Covers:** TODO"));
    assertFailed(invoke(directory, ["--stubs-only"], { TASK_PLAN_FILE: file }), /placeholder/i);
  });
});

test("rejects a test location in a different affected artifact", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    writeFileSync(
      file,
      plan(validTemplate.replace(
        "artifacts/api-server/test/routes.test.ts",
        "artifacts/skills-workbench/src/lib/example.test.mjs",
      )),
    );
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: file }), /affected artifact/);
  });
});

test("allows an e2e test for a regression that crosses artifact boundaries", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    const crossLayerPlan = plan(
      validTemplate.replace(
        "artifacts/api-server/test/routes.test.ts",
        "artifacts/e2e/upload-flow.spec.ts",
      ),
    ).replace(
      "- artifacts/api-server/src/routes/example.ts",
      "- artifacts/api-server/src/routes/example.ts\n- artifacts/skills-workbench/src/lib/upload.ts",
    );
    writeFileSync(file, crossLayerPlan);
    assertPassed(invoke(directory, [], { TASK_PLAN_FILE: file }));
  });
});

test("enforces Regression Guard section ordering", () => {
  withTempDir((directory) => {
    const file = path.join(directory, "plan.md");
    const contents = plan(validTemplate);
    const guardStart = contents.indexOf("## Regression Guard");
    const relevantStart = contents.indexOf("## Relevant files");
    writeFileSync(
      file,
      `${contents.slice(0, guardStart)}${contents.slice(relevantStart)}\n${contents.slice(
        guardStart,
        relevantStart,
      )}`,
    );
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: file }), /before ## Relevant files/);
  });
});

test("TASK_PLAN_FILE rejects empty, non-Markdown, missing, and directory paths", () => {
  withTempDir((directory) => {
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: "" }), /set but empty/);
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: "plan.txt" }), /must end in \.md/);
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: "missing.md" }), /does not exist/);
    mkdirSync(path.join(directory, "folder"));
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: "folder.md" }), /does not exist/);
    assertFailed(invoke(directory, [], { TASK_PLAN_FILE: "folder" }), /must end in \.md/);
  });
});

test("scoped fix-stub reads and edits only TASK_PLAN_FILE", () => {
  withTempDir((directory) => {
    const active = path.join(directory, "active.md");
    const unrelated = path.join(directory, "unrelated.md");
    writeFileSync(active, withoutGuard(plan("", "<!-- regression-guard: required -->")));
    writeFileSync(unrelated, withoutGuard(plan("", "<!-- regression-guard: required -->")));
    const unrelatedBefore = readFileSync(unrelated, "utf8");

    assertPassed(invoke(directory, ["--fix-stub"], { TASK_PLAN_FILE: "active.md" }));
    assert.match(readFileSync(active, "utf8"), /## Regression Guard/);
    assert.equal(readFileSync(unrelated, "utf8"), unrelatedBefore);
  });
});

test("default mode scans tracked task-shaped Markdown without title-based classification", () => {
  withTempDir((directory) => {
    execFileSync("git", ["init", "-q"], { cwd: directory });
    const file = path.join(directory, "docs", "plans", "fix-workflow.md");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(
      file,
      `<!-- regression-guard: required -->
# Cosmetic title with no signal words

## What & Why
This task changes an existing behavior.

## Done looks like
- It is guarded.
`,
    );
    execFileSync("git", ["add", "docs/plans/fix-workflow.md"], { cwd: directory });
    assertFailed(invoke(directory), /missing ## Regression Guard section/);
  });
});

test("root validation commands run the fix-stub pass before strict checking", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  assert.match(packageJson.scripts["regression-guard"], /--fix-stub.*&&.*check-regression-guard\.mjs/);
  for (const command of ["test", "typecheck"]) {
    assert.match(packageJson.scripts[command], /pnpm run regression-guard/);
  }
  assert.match(packageJson.scripts.build, /pnpm run typecheck/);
  assert.match(packageJson.scripts.test, /@workspace\/scripts run test/);
});

test("workspace plan writes use the Failure Gate writer and standalone temp plans still work", () => {
  const guardSource = readFileSync(
    path.join(repoRoot, "scripts", "check-regression-guard.mjs"),
    "utf8",
  );
  const writerSource = readFileSync(
    path.join(repoRoot, "scripts", "failure_gate", "run_writer.py"),
    "utf8",
  );
  assert.match(guardSource, /--write-stdin/);
  assert.match(guardSource, /writeFileSync\(file, updatedContents\)/);
  assert.match(writerSource, /writer_lock\(root \/ "\.failure-gate", timeout\)/);
  assert.match(writerSource, /stale writer input/);
});

test("generated and build-output package writers share the Failure Gate lock", () => {
  const packageScripts = [
    ["package.json", ["typecheck:libs"]],
    ["lib/api-spec/package.json", ["codegen"]],
    ["lib/api-zod/package.json", ["build"]],
    ["scripts/package.json", ["typecheck"]],
    ["artifacts/api-server/package.json", ["build", "test", "typecheck"]],
    ["artifacts/skills-workbench/package.json", ["build", "typecheck"]],
    ["artifacts/mockup-sandbox/package.json", ["build", "typecheck"]],
  ];
  for (const [packagePath, scriptNames] of packageScripts) {
    const scripts = JSON.parse(
      readFileSync(path.join(repoRoot, packagePath), "utf8"),
    ).scripts;
    for (const scriptName of scriptNames) {
      assert.match(
        scripts[scriptName],
        /run_writer\.py|run_codegen\.py/,
        `${packagePath} ${scriptName} must use the shared writer lock`,
      );
    }
  }

  const pluginSource = readFileSync(
    path.join(repoRoot, "artifacts", "mockup-sandbox", "mockupPreviewPlugin.ts"),
    "utf8",
  );
  assert.match(pluginSource, /generateMockupComponents\.mjs/);
  assert.match(pluginSource, /run_writer\.py/);
  assert.match(pluginSource, /--mkdir/);
});

test("direct Orval and Canvas generation cannot write accepted output outside the lock", () => {
  const orvalSource = readFileSync(
    path.join(repoRoot, "lib", "api-spec", "orval.config.ts"),
    "utf8",
  );
  const codegenSource = readFileSync(
    path.join(repoRoot, "scripts", "failure_gate", "run_codegen.py"),
    "utf8",
  );
  const generatorSource = readFileSync(
    path.join(repoRoot, "artifacts", "mockup-sandbox", "generateMockupComponents.mjs"),
    "utf8",
  );
  const pluginSource = readFileSync(
    path.join(repoRoot, "artifacts", "mockup-sandbox", "mockupPreviewPlugin.ts"),
    "utf8",
  );
  const gitignore = readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
  const writerSource = readFileSync(
    path.join(repoRoot, "scripts", "failure_gate", "run_writer.py"),
    "utf8",
  );

  assert.match(orvalSource, /WORKSPACE_ORVAL_STAGE_ID/);
  assert.match(orvalSource, /workspace: apiClientStage/);
  assert.match(orvalSource, /workspace: apiZodStage/);
  assert.match(orvalSource, /copyFileSync\(path\.join\(source, "index\.ts"\)/);
  assert.match(orvalSource, /target: "generated"/);
  assert.match(orvalSource, /"api-client-react",\s+"dist"/);
  assert.match(orvalSource, /"api-zod",\s+"dist"/);
  assert.match(codegenSource, /promote_staged_outputs\(ROOT, stage_id\)/);
  assert.match(codegenSource, /with writer_lock\(ROOT \/ "\.failure-gate"\)/);
  assert.match(gitignore, /^\s*dist\s*$/m);

  assert.match(generatorSource, /run_writer\.py/);
  assert.match(generatorSource, /--failure-gate-writer-worker/);
  assert.match(generatorSource, /--verify-lock-fd/);
  assert.match(generatorSource, /writeFileSync\(outputPath, source\)/);
  assert.match(pluginSource, /FAILURE_GATE_WRITER_FD/);
  assert.match(pluginSource, /writerStdio\(fd\)/);
  assert.match(writerSource, /inherited_writer_lock/);
  assert.match(writerSource, /pass_fds=\(fd,\)/);
});
