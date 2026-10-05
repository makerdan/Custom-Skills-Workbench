import {
  constants,
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  readSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export const MANIFEST_FORMAT = "workspace-skill-projection/v1";
export const METADATA_FORMAT = "workspace-skill-metadata/v1";
export const PROJECTION_DIRECTORY = ".workspace-projections";

const MANIFEST_FILE = "manifest.json";
const REVISION_FILE = ".workspace-revision";
const OWNER_FILE = ".workspace-skill-owner.json";
const TRANSACTION_FILE = ".workspace-projections.transaction.json";
const LOCK_FILE = ".workspace-projections.lock";
const STALE_UNSTRUCTURED_LOCK_MS = 120_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;
const RESERVED_WINDOWS_NAME =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isSkillId(value) {
  return (
    typeof value === "string" &&
    value.length <= 128 &&
    SLUG_PATTERN.test(value)
  );
}

function validateSegment(segment, errorCode = "invalid-source") {
  if (
    !segment ||
    Buffer.byteLength(segment, "utf8") > 255 ||
    segment === "." ||
    segment === ".." ||
    segment.includes("/") ||
    segment.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(segment) ||
    /[<>:"|?*]/u.test(segment) ||
    /[. ]$/u.test(segment) ||
    RESERVED_WINDOWS_NAME.test(segment)
  ) {
    throw fail(errorCode, "unsafe path entry");
  }
}

function normalizedCollisionKey(name) {
  return name.normalize("NFC").toLowerCase();
}

function assertNoNameCollisions(names, errorCode = "invalid-source") {
  const seen = new Set();
  for (const name of names) {
    const key = normalizedCollisionKey(name);
    if (seen.has(key)) throw fail(errorCode, "ambiguous path entries");
    seen.add(key);
  }
}

function regularFileBytes(filePath, errorCode = "invalid-source") {
  let before;
  let descriptor;
  try {
    before = lstatSync(filePath);
    if (!before.isFile() || before.isSymbolicLink()) {
      throw fail(errorCode, "expected a regular file");
    }
    descriptor = openSync(
      filePath,
      process.platform === "win32"
        ? "r"
        : constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    const opened = fstatSync(descriptor);
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino
    ) {
      throw fail(errorCode, "file changed while being opened");
    }
    const chunks = [];
    const buffer = Buffer.alloc(64 * 1024);
    let count;
    while ((count = readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
      chunks.push(Buffer.from(buffer.subarray(0, count)));
    }
    const after = fstatSync(descriptor);
    if (after.dev !== opened.dev || after.ino !== opened.ino) {
      throw fail(errorCode, "file changed while being read");
    }
    return Buffer.concat(chunks);
  } catch (error) {
    if (error?.code === errorCode) throw error;
    throw fail(errorCode, "file could not be read safely");
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

function parseJsonBytes(bytes, errorCode, message) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw fail(errorCode, message);
  }
}

function exactKeys(value, expected) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }
  const actual = Object.keys(value).sort(compareStrings);
  const wanted = [...expected].sort(compareStrings);
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
}

function fingerprintFiles(files) {
  const hash = createHash("sha256");
  for (const file of files) {
    const relativeBytes = Buffer.from(file.relative, "utf8");
    hash.update(relativeBytes);
    hash.update("\0");
    hash.update(Buffer.from(String(file.bytes.length), "ascii"));
    hash.update("\0");
    hash.update(file.bytes);
    hash.update("\0");
  }
  return hash.digest("hex");
}

function readDirectoryEntries(directory, errorCode = "invalid-source") {
  let names;
  try {
    names = readdirSync(directory).sort(compareStrings);
  } catch {
    throw fail(errorCode, "directory could not be read");
  }
  assertNoNameCollisions(names, errorCode);
  return names;
}

function collectSkillFiles(skillRoot, errorCode = "invalid-source") {
  const files = [];

  function walk(currentDirectory, relativeDirectory) {
    const names = readDirectoryEntries(currentDirectory, errorCode);
    if (names.length === 0 && relativeDirectory) {
      throw fail(errorCode, "empty directories are not supported");
    }
    for (const name of names) {
      validateSegment(name, errorCode);
      const absolutePath = path.join(currentDirectory, name);
      const relative = relativeDirectory
        ? `${relativeDirectory}/${name}`
        : name;
      let info;
      try {
        info = lstatSync(absolutePath);
      } catch {
        throw fail(errorCode, "source entry changed during discovery");
      }
      if (info.isSymbolicLink()) {
        throw fail(errorCode, "symbolic links are not supported");
      }
      if (info.isDirectory()) {
        const before = { dev: info.dev, ino: info.ino };
        walk(absolutePath, relative);
        const after = lstatSync(absolutePath);
        if (
          !after.isDirectory() ||
          after.isSymbolicLink() ||
          after.dev !== before.dev ||
          after.ino !== before.ino
        ) {
          throw fail(errorCode, "directory changed during discovery");
        }
        continue;
      }
      if (!info.isFile()) {
        throw fail(errorCode, "special files are not supported");
      }
      files.push({
        relative,
        bytes: regularFileBytes(absolutePath, errorCode),
      });
    }
  }

  walk(skillRoot, "");
  files.sort((left, right) => compareStrings(left.relative, right.relative));
  if (files.length === 0 || !files.some((file) => file.relative === "SKILL.md")) {
    throw fail(errorCode, "skill is missing SKILL.md or regular supporting files");
  }
  return files;
}

function readRevision(sourceRoot) {
  const revisionPath = path.join(sourceRoot, REVISION_FILE);
  const bytes = regularFileBytes(revisionPath);
  const revision = bytes.toString("utf8");
  if (!revision.trim()) {
    throw fail("unavailable-source", "workspace revision is empty");
  }
  return revision;
}

function discoverSource(sourceValue) {
  if (typeof sourceValue !== "string" || sourceValue.length === 0) {
    throw fail("unavailable-source", "workspace source is unavailable");
  }
  const sourceRoot = path.resolve(sourceValue);
  let rootInfo;
  try {
    rootInfo = lstatSync(sourceRoot);
  } catch {
    throw fail("unavailable-source", "workspace source is unavailable");
  }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw fail("unavailable-source", "workspace source is not a directory");
  }

  let revision;
  try {
    revision = readRevision(sourceRoot);
  } catch {
    throw fail("unavailable-source", "workspace revision is unavailable");
  }

  let names;
  try {
    names = readDirectoryEntries(sourceRoot);
  } catch {
    throw fail("invalid-source", "workspace source entries are invalid");
  }
  const skillNames = [];
  for (const name of names) {
    if (name === REVISION_FILE) continue;
    validateSegment(name);
    const entryPath = path.join(sourceRoot, name);
    let info;
    try {
      info = lstatSync(entryPath);
    } catch {
      throw fail("invalid-source", "workspace source changed during discovery");
    }
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw fail("invalid-source", "unexpected workspace source entry");
    }
    if (!isSkillId(name)) {
      throw fail("invalid-source", "skill directory name is invalid");
    }
    skillNames.push(name);
  }
  if (skillNames.length === 0) {
    throw fail("invalid-source", "workspace source has no skills");
  }
  assertNoNameCollisions(skillNames);

  const skills = [];
  const snapshots = new Map();
  for (const id of skillNames.sort(compareStrings)) {
    const files = collectSkillFiles(path.join(sourceRoot, id));
    const listedFiles = files.map((file) => file.relative);
    skills.push({
      id,
      files: listedFiles,
      fingerprint: fingerprintFiles(files),
    });
    snapshots.set(id, files);
  }

  return {
    sourceRoot,
    revision,
    manifest: {
      format: MANIFEST_FORMAT,
      sourceRevision: revision,
      skills,
    },
    snapshots,
  };
}

