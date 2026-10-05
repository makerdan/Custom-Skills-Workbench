import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import express from "express";
import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import {
  questionsTable,
  skillVersionsTable,
  skillsTable,
} from "@workspace/db";
import healthRouter from "../src/routes/health";
import { createQuestionsRouter } from "../src/routes/questions";
import { createSkillsRouter } from "../src/routes/skills";
import { createStorageRouter } from "../src/routes/storage";
import { createWorkbenchRouter } from "../src/routes/workbench";
import {
  ABANDONED_UPLOAD_RETENTION_MS,
  cleanupAbandonedSkillUploads,
} from "../src/lib/skillUploadCleanup";
import {
  ObjectOwnershipError,
  setObjectAclPolicy,
} from "../src/lib/objectAcl";
import { ObjectStorageService } from "../src/lib/objectStorage";

const ownerId = "owner-aaaaaaaa";
const otherOwnerId = "owner-bbbbbbbb";
const skillId = "10000000-0000-4000-8000-000000000001";
const otherSkillId = "20000000-0000-4000-8000-000000000002";
const firstVersionId = "30000000-0000-4000-8000-000000000003";
const secondVersionId = "40000000-0000-4000-8000-000000000004";
const savedQuestionId = "50000000-0000-4000-8000-000000000005";
const newlyCreatedVersionId = "80000000-0000-4000-8000-000000000008";
const testDate = new Date("2026-01-02T03:04:05.000Z");
const sharedValidationCases = JSON.parse(
  readFileSync(
    path.resolve(
      process.cwd(),
      "../../test-fixtures/skill-archive-validation.json",
    ),
    "utf8",
  ),
) as {
  supportedExtensions: string[];
  invalidArchives: Array<{
    name: string;
    files: SkillFileFixture[];
    serverErrorIncludes: string;
  }>;
};

type User = { id: string } | null;
type CapturedLogRecord = {
  level: "warn";
  fields: Record<string, unknown>;
  message: string;
};

function paramFor(
  sql: string,
  params: unknown[],
  table: string,
  column: string,
): unknown {
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedColumn = column.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = sql.match(
    new RegExp(`"${escapedTable}"\\."${escapedColumn}"\\s*=\\s*\\$(\\d+)`),
  );
  return match ? params[Number(match[1]) - 1] : undefined;
}

class MemoryQuery {
  selection: unknown;
  table: unknown;
  joins: unknown[] = [];
  condition: unknown;

  constructor(
    private readonly database: MemoryDatabase,
    selection: unknown,
  ) {
    this.selection = selection;
  }

  from(table: unknown) {
    this.table = table;
    return this;
  }

  innerJoin(table: unknown) {
    this.joins.push(table);
    return this;
  }

  where(condition: unknown) {
    this.condition = condition;
    return this;
  }

  orderBy() {
    return this;
  }

  limit() {
    return this;
  }

  then(resolve: (value: unknown[]) => unknown, reject: (error: unknown) => unknown) {
    return Promise.resolve()
      .then(() => this.database.execute(this))
      .then(resolve, reject);
  }
}

class MemoryDatabase {
  readonly queries: Array<{ table: string; sql: string; params: unknown[] }> = [];
  readonly updates: Array<{ table: string; sql: string; params: unknown[] }> = [];
  readonly inserted: Array<{ table: string; values: Record<string, unknown> }> = [];
  transactionCalls = 0;
  skills: Array<Record<string, any>> = [];
  versions: Array<Record<string, any>> = [];
  questions: Array<Record<string, any>> = [];

  async transaction() {
    this.transactionCalls += 1;
    throw new Error("Unexpected database transaction in validation test");
  }

  select(selection?: unknown) {
    return new MemoryQuery(this, selection);
  }

