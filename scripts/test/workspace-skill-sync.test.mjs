import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  checkWorkspaceSkillStatus,
  loadWorkspaceSkill,
  METADATA_FORMAT,
  refreshWorkspaceSkillProjection,
  validateWorkspaceSkillProjection,
} from "../src/workspace-skill-sync.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, "../..");
const cliPath = path.join(repoRoot, "scripts", "workspace-skill-status.mjs");

function withFixture(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), "workspace-skill-sync-"));
  const source = path.join(root, "source");
  const project = path.join(root, "project");
  mkdirSync(source);
  mkdirSync(project);
  try {
    run({ root, source, project });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeSource(source, { revision = "revision-one\n", body = "source body\n" } = {}) {
  mkdirSync(path.join(source, "demo", "references"), { recursive: true });
  writeFileSync(path.join(source, ".workspace-revision"), revision);
  writeFileSync(path.join(source, "demo", "SKILL.md"), body);
  writeFileSync(
    path.join(source, "demo", "references", "guide.md"),
    "supporting content\n",
  );
}

function projectionPath(project) {
  return path.join(project, ".agents", "skills", ".workspace-projections");
}

function projectionManifest(project) {
  return JSON.parse(
    readFileSync(path.join(projectionPath(project), "manifest.json"), "utf8"),
  );
}

function refresh(source, project, extra = {}) {
  return refreshWorkspaceSkillProjection({
    projectRoot: project,
    env: { WORKSPACE_SKILLS_SOURCE: source },
    ...extra,
  });
}

function sourceEnv(source) {
  return { WORKSPACE_SKILLS_SOURCE: source };
}

function invokeStatus(project, source, skillId = "demo", envOverrides = {}) {
  return spawnSync(process.execPath, [cliPath, "--", "--skill", skillId], {
    cwd: project,
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides,
      ...(source ? { WORKSPACE_SKILLS_SOURCE: source } : {}),
    },
  });
}

function installSidecar(project, skillId, metadata) {
  const mirrorDirectory = path.join(
    project,
    ".local",
    "custom_skills",
    skillId,
  );
  mkdirSync(mirrorDirectory, { recursive: true });
  const sidecarPath = path.join(
    mirrorDirectory,
    ".workspace-skill-metadata.json",
  );
  writeFileSync(sidecarPath, `${JSON.stringify(metadata)}\n`);
  return sidecarPath;
}

function expectedFingerprint(files) {
  const hash = createHash("sha256");
  for (const [relative, contents] of files) {
    const bytes = Buffer.from(contents);
    hash.update(Buffer.from(relative, "utf8"));
    hash.update("\0");
    hash.update(Buffer.from(String(bytes.length), "ascii"));
    hash.update("\0");
    hash.update(bytes);
    hash.update("\0");
  }
  return hash.digest("hex");
}

test("source resolution fails closed and never loads a previous projection", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    refresh(source, project);
    assert.equal(
      loadWorkspaceSkill("demo", { projectRoot: project, env: sourceEnv(source) }),
      "source body\n",
    );

    assert.throws(
      () => loadWorkspaceSkill("demo", { projectRoot: project, env: {} }),
      { code: "unavailable-source" },
    );
    assert.throws(
      () =>
        refreshWorkspaceSkillProjection({
          projectRoot: project,
          env: { WORKSPACE_SKILLS_SOURCE: path.join(source, "missing") },
        }),
      { code: "unavailable-source" },
    );

    writeFileSync(path.join(source, ".workspace-revision"), " \n");
    assert.throws(
      () => loadWorkspaceSkill("demo", { projectRoot: project, env: sourceEnv(source) }),
      { code: "unavailable-source" },
    );
    assert.equal(
      readFileSync(
        path.join(projectionPath(project), "demo", "SKILL.md"),
        "utf8",
      ),
      "source body\n",
    );
  });
});