function assertManifestShape(manifest) {
  if (
    !exactKeys(manifest, ["format", "sourceRevision", "skills"]) ||
    manifest.format !== MANIFEST_FORMAT ||
    typeof manifest.sourceRevision !== "string" ||
    !manifest.sourceRevision.trim() ||
    !Array.isArray(manifest.skills)
  ) {
    throw fail("invalid-projection", "projection manifest is malformed");
  }

  let previousId = null;
  for (const skill of manifest.skills) {
    if (
      !exactKeys(skill, ["id", "files", "fingerprint"]) ||
      typeof skill.id !== "string" ||
      !isSkillId(skill.id) ||
      (previousId !== null && compareStrings(previousId, skill.id) >= 0) ||
      !Array.isArray(skill.files) ||
      skill.files.length === 0 ||
      typeof skill.fingerprint !== "string" ||
      !FINGERPRINT_PATTERN.test(skill.fingerprint)
    ) {
      throw fail("invalid-projection", "projection manifest is malformed");
    }
    previousId = skill.id;
    let previousFile = null;
    for (const file of skill.files) {
      if (
        typeof file !== "string" ||
        file.length === 0 ||
        (previousFile !== null && compareStrings(previousFile, file) >= 0)
      ) {
        throw fail("invalid-projection", "projection file list is malformed");
      }
      for (const segment of file.split("/")) {
        validateSegment(segment, "invalid-projection");
      }
      previousFile = file;
    }
    if (!skill.files.includes("SKILL.md")) {
      throw fail("invalid-projection", "projection file list is incomplete");
    }
  }
  if (manifest.skills.length === 0) {
    throw fail("invalid-projection", "projection manifest has no skills");
  }
}