  async transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }

  execute(query: MemoryQuery): unknown[] {
    const table = getTableName(query.table as never);
    const compiled = query.condition
      ? new PgDialect().sqlToQuery(query.condition as never)
      : { sql: "", params: [] };
    const params = compiled.params as unknown[];
    this.queries.push({ table, sql: compiled.sql, params });

    if (table === getTableName(skillsTable)) {
      const owner = paramFor(compiled.sql, params, "skills", "owner_id");
      assert.ok(owner, "skill queries must filter by the authenticated owner");
      const id = paramFor(compiled.sql, params, "skills", "id");
      const rows = this.skills.filter(
        (skill) =>
          skill.ownerId === owner && (id === undefined || skill.id === id),
      );
      return isCountSelection(query.selection)
        ? [{ value: rows.length }]
        : rows;
    }

    if (table === getTableName(skillVersionsTable)) {
      const owner = paramFor(compiled.sql, params, "skills", "owner_id");
      if (query.joins.length > 0) {
        assert.ok(
          owner,
          "version queries joined to skills must filter by the authenticated owner",
        );
      }
      const versionId = paramFor(
        compiled.sql,
        params,
        "skill_versions",
        "id",
      );
      const requestedSkillId = paramFor(
        compiled.sql,
        params,
        "skill_versions",
        "skill_id",
      );
      let rows = this.versions.filter(
        (version) =>
          (owner === undefined || version.ownerId === owner) &&
          (versionId === undefined || version.id === versionId) &&
          (requestedSkillId === undefined ||
            version.skillId === requestedSkillId),
      );
      if (isCountSelection(query.selection)) {
        return [{ value: rows.length }];
      }
      if (
        query.selection &&
        typeof query.selection === "object" &&
        "version" in query.selection
      ) {
        rows = rows.map((version) => ({ version }));
      } else if (
        query.selection &&
        typeof query.selection === "object" &&
        "versionId" in query.selection
      ) {
        rows = rows.map((version) => ({
          skillId: version.skillId,
          skillName: version.skillName,
          versionId: version.id,
          versionLabel: version.versionLabel,
          files: version.files,
        }));
      }
      return rows;
    }

    if (table === getTableName(questionsTable)) {
      const owner = paramFor(
        compiled.sql,
        params,
        "skill_questions",
        "owner_id",
      );
      assert.ok(owner, "question queries must filter by the authenticated owner");
      const rows = this.questions.filter(
        (question) => question.ownerId === owner,
      );
      return isCountSelection(query.selection)
        ? [{ value: rows.length }]
        : rows;
    }

    throw new Error(`Unexpected query table: ${table}`);
  }

  insert(table: unknown) {
    return {
      values: (values: Record<string, unknown>) => {
        const tableName = getTableName(table as never);
        this.inserted.push({ table: tableName, values });
        return {
          returning: async () => {
            const id =
              tableName === getTableName(skillsTable)
                ? skillId
                : tableName === getTableName(skillVersionsTable)
                  ? this.versions.length === 0
                    ? firstVersionId
                    : newlyCreatedVersionId
                  : savedQuestionId;
            const row = {
              ...values,
              id,
              createdAt: testDate,
              updatedAt: testDate,
              uploadedAt: testDate,
            };
            if (tableName === getTableName(skillsTable)) this.skills.push(row);
            if (tableName === getTableName(skillVersionsTable)) {
              this.versions.push(row);
            }
            return [row];
          },
        };
      },
    };
  }

  update(table: unknown) {
    const tableName = getTableName(table as never);
    return {
      set: (values: Record<string, unknown>) => ({
        where: (condition: unknown) => {
          const applyUpdate = async () => {
            const compiled = new PgDialect().sqlToQuery(condition as never);
            const params = compiled.params as unknown[];
            this.updates.push({ table: tableName, sql: compiled.sql, params });
            if (tableName !== getTableName(skillsTable)) {
              throw new Error(`Unexpected update table: ${tableName}`);
            }
            const id = paramFor(compiled.sql, params, "skills", "id");
            const owner = paramFor(compiled.sql, params, "skills", "owner_id");
            const matches = this.skills.filter(
              (skill) =>
                (id === undefined || skill.id === id) &&
                (owner === undefined || skill.ownerId === owner),
            );
            for (const skill of matches) Object.assign(skill, values);
            return matches;
          };
          return {
            returning: applyUpdate,
            then: (
              resolve: (value: unknown[]) => unknown,
              reject: (error: unknown) => unknown,
            ) => Promise.resolve().then(applyUpdate).then(resolve, reject),
          };
        },
      }),
    };
  }

  transaction<T>(callback: (transaction: MemoryDatabase) => Promise<T>) {
    return callback(this);
  }
}

function isCountSelection(selection: unknown): boolean {
  return (
    selection !== null &&
    typeof selection === "object" &&
    "value" in selection
  );
}

function makeSkill(id: string, owner: string, currentVersionId: string) {
  return {
    id,
    ownerId: owner,
    name: owner === ownerId ? "Private skill A" : "Private skill B",
    description: null,
    currentVersionId,
    createdAt: testDate,
    updatedAt: testDate,
  };
}

function makeVersion(
  id: string,
  parentSkillId: string,
  owner: string,
  versionLabel: string,
  marker: string,
) {
  return {
    id,
    skillId: parentSkillId,
    ownerId: owner,
    skillName: owner === ownerId ? "Private skill A" : "Private skill B",
    versionLabel,
    fileName: `${versionLabel}.zip`,
    objectPath: `/objects/uploads/${id}`,
    files: [
      { path: "SKILL.md", content: `# ${marker}\n${marker} guidance.` },
      { path: "notes.md", content: `${marker} supporting notes.` },
    ],
    uploadedAt: testDate,
  };
}

function makeUploadObjectPath(userId: string, objectId: string): string {
  const ownerScope = createHash("sha256").update(userId).digest("hex");
  return `/objects/uploads/${ownerScope}/${objectId}`;
}

function makeSkillUploadStorage(
  existingPolicies: Map<string, { owner: string; visibility: "private" }> =
    new Map(),
) {
  const calls = {
    set: [] as Array<{
      objectPath: string;
      policy: { owner: string; visibility: "private" };
    }>,
  };
  const service = {
    trySetObjectEntityAclPolicy: async (
      objectPath: string,
      policy: { owner: string; visibility: "private" },
    ) => {
      const currentPolicy = existingPolicies.get(objectPath);
      if (
        (currentPolicy && currentPolicy.owner !== policy.owner) ||
        (!currentPolicy &&
          !objectPath.startsWith(
            `/objects/uploads/${createHash("sha256").update(policy.owner).digest("hex")}/`,
          ))
      ) {
        throw new ObjectOwnershipError();
      }
      calls.set.push({ objectPath, policy });
      existingPolicies.set(objectPath, { ...policy });
      return objectPath;
    },
  };
  return { service, calls, policies: existingPolicies };
}

function skillFiles() {
  return [
    { path: "SKILL.md", content: "# Test skill\nTest guidance." },
    { path: "notes.md", content: "Supporting notes." },
  ];
}

function makeAclObjectFile(
  initialPolicy: { owner: string; visibility: "private" } | null = null,
) {
  let metadata: Record<string, string> = initialPolicy
    ? { "custom:aclPolicy": JSON.stringify(initialPolicy) }
    : {};
  let writes = 0;
  const file = {
    name: "private/uploads/test.zip",
    exists: async () => [true],
    getMetadata: async () => [{ metadata }],
    setMetadata: async ({
      metadata: nextMetadata,
    }: {
      metadata: Record<string, string>;
    }) => {
      metadata = { ...metadata, ...nextMetadata };
      writes += 1;
    },
  };
  return {
    file,
    getPolicy: () => {
      const serialized = metadata["custom:aclPolicy"];
      return serialized
        ? (JSON.parse(serialized) as {
            owner: string;
            visibility: "private";
          })
        : null;
    },
    get writes() {
      return writes;
    },
  };
}