test("recursive discovery produces sorted manifest files and stable SHA-256 fingerprints", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    const authoredSkill = path.join(
      project,
      ".agents",
      "skills",
      "project-authored-skill",
      "SKILL.md",
    );
    mkdirSync(path.dirname(authoredSkill), { recursive: true });
    writeFileSync(authoredSkill, "authored project content\n");
    const authoredBefore = readFileSync(authoredSkill, "utf8");
    writeFileSync(path.join(source, "demo", "z-last.txt"), "last\n");
    writeFileSync(path.join(source, "demo", "a-first.txt"), "first\n");
    const result = refresh(source, project);
    const manifest = projectionManifest(project);
    const skill = manifest.skills[0];
    assert.equal(manifest.format, "workspace-skill-projection/v1");
    assert.equal(manifest.sourceRevision, "revision-one\n");
    assert.deepEqual(skill.files, [
      "SKILL.md",
      "a-first.txt",
      "references/guide.md",
      "z-last.txt",
    ]);
    assert.equal(
      skill.fingerprint,
      expectedFingerprint([
        ["SKILL.md", "source body\n"],
        ["a-first.txt", "first\n"],
        ["references/guide.md", "supporting content\n"],
        ["z-last.txt", "last\n"],
      ]),
    );
    assert.deepEqual(result.manifest, manifest);
    assert.equal(readFileSync(authoredSkill, "utf8"), authoredBefore);
  });
});

test("source discovery rejects symlinks, unexpected entries, and normalized collisions", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    writeFileSync(path.join(source, "unexpected.txt"), "not a skill directory");
    assert.throws(() => refresh(source, project), { code: "invalid-source" });
  });

  withFixture(({ source, project }) => {
    writeSource(source);
    symlinkSync(
      path.join(source, "demo", "SKILL.md"),
      path.join(source, "demo", "linked.md"),
    );
    assert.throws(() => refresh(source, project), { code: "invalid-source" });
  });

  withFixture(({ source, project }) => {
    writeSource(source);
    writeFileSync(path.join(source, "demo", "Guide.md"), "uppercase path\n");
    writeFileSync(path.join(source, "demo", "guide.md"), "lowercase path\n");
    assert.throws(() => refresh(source, project), { code: "invalid-source" });
  });

  withFixture(({ source, project }) => {
    writeSource(source);
    writeFileSync(path.join(source, "demo", "é.md"), "composed\n");
    writeFileSync(path.join(source, "demo", "e\u0301.md"), "decomposed\n");
    assert.throws(() => refresh(source, project), { code: "invalid-source" });
  });

  withFixture(({ source, project }) => {
    writeSource(source);
    writeFileSync(path.join(source, "demo", "bad:name.md"), "unsafe\n");
    assert.throws(() => refresh(source, project), { code: "invalid-source" });
  });

  if (process.platform !== "win32") {
    withFixture(({ source, project }) => {
      writeSource(source);
      execFileSync("mkfifo", [path.join(source, "demo", "pipe")]);
      assert.throws(() => refresh(source, project), { code: "invalid-source" });
    });
  }
});