function manifestForFiles(revision, skillFiles) {
  const skills = [...skillFiles.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([id, files]) => {
      const sortedFiles = [...files].sort((left, right) =>
        compareStrings(left.relative, right.relative),
      );
      return {
        id,
        files: sortedFiles.map((file) => file.relative),
        fingerprint: fingerprintFiles(sortedFiles),
      };
    });
  return {
    format: MANIFEST_FORMAT,
    sourceRevision: revision,
    skills,
  };
}

function ownerMarker(id, kind = "stage") {
  return {
    format: "workspace-skill-projection-owner/v1",
    id,
    kind,
  };
}

function readOwnerMarker(directory, expectedId, expectedKind = "stage") {
  try {
    const bytes = regularFileBytes(path.join(directory, OWNER_FILE), "invalid-owner");
    const value = JSON.parse(bytes.toString("utf8"));
    return (
      exactKeys(value, ["format", "id", "kind"]) &&
      value.format === "workspace-skill-projection-owner/v1" &&
      value.id === expectedId &&
      value.kind === expectedKind
    );
  } catch {
    return false;
  }
}

function assertDirectoryIdentity(target, identity) {
  let info;
  try {
    info = lstatSync(target);
  } catch {
    return false;
  }
  return (
    info.isDirectory() &&
    !info.isSymbolicLink() &&
    info.dev === identity.dev &&
    info.ino === identity.ino
  );
}

function identityOf(target) {
  const info = lstatSync(target);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw fail("invalid-projection", "projection destination is not a directory");
  }
  return { dev: info.dev, ino: info.ino };
}

function readProjection(projectionRoot, expectedManifest, allowOwner = false) {
  let rootInfo;
  try {
    rootInfo = lstatSync(projectionRoot);
  } catch {
    throw fail("invalid-projection", "projection is unavailable");
  }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw fail("invalid-projection", "projection is not a directory");
  }

  const topNames = readDirectoryEntries(projectionRoot, "invalid-projection");
  const manifestBytes = regularFileBytes(
    path.join(projectionRoot, MANIFEST_FILE),
    "invalid-projection",
  );
  const manifest = parseJsonBytes(
    manifestBytes,
    "invalid-projection",
    "projection manifest is malformed",
  );
  assertManifestShape(manifest);

  let ownerId = null;
  const names = topNames.filter((name) => name !== MANIFEST_FILE);
  if (allowOwner && names.includes(OWNER_FILE)) {
    const markerBytes = regularFileBytes(
      path.join(projectionRoot, OWNER_FILE),
      "invalid-projection",
    );
    const marker = parseJsonBytes(
      markerBytes,
      "invalid-projection",
      "projection owner marker is malformed",
    );
    if (
      !exactKeys(marker, ["format", "id", "kind"]) ||
      marker.format !== "workspace-skill-projection-owner/v1" ||
      marker.kind !== "stage" ||
      typeof marker.id !== "string" ||
      !UUID_PATTERN.test(marker.id)
    ) {
      throw fail("invalid-projection", "projection owner marker is malformed");
    }
    ownerId = marker.id;
    names.splice(names.indexOf(OWNER_FILE), 1);
  }

  const expectedIds = manifest.skills.map((skill) => skill.id);
  if (
    names.length !== expectedIds.length ||
    names.some((name, index) => name !== expectedIds[index])
  ) {
    throw fail("invalid-projection", "projection skill set does not match manifest");
  }

  const actualSkillFiles = new Map();
  for (const skill of manifest.skills) {
    const skillRoot = path.join(projectionRoot, skill.id);
    let info;
    try {
      info = lstatSync(skillRoot);
    } catch {
      throw fail("invalid-projection", "projection skill is missing");
    }
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw fail("invalid-projection", "projection skill path is unsafe");
    }

    const files = [];
    const seenDirectories = [];
    function walk(directory, relativeDirectory) {
      const children = readDirectoryEntries(directory, "invalid-projection");
      if (children.length === 0) {
        throw fail("invalid-projection", "projection contains an empty directory");
      }
      for (const name of children) {
        validateSegment(name, "invalid-projection");
        const absolute = path.join(directory, name);
        const relative = relativeDirectory
          ? `${relativeDirectory}/${name}`
          : name;
        let childInfo;
        try {
          childInfo = lstatSync(absolute);
        } catch {
          throw fail("invalid-projection", "projection changed during validation");
        }
        if (childInfo.isSymbolicLink()) {
          throw fail("invalid-projection", "projection contains a symbolic link");
        }
        if (childInfo.isDirectory()) {
          seenDirectories.push(relative);
          walk(absolute, relative);
        } else if (childInfo.isFile()) {
          files.push({
            relative,
            bytes: regularFileBytes(absolute, "invalid-projection"),
          });
        } else {
          throw fail("invalid-projection", "projection contains a special file");
        }
      }
    }
    walk(skillRoot, "");
    files.sort((left, right) => compareStrings(left.relative, right.relative));
    const actualPaths = files.map((file) => file.relative);
    if (
      actualPaths.length !== skill.files.length ||
      actualPaths.some((file, index) => file !== skill.files[index])
    ) {
      throw fail("invalid-projection", "projection file set does not match manifest");
    }
    if (fingerprintFiles(files) !== skill.fingerprint) {
      throw fail("invalid-projection", "projection fingerprint does not match manifest");
    }
    actualSkillFiles.set(skill.id, files);
  }

  const actualManifest = manifestForFiles(manifest.sourceRevision, actualSkillFiles);
  if (JSON.stringify(actualManifest) !== JSON.stringify(manifest)) {
    throw fail("invalid-projection", "projection manifest is inconsistent");
  }
  if (
    expectedManifest &&
    JSON.stringify(manifest) !== JSON.stringify(expectedManifest)
  ) {
    throw fail("invalid-projection", "projection is stale");
  }
  return { manifest, skillFiles: actualSkillFiles, ownerId };
}