test("object storage claims only owner-scoped uploads and preserves existing owners", async () => {
  const ownObjectPath = makeUploadObjectPath(
    ownerId,
    "e0000000-0000-4000-8000-00000000000e",
  );
  const ownObject = makeAclObjectFile();
  const ownStorage = new ObjectStorageService();
  ownStorage.getObjectEntityFile = async () => ownObject.file as never;

  await ownStorage.trySetObjectEntityAclPolicy(ownObjectPath, {
    owner: ownerId,
    visibility: "private",
  });
  assert.deepEqual(ownObject.getPolicy(), {
    owner: ownerId,
    visibility: "private",
  });
  assert.equal(ownObject.writes, 1);

  const foreignObjectPath = makeUploadObjectPath(
    otherOwnerId,
    "f0000000-0000-4000-8000-00000000000f",
  );
  const foreignPolicy = { owner: otherOwnerId, visibility: "private" as const };
  for (const initialPolicy of [foreignPolicy, null]) {
    const foreignObject = makeAclObjectFile(initialPolicy);
    const storage = new ObjectStorageService();
    storage.getObjectEntityFile = async () => foreignObject.file as never;

    await assert.rejects(
      storage.trySetObjectEntityAclPolicy(foreignObjectPath, {
        owner: ownerId,
        visibility: "private",
      }),
      ObjectOwnershipError,
    );
    assert.deepEqual(foreignObject.getPolicy(), initialPolicy);
    assert.equal(foreignObject.writes, 0);
  }
});

test("the ACL setter refuses to transfer an existing object to another owner", async () => {
  const originalPolicy = { owner: otherOwnerId, visibility: "private" as const };
  const objectFile = makeAclObjectFile(originalPolicy);

  await assert.rejects(
    setObjectAclPolicy(objectFile.file as never, {
      owner: ownerId,
      visibility: "private",
    }),
    ObjectOwnershipError,
  );
  assert.deepEqual(objectFile.getPolicy(), originalPolicy);
  assert.equal(objectFile.writes, 0);
});