test("validation rejects stale, malformed, incomplete, extra, and changed projections", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    refresh(source, project);
    const projection = projectionPath(project);

    writeFileSync(path.join(projection, "unexpected.txt"), "extra\n");
    assert.throws(
      () =>
        validateWorkspaceSkillProjection({
          projectRoot: project,
          env: sourceEnv(source),
        }),
      { code: "invalid-projection" },
    );
    rmSync(path.join(projection, "unexpected.txt"));

    rmSync(path.join(projection, "demo", "references", "guide.md"));
    assert.throws(
      () =>
        validateWorkspaceSkillProjection({
          projectRoot: project,
          env: sourceEnv(source),
        }),
      { code: "invalid-projection" },
    );
    refresh(source, project);

    writeFileSync(path.join(projection, "manifest.json"), "{");
    assert.throws(
      () =>
        validateWorkspaceSkillProjection({
          projectRoot: project,
          env: sourceEnv(source),
        }),
      { code: "invalid-projection" },
    );
    refresh(source, project);

    writeFileSync(path.join(projection, "demo", "SKILL.md"), "tampered\n");
    assert.throws(
      () =>
        validateWorkspaceSkillProjection({
          projectRoot: project,
          env: sourceEnv(source),
        }),
      { code: "invalid-projection" },
    );
    refresh(source, project);

    writeFileSync(path.join(source, ".workspace-revision"), "revision-two\n");
    assert.throws(
      () =>
        validateWorkspaceSkillProjection({
          projectRoot: project,
          env: sourceEnv(source),
        }),
      { code: "invalid-projection" },
    );
    assert.equal(
      loadWorkspaceSkill("demo", { projectRoot: project, env: sourceEnv(source) }),
      "source body\n",
    );
    assert.equal(projectionManifest(project).sourceRevision, "revision-two\n");
  });
});

test("live locks are preserved and dead-owner or stale unstructured locks recover", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    const skillsRoot = path.join(project, ".agents", "skills");
    mkdirSync(skillsRoot, { recursive: true });
    const lockPath = path.join(skillsRoot, ".workspace-projections.lock");
    const liveOwner = {
      format: "workspace-skill-projection-lock/v1",
      pid: process.pid,
      host: os.hostname(),
      processStart: null,
      token: "11111111-1111-4111-8111-111111111111",
      createdAt: Date.now(),
    };
    writeFileSync(lockPath, JSON.stringify(liveOwner));
    const originalLock = readFileSync(lockPath, "utf8");
    assert.throws(() => refresh(source, project), { code: "busy" });
    assert.equal(readFileSync(lockPath, "utf8"), originalLock);
    rmSync(lockPath);

    const deadOwner = {
      ...liveOwner,
      pid: 2_147_483_647,
      token: "22222222-2222-4222-8222-222222222222",
    };
    writeFileSync(lockPath, JSON.stringify(deadOwner));
    refresh(source, project);
    assert.equal(existsSync(lockPath), false);

    writeFileSync(lockPath, "partial owner");
    const old = new Date(Date.now() - 180_000);
    utimesSync(lockPath, old, old);
    refresh(source, project);
    assert.equal(existsSync(lockPath), false);
  });
});

test("refresh removes only marked helper-owned abandoned staging directories", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    const skillsRoot = path.join(project, ".agents", "skills");
    mkdirSync(skillsRoot, { recursive: true });
    const operationId = "33333333-3333-4333-8333-333333333333";
    const ownedStage = path.join(
      skillsRoot,
      `.workspace-projections.stage.${operationId}`,
    );
    mkdirSync(ownedStage);
    writeFileSync(
      path.join(ownedStage, ".workspace-skill-owner.json"),
      JSON.stringify({
        format: "workspace-skill-projection-owner/v1",
        id: operationId,
        kind: "stage",
      }),
    );

    const unrelatedStage = path.join(
      skillsRoot,
      ".workspace-projections.stage.not-owned",
    );
    mkdirSync(unrelatedStage);
    refresh(source, project);
    assert.equal(existsSync(ownedStage), false);
    assert.equal(existsSync(unrelatedStage), true);
  });
});