function readProcStartIdentity(pid) {
  if (process.platform !== "linux") return null;
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
    const closeParen = stat.lastIndexOf(")");
    const fieldsAfterCommand = stat.slice(closeParen + 2).trim().split(/\s+/);
    return fieldsAfterCommand[19] ?? null;
  } catch {
    return null;
  }
}

function makeLockOwner(token) {
  return {
    format: "workspace-skill-projection-lock/v1",
    pid: process.pid,
    host: os.hostname(),
    processStart: readProcStartIdentity(process.pid),
    token,
    createdAt: Date.now(),
  };
}

function parseLockOwner(lockPath) {
  try {
    const bytes = regularFileBytes(lockPath, "invalid-lock");
    const owner = JSON.parse(bytes.toString("utf8"));
    if (
      !exactKeys(owner, [
        "format",
        "pid",
        "host",
        "processStart",
        "token",
        "createdAt",
      ]) ||
      owner.format !== "workspace-skill-projection-lock/v1" ||
      !Number.isInteger(owner.pid) ||
      owner.pid < 1 ||
      typeof owner.host !== "string" ||
      typeof owner.token !== "string" ||
      !UUID_PATTERN.test(owner.token) ||
      typeof owner.createdAt !== "number" ||
      !Number.isFinite(owner.createdAt) ||
      (owner.processStart !== null && typeof owner.processStart !== "string")
    ) {
      return null;
    }
    return owner;
  } catch {
    return null;
  }
}

function isProvablyDead(owner) {
  if (!owner || owner.host !== os.hostname()) return false;
  try {
    process.kill(owner.pid, 0);
    const currentStart = readProcStartIdentity(owner.pid);
    return Boolean(
      owner.processStart &&
        currentStart &&
        currentStart !== owner.processStart,
    );
  } catch (error) {
    return error?.code === "ESRCH";
  }
}

function isStaleUnstructuredLock(lockPath) {
  try {
    const info = lstatSync(lockPath);
    return (
      info.isFile() &&
      !info.isSymbolicLink() &&
      Date.now() - info.mtimeMs >= STALE_UNSTRUCTURED_LOCK_MS
    );
  } catch {
    return false;
  }
}

function createOwnedFile(filePath, contents) {
  let descriptor;
  try {
    descriptor = openSync(filePath, "wx", 0o600);
    writeFileSync(descriptor, contents);
    fsyncSync(descriptor);
    const opened = fstatSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    const current = lstatSync(filePath);
    if (
      !current.isFile() ||
      current.isSymbolicLink() ||
      current.dev !== opened.dev ||
      current.ino !== opened.ino
    ) {
      throw fail("busy", "lock ownership could not be verified");
    }
    return { dev: current.dev, ino: current.ino };
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    throw error;
  }
}