test("upload URL requests return object paths scoped to the authenticated owner", async () => {
  const originalFetch = globalThis.fetch;
  const objectStorage = new ObjectStorageService();
  let signedRequest: { bucket_name: string; object_name: string } | undefined;
  objectStorage.getPrivateObjectDir = () => "/test-bucket/private";
  globalThis.fetch = async (input, init) => {
    // Replit object-storage credential sidecar; this mock does not open a
    // project listener.
    if (String(input) !== "http://127.0.0.1:1106/object-storage/signed-object-url") {
      return originalFetch(input, init);
    }

    signedRequest = JSON.parse(String(init?.body)) as {
      bucket_name: string;
      object_name: string;
    };
    return new Response(
      JSON.stringify({
        signed_url: `https://storage.googleapis.com/${signedRequest.bucket_name}/${signedRequest.object_name}`,
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    await withServer(
      { id: ownerId },
      [createStorageRouter(objectStorage)],
      async (base) => {
        const response = await request(base, "/api/storage/uploads/request-url", {
          method: "POST",
          body: {
            name: "skill.zip",
            size: 100,
            contentType: "application/zip",
          },
        });
        assert.equal(response.status, 200);
        const payload = await response.json();
        const ownerScope = createHash("sha256").update(ownerId).digest("hex");
        assert.match(
          payload.objectPath,
          new RegExp(`^/objects/uploads/${ownerScope}/[a-f0-9-]{36}$`, "i"),
        );
        assert.equal(payload.uploadURL, `https://storage.googleapis.com/${signedRequest?.bucket_name}/${signedRequest?.object_name}`);
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const ownerScope = createHash("sha256").update(ownerId).digest("hex");
  assert.equal(signedRequest?.bucket_name, "test-bucket");
  assert.match(
    signedRequest?.object_name ?? "",
    new RegExp(`^private/uploads/${ownerScope}/[a-f0-9-]{36}$`, "i"),
  );
});

test("abandoned upload cleanup deletes expired unreferenced ZIPs only", async () => {
  const now = new Date("2026-10-05T12:00:00.000Z");
  const expiredPath =
    "/objects/uploads/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/10000000-0000-4000-8000-000000000010";
  const activePath =
    "/objects/uploads/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/20000000-0000-4000-8000-000000000020";
  const savedPath =
    "/objects/uploads/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc/30000000-0000-4000-8000-000000000030";
  const deleted: string[] = [];
  const result = await cleanupAbandonedSkillUploads({
    now,
    objectStorage: {
      listSkillUploadObjects: async () => [
        {
          objectPath: expiredPath,
          createdAt: new Date(now.getTime() - ABANDONED_UPLOAD_RETENTION_MS - 1),
        },
        {
          objectPath: activePath,
          createdAt: new Date(now.getTime() - ABANDONED_UPLOAD_RETENTION_MS + 1),
        },
        {
          objectPath: savedPath,
          createdAt: new Date(now.getTime() - ABANDONED_UPLOAD_RETENTION_MS - 1),
        },
      ],
      deleteSkillUploadObject: async (objectPath) => {
        deleted.push(objectPath);
      },
    },
    findSavedPaths: async (candidates) =>
      new Set(candidates.filter((path) => path === savedPath)),
  });

  assert.deepEqual(deleted, [expiredPath]);
  assert.deepEqual(result, { deleted: 1, active: 1, saved: 1, failed: 0 });
});

function makeQuestion(id: string, owner: string, question: string) {
  return {
    id,
    ownerId: owner,
    skillId: owner === ownerId ? skillId : otherSkillId,
    skillName: owner === ownerId ? "Private skill A" : "Private skill B",
    skillVersionId: owner === ownerId ? firstVersionId : secondVersionId,
    versionLabel: owner === ownerId ? "1.0" : "9.0",
    projectName: null,
    question,
    answer: `${owner} private answer`,
    createdAt: testDate,
  };
}

function makeStorage(allowedOwner: string) {
  const calls = { getFile: 0, authorize: [] as string[], download: 0 };
  const service = {
    getObjectEntityFile: async (objectPath: string) => {
      calls.getFile += 1;
      return { objectPath };
    },
    canAccessObjectEntity: async ({
      userId,
    }: {
      userId: string;
      objectFile: { objectPath: string };
    }) => {
      calls.authorize.push(userId);
      return userId === allowedOwner;
    },
    downloadObject: async () => {
      calls.download += 1;
      return new Response("private zip bytes", {
        status: 200,
        headers: { "content-type": "application/zip" },
      });
    },
  };
  return { service, calls };
}

async function withServer(
  user: User,
  routers: unknown[],
  run: (base: string) => Promise<void>,
  logRecords: CapturedLogRecord[] = [],
) {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use((req, _res, next) => {
    req.isAuthenticated = () => user !== null;
    if (user) req.user = user;
    req.log = {
      error() {},
      warn(fields: Record<string, unknown>, message: string) {
        logRecords.push({ level: "warn", fields, message });
      },
    } as never;
    next();
  });
  app.use("/api", ...(routers as never[]));

  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        server.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
    });

    const address = server.address();
    assert.ok(address && typeof address !== "string");
    assert.ok(address.port > 0);
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }
}

async function request(
  base: string,
  path: string,
  options: { method?: string; body?: unknown } = {},
) {
  return fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: options.body === undefined ? {} : { "content-type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

test("API health is healthy JSON through the artifact's /api route", async () => {
  await withServer(null, [healthRouter], async (base) => {
    const response = await request(base, "/api/healthz");

    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-type") ?? "",
      /^application\/json(?:;|$)/i,
    );
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("route test servers close their ephemeral listener after success and failure", async () => {
  let successfulBase = "";
  await withServer(null, [], async (base) => {
    successfulBase = base;
  });
  await assert.rejects(fetch(successfulBase));

  let failedBase = "";
  const callbackFailure = new Error("intentional callback failure");
  await assert.rejects(
    withServer(null, [], async (base) => {
      failedBase = base;
      throw callbackFailure;
    }),
    (error) => error === callbackFailure,
  );
  await assert.rejects(fetch(failedBase));
});

type SkillFileFixture = { path: string; content: string };

const validSkillFiles: SkillFileFixture[] = [
  { path: "SKILL.md", content: "# A safe skill\n" },
];

const unsafeSkillUploadCases: Array<{
  name: string;
  files: SkillFileFixture[];
  errorPattern?: RegExp;
  errorIncludes?: string;
}> = [
  ...sharedValidationCases.invalidArchives.map((scenario) => ({
    name: scenario.name,
    files: scenario.files,
    errorIncludes: scenario.serverErrorIncludes,
  })),
  {
    name: "an unsupported file extension",
    files: [
      ...validSkillFiles,
      { path: "payload.exe", content: "not a supported text file" },
    ],
    errorPattern: /not supported text/i,
  },
  {
    name: "a traversal path",
    files: [
      ...validSkillFiles,
      { path: "../secrets.md", content: "do not read" },
    ],
    errorPattern: /unsafe file path/i,
  },
  {
    name: "an absolute path",
    files: [...validSkillFiles, { path: "/tmp/notes.md", content: "outside" }],
    errorPattern: /unsafe file path/i,
  },
  {
    name: "a dot-segment path",
    files: [...validSkillFiles, { path: "folder/./notes.md", content: "ambiguous" }],
    errorPattern: /unsafe file path/i,
  },
  {
    name: "a Windows drive path",
    files: [...validSkillFiles, { path: "C:/private.md", content: "outside" }],
    errorPattern: /unsafe file path/i,
  },
  {
    name: "duplicate paths",
    files: [
      ...validSkillFiles,
      { path: "SKILL.md", content: "# shadow copy\n" },
    ],
    errorPattern: /duplicate file paths/i,
  },
  {
    name: "case-insensitive duplicate paths",
    files: [
      ...validSkillFiles,
      { path: "skill.md", content: "# shadow copy\n" },
    ],
    errorPattern: /duplicate file paths/i,
  },
  {
    name: "Unicode-normalized duplicate paths",
    files: [
      ...validSkillFiles,
      { path: "café.md", content: "composed" },
      { path: "cafe\u0301.md", content: "decomposed" },
    ],
    errorPattern: /duplicate file paths/i,
  },
  {
    name: "a provider API token",
    files: [
      {
        path: "SKILL.md",
        content: `OPENAI_API_KEY=sk-proj-${"a".repeat(28)}`,
      },
    ],
    errorPattern: /Remove passwords/i,
  },
  {
    name: "a password assignment",
    files: [
      {
        path: "SKILL.md",
        content: "password=correcthorsebatterystaple",
      },
    ],
    errorPattern: /Remove passwords/i,
  },
  {
    name: "a credential in a supporting file",
    files: [
      ...validSkillFiles,
      {
        path: "config.yaml",
        content: `access_token: ${"z".repeat(30)}`,
      },
    ],
    errorPattern: /Remove passwords/i,
  },
  {
    name: "more than 60 files",
    files: [
      ...validSkillFiles,
      ...Array.from({ length: 60 }, (_, index) => ({
        path: `reference-${index}.md`,
        content: "safe",
      })),
    ],
    errorPattern: /60/,
  },
  {
    name: "more than 2.5 MB of extracted UTF-8 text",
    files: [
      ...validSkillFiles,
      ...Array.from({ length: 13 }, (_, index) => ({
        path: `part-${index}.md`,
        content: "é".repeat(100_000),
      })),
    ],
    errorPattern: /extracted skill text is too large/i,
  },
];

const questionVersions = [
  makeVersion(firstVersionId, skillId, ownerId, "1.0", "OLD_VERSION_MARKER"),
  makeVersion(secondVersionId, skillId, ownerId, "2.0", "SELECTED_VERSION_MARKER"),
  makeVersion(
    "60000000-0000-4000-8000-000000000006",
    otherSkillId,
    otherOwnerId,
    "9.0",
    "OTHER_OWNER_MARKER",
  ),
];

for (const operation of ["create skill", "add a version"] as const) {
  for (const scenario of unsafeSkillUploadCases) {
    test(`${operation} rejects ${scenario.name} before storage ownership or database activity`, async () => {
      const database = new MemoryDatabase();
      let ownershipCalls = 0;
      const objectStorage = {
        trySetObjectEntityAclPolicy: async () => {
          ownershipCalls += 1;
        },
      };
      const body = {
        versionLabel: "1.0",
        fileName: "skill.zip",
        objectPath: "/objects/uploads/70000000-0000-4000-8000-000000000007",
        files: scenario.files,
        ...(operation === "create skill" ? { name: "Unsafe skill" } : {}),
      };
      const path =
        operation === "create skill"
          ? "/api/skills"
          : `/api/skills/${skillId}/versions`;

      await withServer(
        { id: ownerId },
        [createSkillsRouter(database as never, objectStorage as never)],
        async (base) => {
          const response = await request(base, path, {
            method: "POST",
            body,
          });
          assert.equal(response.status, 400);
          const payload = await response.json();
          assert.equal(typeof payload.error, "string");
          if (scenario.errorPattern) {
            assert.match(payload.error, scenario.errorPattern);
          }
          if (scenario.errorIncludes) {
            assert.ok(payload.error.includes(scenario.errorIncludes));
          }
        },
      );

      assert.equal(ownershipCalls, 0);
      assert.equal(database.queries.length, 0);
      assert.equal(database.transactionCalls, 0);
      assert.equal(database.inserted.length, 0);
      assert.equal(database.updates.length, 0);
    });
  }
}

test("accepts every supported extension in the shared browser validation matrix", async () => {
  const database = new MemoryDatabase();
  const storage = makeSkillUploadStorage();
  const files = [
    ...validSkillFiles,
    ...sharedValidationCases.supportedExtensions.map((extension) => ({
      path: `references/example${extension}`,
      content: `Text in ${extension}`,
    })),
  ];

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, storage.service as never)],
    async (base) => {
      const response = await request(base, "/api/skills", {
        method: "POST",
        body: {
          name: "Supported extension matrix",
          versionLabel: "1.0",
          fileName: "skill.zip",
          objectPath: makeUploadObjectPath(
            ownerId,
            "70000000-0000-4000-8000-000000000007",
          ),
          files,
        },
      });
      assert.equal(response.status, 201);
    },
  );

  assert.deepEqual(
    (database.versions[0]?.files as SkillFileFixture[]).map(
      ({ path: filePath }) => path.extname(filePath).toLowerCase(),
    ),
    [".md", ...sharedValidationCases.supportedExtensions],
  );
});

test("unauthenticated requests cannot list skills, versions, questions, upload URLs, or private ZIP objects", async () => {
  const database = new MemoryDatabase();
  const storage = makeStorage(ownerId);
  const skills = createSkillsRouter(database as never, {} as never);
  const questions = createQuestionsRouter(database as never, {} as never);
  const storageRouter = createStorageRouter(storage.service as never);

  await withServer(
    null,
    [storageRouter, skills, questions, createWorkbenchRouter(database as never)],
    async (base) => {
    const checks = [
      await request(base, "/api/skills"),
      await request(base, `/api/skills/${skillId}/versions`),
      await request(base, "/api/questions"),
      await request(base, "/api/workbench/summary"),
      await request(base, "/api/questions", {
        method: "POST",
        body: {
          skillVersionId: firstVersionId,
          question: "How should this implementation work?",
        },
      }),
      await request(base, "/api/storage/uploads/request-url", {
        method: "POST",
        body: { name: "skill.zip", size: 100, contentType: "application/zip" },
      }),
      await request(base, "/api/skills/analyze-description", {
        method: "POST",
        body: { files: [{ path: "SKILL.md", content: "# Skill" }] },
      }),
      await request(base, `/api/skills/${skillId}`, {
        method: "PATCH",
        body: { name: "New name", description: "New description" },
      }),
      await request(base, "/api/storage/objects/uploads/private.zip"),
    ];

    assert.deepEqual(
      checks.map((response) => response.status),
      [401, 401, 401, 401, 401, 401, 401, 401, 401],
    );
    assert.equal(database.queries.length, 0);
    assert.equal(storage.calls.getFile, 0);
    },
  );
});

test("a user sees only their own skills and versions", async () => {
  const database = new MemoryDatabase();
  database.skills = [
    makeSkill(skillId, ownerId, firstVersionId),
    makeSkill(otherSkillId, otherOwnerId, secondVersionId),
  ];
  database.versions = questionVersions;

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, {} as never)],
    async (base) => {
      const response = await request(base, "/api/skills");
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.deepEqual(
        payload.skills.map((skill: { id: string }) => skill.id),
        [skillId],
      );
      assert.deepEqual(
        payload.skills[0].versions.map((version: { id: string }) => version.id),
        [firstVersionId, secondVersionId],
      );
    },
  );
});

test("skill description analysis is authenticated, bounded, and returns only a description", async () => {
  const database = new MemoryDatabase();
  const modelCalls: unknown[] = [];
  const model = {
    chat: {
      completions: {
        create: async (input: unknown) => {
          modelCalls.push(input);
          return {
            choices: [
              { message: { content: "Guides developers through API integrations." } },
            ],
          };
        },
      },
    },
  };

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, {} as never, model as never)],
    async (base) => {
      const response = await request(base, "/api/skills/analyze-description", {
        method: "POST",
        body: {
          files: [
            { path: "SKILL.md", content: `# Integration patterns\n${"guide ".repeat(4_000)}` },
            { path: "references/setup.md", content: "Install the SDK." },
          ],
        },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        description: "Guides developers through API integrations.",
      });
      assert.equal(modelCalls.length, 1);
      const modelInput = modelCalls[0] as {
        messages: Array<{ content: string }>;
      };
      assert.ok(modelInput.messages[1].content.length < 32_000);
      assert.equal(database.queries.length, 0);
      assert.equal(database.inserted.length, 0);
    },
  );
});