test("the next refresh recovers an interrupted backup-and-stage transaction", () => {
  withFixture(({ root, source, project }) => {
    writeSource(source, { revision: "revision-one\n", body: "prior projection\n" });
    refresh(source, project);
    writeSource(source, { revision: "revision-two\n", body: "current source\n" });

    const stageSource = path.join(root, "stage-source");
    const stageProject = path.join(root, "stage-project");
    mkdirSync(stageSource);
    mkdirSync(stageProject);
    writeSource(stageSource, { revision: "revision-two\n", body: "current source\n" });
    refresh(stageSource, stageProject);

    const skillsRoot = path.join(project, ".agents", "skills");
    const projection = projectionPath(project);
    const operationId = "44444444-4444-4444-8444-444444444444";
    const stageName = `.workspace-projections.stage.${operationId}`;
    const backupName = `.workspace-projections.backup.${operationId}`;
    const stagePath = path.join(skillsRoot, stageName);
    const backupPath = path.join(skillsRoot, backupName);
    const previous = readFileSync(path.join(projection, "demo", "SKILL.md"), "utf8");
    assert.equal(previous, "prior projection\n");
    const backupIdentity = statIdentity(projection);
    renameSync(projection, backupPath);
    cpSync(projectionPath(stageProject), stagePath, { recursive: true });
    writeFileSync(
      path.join(stagePath, ".workspace-skill-owner.json"),
      JSON.stringify({
        format: "workspace-skill-projection-owner/v1",
        id: operationId,
        kind: "stage",
      }),
    );
    const stageIdentity = statIdentity(stagePath);
    writeFileSync(
      path.join(skillsRoot, ".workspace-projections.transaction.json"),
      `${JSON.stringify({
        format: "workspace-skill-transaction/v1",
        operationId,
        stageName,
        backupName,
        stageIdentity,
        hadExisting: true,
        backupIdentity,
        phase: "backed-up",
      })}\n`,
    );

    refresh(source, project);
    assert.equal(
      readFileSync(path.join(projection, "demo", "SKILL.md"), "utf8"),
      "current source\n",
    );
    assert.equal(existsSync(stagePath), false);
    assert.equal(existsSync(backupPath), false);
    assert.equal(
      existsSync(
        path.join(skillsRoot, ".workspace-projections.transaction.json"),
      ),
      false,
    );
  });
});

function statIdentity(target) {
  const info = statSync(target);
  return { dev: info.dev, ino: info.ino };
}

test("source changes during a refresh discard staging and preserve the installed projection", () => {
  withFixture(({ source, project }) => {
    writeSource(source, { revision: "revision-one\n", body: "old\n" });
    refresh(source, project);
    writeSource(source, { revision: "revision-two\n", body: "staged\n" });

    assert.throws(
      () =>
        refresh(source, project, {
          beforeSourceRecheck() {
            writeSource(source, {
              revision: "revision-two\n",
              body: "changed during staging\n",
            });
          },
        }),
      { code: "source-changed" },
    );
    assert.equal(
      readFileSync(
        path.join(projectionPath(project), "demo", "SKILL.md"),
        "utf8",
      ),
      "old\n",
    );
    assert.equal(
      existsSync(
        path.join(project, ".agents", "skills", ".workspace-projections.lock"),
      ),
      false,
    );
  });
});

test("atomic installation rolls back to the prior projection when the install rename fails", () => {
  withFixture(({ source, project }) => {
    writeSource(source, { revision: "revision-one\n", body: "old projection\n" });
    refresh(source, project);
    writeSource(source, { revision: "revision-two\n", body: "new projection\n" });
    let failedInstall = false;
    assert.throws(
      () =>
        refresh(source, project, {
          rename(from, to) {
            if (
              !failedInstall &&
              from.includes(".workspace-projections.stage.") &&
              to === projectionPath(project)
            ) {
              failedInstall = true;
              const error = new Error("synthetic rename failure");
              error.code = "EIO";
              throw error;
            }
            return renameSyncForTest(from, to);
          },
        }),
      { code: "EIO" },
    );
    assert.equal(failedInstall, true);
    assert.equal(
      readFileSync(
        path.join(projectionPath(project), "demo", "SKILL.md"),
        "utf8",
      ),
      "old projection\n",
    );
    assert.equal(
      existsSync(
        path.join(
          project,
          ".agents",
          "skills",
          ".workspace-projections.transaction.json",
        ),
      ),
      false,
    );
    assert.equal(
      loadWorkspaceSkill("demo", { projectRoot: project, env: sourceEnv(source) }),
      "new projection\n",
    );
  });
});