function recoverLock(lockPath) {
  const quarantinePath = `${lockPath}.stale.${randomUUID()}`;
  try {
    let info;
    try {
      info = lstatSync(lockPath);
    } catch {
      return true;
    }
    if (!info.isFile() || info.isSymbolicLink()) return false;

    const owner = parseLockOwner(lockPath);
    const canRemove = owner
      ? isProvablyDead(owner)
      : isStaleUnstructuredLock(lockPath);
    if (!canRemove) return false;

    const expectedIdentity = { dev: info.dev, ino: info.ino };
    renameSync(lockPath, quarantinePath);
    let movedInfo;
    try {
      movedInfo = lstatSync(quarantinePath);
    } catch {
      return false;
    }
    if (
      !movedInfo.isFile() ||
      movedInfo.isSymbolicLink() ||
      movedInfo.dev !== expectedIdentity.dev ||
      movedInfo.ino !== expectedIdentity.ino
    ) {
      if (!existsSync(lockPath)) renameSync(quarantinePath, lockPath);
      return false;
    }

    const movedOwner = parseLockOwner(quarantinePath);
    const stillRemovable = movedOwner
      ? isProvablyDead(movedOwner)
      : Date.now() - movedInfo.mtimeMs >= STALE_UNSTRUCTURED_LOCK_MS;
    if (!stillRemovable) {
      if (!existsSync(lockPath)) renameSync(quarantinePath, lockPath);
      return false;
    }
    unlinkSync(quarantinePath);
    return true;
  } catch {
    return false;
  }
}

function acquireProjectionLock(parent) {
  const lockPath = path.join(parent, LOCK_FILE);
  const token = randomUUID();
  const owner = makeLockOwner(token);
  try {
    const identity = createOwnedFile(lockPath, JSON.stringify(owner));
    return { lockPath, token, identity };
  } catch (error) {
    if (error?.code !== "EEXIST" && error?.code !== "busy") throw error;
  }

  let lockInfo;
  try {
    lockInfo = lstatSync(lockPath);
  } catch {
    throw fail("busy", "projection refresh is busy");
  }
  if (!lockInfo.isFile() || lockInfo.isSymbolicLink()) {
    throw fail("busy", "projection lock cannot be inspected safely");
  }
  const ownerNow = parseLockOwner(lockPath);
  if (ownerNow ? isProvablyDead(ownerNow) : isStaleUnstructuredLock(lockPath)) {
    if (recoverLock(lockPath)) {
      return acquireProjectionLock(parent);
    }
  }
  throw fail("busy", "projection refresh is busy");
}

function releaseProjectionLock(lock) {
  try {
    const info = lstatSync(lock.lockPath);
    const owner = parseLockOwner(lock.lockPath);
    if (
      info.isFile() &&
      info.dev === lock.identity.dev &&
      info.ino === lock.identity.ino &&
      owner?.token === lock.token
    ) {
      unlinkSync(lock.lockPath);
    }
  } catch {
    // A lock not still owned by this invocation must remain untouched.
  }
}

function projectionPaths(projectRoot) {
  const skillsRoot = path.join(projectRoot, ".agents", "skills");
  const projectionRoot = path.join(skillsRoot, PROJECTION_DIRECTORY);
  return { skillsRoot, projectionRoot };
}

function ensureSkillsRoot(projectRoot, skillsRoot) {
  const projectInfo = lstatSync(projectRoot);
  if (!projectInfo.isDirectory() || projectInfo.isSymbolicLink()) {
    throw fail("invalid-projection", "project root is unsafe");
  }
  const agentsRoot = path.join(projectRoot, ".agents");
  if (!existsSync(agentsRoot)) mkdirSync(agentsRoot);
  const agentsInfo = lstatSync(agentsRoot);
  if (!agentsInfo.isDirectory() || agentsInfo.isSymbolicLink()) {
    throw fail("invalid-projection", "project agent directory is unsafe");
  }
  if (!existsSync(skillsRoot)) mkdirSync(skillsRoot);
  const skillsInfo = lstatSync(skillsRoot);
  if (!skillsInfo.isDirectory() || skillsInfo.isSymbolicLink()) {
    throw fail("invalid-projection", "project skills directory is unsafe");
  }
}