test("skill description analysis rejects unsafe and oversized extracted text before model access", async () => {
  const database = new MemoryDatabase();
  let modelCalls = 0;
  const model = {
    chat: {
      completions: {
        create: async () => {
          modelCalls += 1;
          return { choices: [{ message: { content: "Should not run." } }] };
        },
      },
    },
  };
  const router = createSkillsRouter(database as never, {} as never, model as never);
  const oversizedFiles = [
    { path: "SKILL.md", content: "# Skill" },
    ...Array.from({ length: 13 }, (_, index) => ({
      path: `references/guide-${index}.md`,
      content: "x".repeat(200_000),
    })),
  ];

  await withServer({ id: ownerId }, [router], async (base) => {
    const requests = [
      { files: [{ path: "SKILL.md", content: "# Skill" }, { path: "../escape.md", content: "bad" }] },
      { files: [{ path: "SKILL.md", content: "OPENAI_API_KEY=sk-proj-" + "a".repeat(28) }] },
      { files: [{ path: "SKILL.md", content: "é".repeat(100_001) }] },
      { files: oversizedFiles },
      { files: [{ path: "SKILL.md", content: "# Skill" }, { path: "notes.exe", content: "unsupported" }] },
    ];
    const responses = [];
    for (const body of requests) {
      responses.push(
        await request(base, "/api/skills/analyze-description", {
          method: "POST",
          body,
        }),
      );
    }
    assert.deepEqual(
      responses.map((response) => response.status),
      [400, 400, 400, 400, 400],
    );
    assert.equal(modelCalls, 0);
  });
});