function renameSyncForTest(from, to) {
  return renameSync(from, to);
}

test("loader rejects a projection changed after refresh instead of returning its contents", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    assert.throws(
      () =>
        loadWorkspaceSkill("demo", {
          projectRoot: project,
          env: sourceEnv(source),
          afterRefresh() {
            writeFileSync(
              path.join(projectionPath(project), "demo", "SKILL.md"),
              "tampered after refresh\n",
            );
          },
        }),
      { code: "invalid-projection" },
    );
  });
});

test("status returns exact codes and bounded output without changing mirror metadata", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    const refreshed = refresh(source, project);
    const fingerprint = refreshed.manifest.skills[0].fingerprint;
    const metadata = {
      format: METADATA_FORMAT,
      skillId: "demo",
      sourceRevision: "revision-one\n",
      fingerprint,
    };
    const sidecarPath = installSidecar(project, "demo", metadata);
    const before = readFileSync(sidecarPath, "utf8");

    const pass = invokeStatus(project, source);
    assert.equal(pass.status, 0, `${pass.stdout}\n${pass.stderr}`);
    assert.equal(pass.stdout.trim(), "workspace-skill status: pass (demo)");
    assert.doesNotMatch(pass.stdout + pass.stderr, /source body|revision-one/);
    assert.doesNotMatch(pass.stdout + pass.stderr, new RegExp(fingerprint));
    assert.equal(readFileSync(sidecarPath, "utf8"), before);

    const directPass = checkWorkspaceSkillStatus("demo", {
      projectRoot: project,
      env: sourceEnv(source),
    });
    assert.deepEqual(directPass, { outcome: "pass", exitCode: 0 });

    writeFileSync(sidecarPath, JSON.stringify({ ...metadata, fingerprint: "f".repeat(64) }));
    const mismatch = invokeStatus(project, source);
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stdout, /mismatch/);
    assert.doesNotMatch(mismatch.stdout + mismatch.stderr, /f{64}/);

    rmSync(sidecarPath);
    const missing = invokeStatus(project, source);
    assert.equal(missing.status, 3);
    assert.match(missing.stdout, /missing-mirror/);

    const unavailable = invokeStatus(project, null, "demo", {
      WORKSPACE_SKILLS_SOURCE: "",
    });
    assert.equal(unavailable.status, 2);
    assert.match(unavailable.stdout, /unavailable-source/);

    const invalidId = invokeStatus(project, source, "../private/source");
    assert.equal(invalidId.status, 1);
    assert.equal(invalidId.stdout.trim(), "workspace-skill status: mismatch");
    assert.doesNotMatch(invalidId.stdout + invalidId.stderr, /private|source/);

    const longId = invokeStatus(project, source, "a".repeat(2_000));
    assert.equal(longId.status, 1);
    assert.ok((longId.stdout + longId.stderr).length < 128);

    const malformedStatus = checkWorkspaceSkillStatus("demo", {
      projectRoot: project,
      env: sourceEnv(source),
    });
    assert.deepEqual(malformedStatus, { outcome: "missing-mirror", exitCode: 3 });
    assert.equal(
      existsSync(projectionPath(project)),
      true,
      "status must not remove or refresh an existing project projection",
    );
  });
});

test("status reports invalid sidecars and does not create runtime mirror files", () => {
  withFixture(({ source, project }) => {
    writeSource(source);
    const malformed = installSidecar(project, "demo", "not metadata");
    const before = readFileSync(malformed, "utf8");
    const result = invokeStatus(project, source);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /mismatch/);
    assert.equal(readFileSync(malformed, "utf8"), before);
    assert.equal(
      existsSync(path.join(project, ".agents", "skills", ".workspace-projections")),
      false,
    );
  });
});

test("root package exposes the documented read-only status command", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  assert.equal(
    packageJson.scripts["workspace-skill:status"],
    "node scripts/workspace-skill-status.mjs",
  );
});