function writeAtomicJson(target, value) {
  const temporary = `${target}.tmp.${randomUUID()}`;
  try {
    const descriptor = openSync(temporary, "wx", 0o600);
    try {
      writeFileSync(descriptor, `${JSON.stringify(value)}\n`);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    renameSync(temporary, target);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function transactionIsValid(transaction) {
  return (
    exactKeys(transaction, [
      "format",
      "operationId",
      "stageName",
      "backupName",
      "stageIdentity",
      "hadExisting",
      "backupIdentity",
      "phase",
    ]) &&
    transaction.format === "workspace-skill-transaction/v1" &&
    UUID_PATTERN.test(transaction.operationId) &&
    transaction.stageName ===
      `.workspace-projections.stage.${transaction.operationId}` &&
    transaction.backupName ===
      `.workspace-projections.backup.${transaction.operationId}` &&
    transactionIdentityValid(transaction.stageIdentity) &&
    typeof transaction.hadExisting === "boolean" &&
    (transaction.hadExisting
      ? transactionIdentityValid(transaction.backupIdentity)
      : transaction.backupIdentity === null) &&
    ["prepared", "backed-up", "installed"].includes(transaction.phase)
  );
}

function transactionIdentityValid(value) {
  return (
    exactKeys(value, ["dev", "ino"]) &&
    Number.isSafeInteger(value.dev) &&
    Number.isSafeInteger(value.ino)
  );
}

function unlinkJournalIfPresent(journalPath) {
  try {
    unlinkSync(journalPath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function recoverInterruptedTransaction(skillsRoot, projectionRoot) {
  const journalPath = path.join(skillsRoot, TRANSACTION_FILE);
  if (!existsSync(journalPath)) return;
  const transaction = parseJsonBytes(
    regularFileBytes(journalPath, "invalid-transaction"),
    "invalid-transaction",
    "projection transaction record is malformed",
  );
  if (!transactionIsValid(transaction)) {
    throw fail("invalid-transaction", "projection transaction record is malformed");
  }

  const stagePath = path.join(skillsRoot, transaction.stageName);
  const backupPath = path.join(skillsRoot, transaction.backupName);
  const stageExists = assertDirectoryIdentity(
    stagePath,
    transaction.stageIdentity,
  );
  const projectionIsStage = assertDirectoryIdentity(
    projectionRoot,
    transaction.stageIdentity,
  );
  const backupExists =
    transaction.hadExisting &&
    assertDirectoryIdentity(backupPath, transaction.backupIdentity);

  if (transaction.hadExisting) {
    if (backupExists) {
      if (projectionIsStage) rmSync(projectionRoot, { recursive: true });
      if (!existsSync(projectionRoot)) {
        renameSync(backupPath, projectionRoot);
      } else if (
        !assertDirectoryIdentity(projectionRoot, transaction.backupIdentity)
      ) {
        throw fail("invalid-transaction", "projection rollback is unsafe");
      }
    } else if (
      transaction.phase !== "installed" ||
      !projectionIsStage
    ) {
      // If the backup has disappeared before the committed phase, preserve
      // all remaining state rather than guessing whether a directory is owned.
      if (!assertDirectoryIdentity(projectionRoot, transaction.backupIdentity)) {
        throw fail("invalid-transaction", "projection backup is unavailable");
      }
    }
  } else {
    if (projectionIsStage) rmSync(projectionRoot, { recursive: true });
    else if (existsSync(projectionRoot)) {
      throw fail("invalid-transaction", "projection rollback is unsafe");
    }
  }

  if (stageExists && existsSync(stagePath)) {
    if (!readOwnerMarker(stagePath, transaction.operationId)) {
      throw fail("invalid-transaction", "staging ownership cannot be verified");
    }
    rmSync(stagePath, { recursive: true });
  }
  if (transaction.hadExisting && backupExists && existsSync(backupPath)) {
    if (!assertDirectoryIdentity(backupPath, transaction.backupIdentity)) {
      throw fail("invalid-transaction", "projection backup ownership changed");
    }
    rmSync(backupPath, { recursive: true });
  }
  unlinkJournalIfPresent(journalPath);
}

function cleanupAbandonedStages(skillsRoot) {
  const names = readDirectoryEntries(skillsRoot, "invalid-projection");
  for (const name of names) {
    const match = /^\.workspace-projections\.stage\.([0-9a-f-]+)$/i.exec(name);
    if (!match || !UUID_PATTERN.test(match[1])) continue;
    const stagePath = path.join(skillsRoot, name);
    let info;
    try {
      info = lstatSync(stagePath);
    } catch {
      continue;
    }
    if (
      info.isDirectory() &&
      !info.isSymbolicLink() &&
      readOwnerMarker(stagePath, match[1])
    ) {
      rmSync(stagePath, { recursive: true });
    }
  }
}

function writeStage(stagePath, operationId, source) {
  mkdirSync(stagePath);
  writeFileSync(
    path.join(stagePath, OWNER_FILE),
    `${JSON.stringify(ownerMarker(operationId))}\n`,
    { flag: "wx", mode: 0o600 },
  );
  for (const [id, files] of source.snapshots) {
    const skillRoot = path.join(stagePath, id);
    mkdirSync(skillRoot);
    for (const file of files) {
      const destination = path.join(skillRoot, ...file.relative.split("/"));
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, file.bytes, { flag: "wx" });
    }
  }
  writeFileSync(
    path.join(stagePath, MANIFEST_FILE),
    `${JSON.stringify(source.manifest, null, 2)}\n`,
    { flag: "wx" },
  );
}

function sameSourceSnapshot(before, after) {
  return (
    before.revision === after.revision &&
    JSON.stringify(before.manifest) === JSON.stringify(after.manifest)
  );
}

function assertSourceAvailable(env) {
  if (!env || typeof env.WORKSPACE_SKILLS_SOURCE !== "string") {
    throw fail("unavailable-source", "workspace source is unavailable");
  }
  return env.WORKSPACE_SKILLS_SOURCE;
}

function refreshProjection(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const env = options.env ?? process.env;
  const sourcePath = assertSourceAvailable(env);
  discoverSource(sourcePath);
  const { skillsRoot, projectionRoot } = projectionPaths(projectRoot);
  ensureSkillsRoot(projectRoot, skillsRoot);
  const lock = acquireProjectionLock(skillsRoot);
  const journalPath = path.join(skillsRoot, TRANSACTION_FILE);
  let operationId = null;
  let stagePath = null;
  let transactionWritten = false;
  let completed = false;

  try {
    recoverInterruptedTransaction(skillsRoot, projectionRoot);
    cleanupAbandonedStages(skillsRoot);

    // Re-read the authority after lock acquisition so work never copies the
    // snapshot observed before waiting behind another refresh.
    const source = discoverSource(sourcePath);
    operationId = randomUUID();
    stagePath = path.join(
      skillsRoot,
      `.workspace-projections.stage.${operationId}`,
    );
    const backupPath = path.join(
      skillsRoot,
      `.workspace-projections.backup.${operationId}`,
    );
    writeStage(stagePath, operationId, source);
    readProjection(stagePath, source.manifest, true);

    options.beforeSourceRecheck?.();
    const checkedSource = discoverSource(sourcePath);
    if (!sameSourceSnapshot(source, checkedSource)) {
      throw fail("source-changed", "workspace source changed during projection refresh");
    }

    const stageIdentity = identityOf(stagePath);
    let hadExisting = false;
    let backupIdentity = null;
    if (existsSync(projectionRoot)) {
      backupIdentity = identityOf(projectionRoot);
      hadExisting = true;
    }
    const transaction = {
      format: "workspace-skill-transaction/v1",
      operationId,
      stageName: path.basename(stagePath),
      backupName: path.basename(backupPath),
      stageIdentity,
      hadExisting,
      backupIdentity,
      phase: "prepared",
    };
    writeAtomicJson(journalPath, transaction);
    transactionWritten = true;

    const rename = options.rename ?? renameSync;
    if (hadExisting) {
      rename(projectionRoot, backupPath);
      transaction.phase = "backed-up";
      writeAtomicJson(journalPath, transaction);
    }
    rename(stagePath, projectionRoot);
    transaction.phase = "installed";
    writeAtomicJson(journalPath, transaction);

    unlinkSync(path.join(projectionRoot, OWNER_FILE));
    readProjection(projectionRoot, source.manifest);

    if (hadExisting && existsSync(backupPath)) {
      if (!assertDirectoryIdentity(backupPath, backupIdentity)) {
        throw fail("invalid-transaction", "projection backup ownership changed");
      }
      rmSync(backupPath, { recursive: true });
    }
    unlinkJournalIfPresent(journalPath);
    transactionWritten = false;
    completed = true;

    return {
      sourceRevision: source.revision,
      manifest: source.manifest,
    };
  } catch (error) {
    if (transactionWritten) {
      try {
        recoverInterruptedTransaction(skillsRoot, projectionRoot);
        transactionWritten = false;
      } catch {
        throw fail("rollback-failed", "projection refresh failed and rollback is incomplete");
      }
    } else if (stagePath && existsSync(stagePath) && operationId) {
      if (readOwnerMarker(stagePath, operationId)) {
        rmSync(stagePath, { recursive: true });
      }
    }
    throw error;
  } finally {
    if (!completed && stagePath && existsSync(stagePath) && operationId) {
      if (readOwnerMarker(stagePath, operationId)) {
        rmSync(stagePath, { recursive: true });
      }
    }
    releaseProjectionLock(lock);
  }
}

export function refreshWorkspaceSkillProjection(options = {}) {
  return refreshProjection(options);
}

export function validateWorkspaceSkillProjection(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const source = discoverSource(
    assertSourceAvailable(options.env ?? process.env),
  );
  const projectionRoot = projectionPaths(projectRoot).projectionRoot;
  return readProjection(projectionRoot, source.manifest).manifest;
}

export function loadWorkspaceSkill(skillId, options = {}) {
  if (!isSkillId(skillId)) {
    throw fail("invalid-skill", "requested skill ID is invalid");
  }
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  refreshProjection(options);
  options.afterRefresh?.();

  const source = discoverSource(assertSourceAvailable(options.env ?? process.env));
  const projectionRoot = projectionPaths(projectRoot).projectionRoot;
  const validated = readProjection(projectionRoot, source.manifest);
  const skill = validated.skillFiles.get(skillId);
  if (!skill) throw fail("missing-skill", "requested skill is not available");
  const instructions = skill.find((file) => file.relative === "SKILL.md");
  if (!instructions) throw fail("invalid-projection", "requested skill is incomplete");
  return instructions.bytes.toString("utf8");
}

function validMetadata(value) {
  return (
    exactKeys(value, ["format", "skillId", "sourceRevision", "fingerprint"]) &&
    value.format === METADATA_FORMAT &&
    isSkillId(value.skillId) &&
    typeof value.sourceRevision === "string" &&
    value.sourceRevision.trim().length > 0 &&
    typeof value.fingerprint === "string" &&
    FINGERPRINT_PATTERN.test(value.fingerprint)
  );
}

function metadataPathStatus(projectRoot, skillId) {
  const directory = path.join(
    projectRoot,
    ".local",
    "custom_skills",
    skillId,
  );
  const sidecar = path.join(directory, ".workspace-skill-metadata.json");
  for (const checked of [
    path.join(projectRoot, ".local"),
    path.join(projectRoot, ".local", "custom_skills"),
    directory,
  ]) {
    try {
      const info = lstatSync(checked);
      if (!info.isDirectory() || info.isSymbolicLink()) return "invalid";
    } catch (error) {
      if (error?.code === "ENOENT") return "missing";
      return "invalid";
    }
  }
  try {
    const info = lstatSync(sidecar);
    if (!info.isFile() || info.isSymbolicLink()) return "invalid";
    return regularFileBytes(sidecar, "invalid-metadata");
  } catch (error) {
    if (error?.code === "ENOENT") return "missing";
    return "invalid";
  }
}

export function checkWorkspaceSkillStatus(skillId, options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  if (!isSkillId(skillId)) {
    return { outcome: "mismatch", exitCode: 1 };
  }

  let source;
  try {
    source = discoverSource(assertSourceAvailable(options.env ?? process.env));
  } catch {
    return { outcome: "unavailable-source", exitCode: 2 };
  }
  const canonicalSkill = source.manifest.skills.find((skill) => skill.id === skillId);
  if (!canonicalSkill) return { outcome: "mismatch", exitCode: 1 };

  const mirror = metadataPathStatus(projectRoot, skillId);
  if (mirror === "missing") return { outcome: "missing-mirror", exitCode: 3 };
  if (mirror === "invalid") return { outcome: "mismatch", exitCode: 1 };
  let metadata;
  try {
    metadata = parseJsonBytes(mirror, "invalid-metadata", "invalid metadata");
  } catch {
    return { outcome: "mismatch", exitCode: 1 };
  }
  if (!validMetadata(metadata)) return { outcome: "mismatch", exitCode: 1 };

  const canonical = {
    format: METADATA_FORMAT,
    skillId,
    sourceRevision: source.revision,
    fingerprint: canonicalSkill.fingerprint,
  };
  const matches = Object.keys(canonical).every(
    (key) => metadata[key] === canonical[key],
  );
  return matches
    ? { outcome: "pass", exitCode: 0 }
    : { outcome: "mismatch", exitCode: 1 };
}