test("skill description analysis rejects missing SKILL.md and embedded NUL bytes before model or database access", async () => {
  const database = new MemoryDatabase();
  let modelCalls = 0;
  const model = {
    chat: {
      completions: {
        create: async () => {
          modelCalls += 1;
          return { choices: [{ message: { content: "Should not run." } }] };
        },
      },
    },
  };
  const invalidCases = [
    {
      name: "a missing SKILL.md file",
      files: [{ path: "README.md", content: "No skill entry point." }],
      errorPattern: /does not contain a SKILL\.md file/i,
    },
    {
      name: "an embedded NUL byte",
      files: [{ path: "SKILL.md", content: "text\u0000binary" }],
      errorPattern: /not supported text/i,
    },
  ];

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, {} as never, model as never)],
    async (base) => {
      for (const scenario of invalidCases) {
        const response = await request(base, "/api/skills/analyze-description", {
          method: "POST",
          body: { files: scenario.files },
        });
        assert.equal(response.status, 400, scenario.name);
        const payload = await response.json();
        assert.match(payload.error, scenario.errorPattern, scenario.name);
      }
    },
  );

  assert.equal(modelCalls, 0);
  assert.equal(database.queries.length, 0);
  assert.equal(database.transactionCalls, 0);
  assert.equal(database.inserted.length, 0);
  assert.equal(database.updates.length, 0);
});

test("skill details update only changes the owner's metadata and preserves versions", async () => {
  const database = new MemoryDatabase();
  database.skills = [
    makeSkill(skillId, ownerId, firstVersionId),
    makeSkill(otherSkillId, otherOwnerId, secondVersionId),
  ];
  database.versions = questionVersions;

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, {} as never)],
    async (base) => {
      const response = await request(base, `/api/skills/${skillId}`, {
        method: "PATCH",
        body: { name: "  Revised skill  ", description: "  Useful guidance  " },
      });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.name, "Revised skill");
      assert.equal(result.description, "Useful guidance");
      assert.equal(result.currentVersionId, firstVersionId);
      assert.deepEqual(
        result.versions.map((version: { id: string }) => version.id),
        [firstVersionId, secondVersionId],
      );
      assert.match(database.updates[0].sql, /"skills"\."owner_id"/);

      const otherResponse = await request(base, `/api/skills/${otherSkillId}`, {
        method: "PATCH",
        body: { name: "Stolen update", description: null },
      });
      assert.equal(otherResponse.status, 404);
      assert.equal(database.skills[1].name, "Private skill B");
    },
  );
});

test("single-skill creation and adding a version still save distinct versions", async () => {
  const database = new MemoryDatabase();
  const storage = {
    trySetObjectEntityAclPolicy: async () => undefined,
  };
  const files = [{ path: "SKILL.md", content: "# Integration skill" }];

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, storage as never)],
    async (base) => {
      const createdResponse = await request(base, "/api/skills", {
        method: "POST",
        body: {
          name: "Integration skill",
          description: "Initial description",
          versionLabel: "1.0.0",
          fileName: "integration.zip",
          objectPath: "/objects/uploads/10000000-0000-4000-8000-000000000010",
          files,
        },
      });
      assert.equal(createdResponse.status, 201);
      assert.equal(database.skills[0].currentVersionId, firstVersionId);

      const versionResponse = await request(
        base,
        `/api/skills/${skillId}/versions`,
        {
          method: "POST",
          body: {
            versionLabel: "1.1.0",
            fileName: "integration-1.1.0.zip",
            objectPath: "/objects/uploads/20000000-0000-4000-8000-000000000020",
            files,
          },
        },
      );
      assert.equal(versionResponse.status, 201);
      assert.equal(database.skills[0].currentVersionId, newlyCreatedVersionId);
      assert.equal(database.versions.length, 2);
    },
  );
});

test("a user cannot read another owner's skill versions", async () => {
  const database = new MemoryDatabase();
  database.skills = [makeSkill(otherSkillId, otherOwnerId, secondVersionId)];
  database.versions = questionVersions;

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, {} as never)],
    async (base) => {
      const response = await request(
        base,
        `/api/skills/${otherSkillId}/versions`,
      );
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Skill not found." });
    },
  );
});

test("a user sees only their own saved questions", async () => {
  const database = new MemoryDatabase();
  database.questions = [
    makeQuestion(savedQuestionId, ownerId, "My question"),
    makeQuestion(
      "70000000-0000-4000-8000-000000000007",
      otherOwnerId,
      "Another user's private question",
    ),
  ];

  await withServer(
    { id: ownerId },
    [createQuestionsRouter(database as never, {} as never)],
    async (base) => {
      const response = await request(base, "/api/questions");
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.deepEqual(
        payload.questions.map((question: { id: string }) => question.id),
        [savedQuestionId],
      );
    },
  );
});

test("workbench summaries count and list only the authenticated user's questions", async () => {
  const database = new MemoryDatabase();
  database.skills = [
    makeSkill(skillId, ownerId, firstVersionId),
    makeSkill(otherSkillId, otherOwnerId, secondVersionId),
  ];
  database.versions = questionVersions;
  database.questions = [
    makeQuestion(savedQuestionId, ownerId, "My question"),
    makeQuestion(
      "70000000-0000-4000-8000-000000000007",
      otherOwnerId,
      "Another user's private question",
    ),
  ];

  await withServer(
    { id: ownerId },
    [createWorkbenchRouter(database as never)],
    async (base) => {
      const response = await request(base, "/api/workbench/summary");
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.skillCount, 1);
      assert.equal(payload.versionCount, 2);
      assert.equal(payload.questionCount, 1);
      assert.deepEqual(
        payload.recentQuestions.map((question: { id: string }) => question.id),
        [savedQuestionId],
      );
    },
  );
});

test("skill creation accepts the caller's upload and claims it privately", async () => {
  const database = new MemoryDatabase();
  const storage = makeSkillUploadStorage();
  const objectPath = makeUploadObjectPath(
    ownerId,
    "a0000000-0000-4000-8000-00000000000a",
  );

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, storage.service as never)],
    async (base) => {
      const response = await request(base, "/api/skills", {
        method: "POST",
        body: {
          name: "Test skill",
          versionLabel: "1.0",
          fileName: "skill.zip",
          objectPath,
          files: skillFiles(),
        },
      });
      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.name, "Test skill");
      assert.equal(storage.policies.get(objectPath)?.owner, ownerId);
    },
  );

  assert.equal(storage.calls.set.length, 1);
  assert.deepEqual(
    database.inserted.map((entry) => entry.table),
    ["skills", "skill_versions"],
  );
});

test("skill creation rejects another user's upload without changing its ACL or writing", async () => {
  const database = new MemoryDatabase();
  const objectPath = makeUploadObjectPath(
    otherOwnerId,
    "b0000000-0000-4000-8000-00000000000b",
  );
  const originalPolicy = { owner: otherOwnerId, visibility: "private" as const };
  const storage = makeSkillUploadStorage(
    new Map([[objectPath, originalPolicy]]),
  );
  const logRecords: CapturedLogRecord[] = [];
  const uploadFiles = skillFiles();
  uploadFiles[0].content += "\nZIP_CONTENT_SENTINEL";
  const credentialSentinel = "CREDENTIAL_SENTINEL";

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, storage.service as never)],
    async (base) => {
      const response = await request(base, "/api/skills", {
        method: "POST",
        body: {
          name: "Stolen upload",
          versionLabel: "1.0",
          fileName: "skill.zip",
          objectPath,
          files: uploadFiles,
          credential: credentialSentinel,
        },
      });
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        error: "You cannot use an upload belonging to another account.",
      });
    },
    logRecords,
  );

  assert.deepEqual(logRecords, [
    {
      level: "warn",
      fields: {
        event: "upload_ownership_denied",
        requestType: "skill_create",
        actorId: ownerId,
      },
      message: "Upload ownership check denied",
    },
  ]);
  const serializedLogs = JSON.stringify(logRecords);
  assert.equal(serializedLogs.includes(objectPath), false);
  assert.equal(serializedLogs.includes("ZIP_CONTENT_SENTINEL"), false);
  assert.equal(serializedLogs.includes(credentialSentinel), false);
  assert.equal(storage.calls.set.length, 0);
  assert.deepEqual(storage.policies.get(objectPath), originalPolicy);
  assert.equal(database.inserted.length, 0);
});

test("version updates accept the caller's upload and claim it privately", async () => {
  const database = new MemoryDatabase();
  database.skills = [makeSkill(skillId, ownerId, firstVersionId)];
  const storage = makeSkillUploadStorage();
  const objectPath = makeUploadObjectPath(
    ownerId,
    "c0000000-0000-4000-8000-00000000000c",
  );

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, storage.service as never)],
    async (base) => {
      const response = await request(
        base,
        `/api/skills/${skillId}/versions`,
        {
          method: "POST",
          body: {
            versionLabel: "2.0",
            fileName: "skill-v2.zip",
            objectPath,
            files: skillFiles(),
          },
        },
      );
      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.versionLabel, "2.0");
      assert.equal(storage.policies.get(objectPath)?.owner, ownerId);
    },
  );

  assert.equal(storage.calls.set.length, 1);
  assert.deepEqual(
    database.inserted.map((entry) => entry.table),
    ["skill_versions"],
  );
});

test("version updates reject another user's upload without changing its ACL or writing", async () => {
  const database = new MemoryDatabase();
  database.skills = [makeSkill(skillId, ownerId, firstVersionId)];
  const objectPath = makeUploadObjectPath(
    otherOwnerId,
    "d0000000-0000-4000-8000-00000000000d",
  );
  const originalPolicy = { owner: otherOwnerId, visibility: "private" as const };
  const storage = makeSkillUploadStorage(
    new Map([[objectPath, originalPolicy]]),
  );
  const logRecords: CapturedLogRecord[] = [];
  const uploadFiles = skillFiles();
  uploadFiles[0].content += "\nZIP_CONTENT_SENTINEL";
  const credentialSentinel = "CREDENTIAL_SENTINEL";

  await withServer(
    { id: ownerId },
    [createSkillsRouter(database as never, storage.service as never)],
    async (base) => {
      const response = await request(
        base,
        `/api/skills/${skillId}/versions`,
        {
          method: "POST",
          body: {
            versionLabel: "2.0",
            fileName: "foreign.zip",
            objectPath,
            files: uploadFiles,
            credential: credentialSentinel,
          },
        },
      );
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        error: "You cannot use an upload belonging to another account.",
      });
    },
      logRecords,
  );

  assert.deepEqual(logRecords, [
    {
      level: "warn",
      fields: {
        event: "upload_ownership_denied",
        requestType: "skill_version_create",
        actorId: ownerId,
      },
      message: "Upload ownership check denied",
    },
  ]);
  const serializedLogs = JSON.stringify(logRecords);
  assert.equal(serializedLogs.includes(objectPath), false);
  assert.equal(serializedLogs.includes("ZIP_CONTENT_SENTINEL"), false);
  assert.equal(serializedLogs.includes(credentialSentinel), false);
  assert.equal(storage.calls.set.length, 0);
  assert.deepEqual(storage.policies.get(objectPath), originalPolicy);
  assert.equal(database.inserted.length, 0);
  assert.equal(database.skills[0].currentVersionId, firstVersionId);
});

test("private ZIP object reads enforce the object owner's ACL", async () => {
  const storage = makeStorage(ownerId);
  const storageRouter = createStorageRouter(storage.service as never);

  await withServer({ id: otherOwnerId }, [storageRouter], async (base) => {
    const response = await request(
      base,
      "/api/storage/objects/uploads/private.zip",
    );
    assert.equal(response.status, 403);
    assert.deepEqual(storage.calls.authorize, [otherOwnerId]);
    assert.equal(storage.calls.download, 0);
  });

  await withServer({ id: ownerId }, [storageRouter], async (base) => {
    const response = await request(
      base,
      "/api/storage/objects/uploads/private.zip",
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "private zip bytes");
    assert.equal(storage.calls.download, 1);
  });
});

test("questions use only the requested version and save its owner and version IDs", async () => {
  const database = new MemoryDatabase();
  database.versions = questionVersions;
  let modelPrompt = "";
  let modelCalls = 0;
  const model = {
    chat: {
      completions: {
        create: async ({ messages }: { messages: Array<{ content: string }> }) => {
          modelCalls += 1;
          modelPrompt = messages.map((message) => message.content).join("\n");
          return { choices: [{ message: { content: "Use the selected version." } }] };
        },
      },
    },
  };

  await withServer(
    { id: ownerId },
    [createQuestionsRouter(database as never, model as never)],
    async (base) => {
      const response = await request(base, "/api/questions", {
        method: "POST",
        body: {
          skillVersionId: secondVersionId,
          question: "How do I apply the selected instructions?",
        },
      });
      assert.equal(response.status, 201);
      const payload = await response.json();
      assert.equal(payload.skillId, skillId);
      assert.equal(payload.skillVersionId, secondVersionId);
      assert.equal(payload.versionLabel, "2.0");
      assert.equal(payload.answer, "Use the selected version.");
    },
  );

  assert.equal(modelCalls, 1);
  assert.match(modelPrompt, /SELECTED_VERSION_MARKER/);
  assert.doesNotMatch(modelPrompt, /OLD_VERSION_MARKER|OTHER_OWNER_MARKER/);
  assert.deepEqual(database.inserted, [
    {
      table: "skill_questions",
      values: {
        ownerId,
        skillId,
        skillVersionId: secondVersionId,
        projectName: null,
        question: "How do I apply the selected instructions?",
        answer: "Use the selected version.",
      },
    },
  ]);
});

test("a user cannot ask about another owner's version", async () => {
  const database = new MemoryDatabase();
  database.versions = questionVersions;
  let modelCalls = 0;
  const model = {
    chat: {
      completions: {
        create: async () => {
          modelCalls += 1;
          return { choices: [{ message: { content: "Should not be called" } }] };
        },
      },
    },
  };

  await withServer(
    { id: ownerId },
    [createQuestionsRouter(database as never, model as never)],
    async (base) => {
      const response = await request(base, "/api/questions", {
        method: "POST",
        body: {
          skillVersionId: "60000000-0000-4000-8000-000000000006",
          question: "How do I apply another user's skill?",
        },
      });
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), {
        error: "That skill version was not found.",
      });
    },
  );

  assert.equal(modelCalls, 0);
  assert.equal(database.inserted.length, 0);
});

test("credential-containing questions or code context are rejected before database and model access", async () => {
  for (const body of [
    {
      skillVersionId: firstVersionId,
      question: `Use this token: ghp_${"a".repeat(24)}`,
    },
    {
      skillVersionId: firstVersionId,
      question: "Help me configure this project safely.",
      codeContext: `OPENAI_API_KEY=sk-proj-${"b".repeat(28)}`,
    },
  ]) {
    const database = new MemoryDatabase();
    let modelCalls = 0;
    const model = {
      chat: {
        completions: {
          create: async () => {
            modelCalls += 1;
            return { choices: [{ message: { content: "Should not be called" } }] };
          },
        },
      },
    };

    await withServer(
      { id: ownerId },
      [createQuestionsRouter(database as never, model as never)],
      async (base) => {
        const response = await request(base, "/api/questions", {
          method: "POST",
          body,
        });
        assert.equal(response.status, 400);
        assert.match((await response.json()).error, /Remove API keys/);
      },
    );

    assert.equal(database.queries.length, 0);
    assert.equal(modelCalls, 0);
  }
});