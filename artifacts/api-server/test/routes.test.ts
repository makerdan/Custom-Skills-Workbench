import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import {
  questionsTable,
  skillVersionsTable,
  skillsTable,
} from "@workspace/db";
import { createQuestionsRouter } from "../src/routes/questions";
import { createSkillsRouter } from "../src/routes/skills";
import { createStorageRouter } from "../src/routes/storage";
import { createWorkbenchRouter } from "../src/routes/workbench";

const ownerId = "owner-aaaaaaaa";
const otherOwnerId = "owner-bbbbbbbb";
const skillId = "10000000-0000-4000-8000-000000000001";
const otherSkillId = "20000000-0000-4000-8000-000000000002";
const firstVersionId = "30000000-0000-4000-8000-000000000003";
const secondVersionId = "40000000-0000-4000-8000-000000000004";
const savedQuestionId = "50000000-0000-4000-8000-000000000005";
const testDate = new Date("2026-01-02T03:04:05.000Z");

type User = { id: string } | null;

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
  readonly inserted: Array<{ table: string; values: Record<string, unknown> }> = [];
  skills: Array<Record<string, any>> = [];
  versions: Array<Record<string, any>> = [];
  questions: Array<Record<string, any>> = [];

  select(selection?: unknown) {
    return new MemoryQuery(this, selection);
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
        this.inserted.push({ table: getTableName(table as never), values });
        return {
          returning: async () => [
            {
              ...values,
              id: savedQuestionId,
              createdAt: testDate,
            },
          ],
        };
      },
    };
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

async function withServer(user: User, routers: unknown[], run: (base: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.isAuthenticated = () => user !== null;
    if (user) req.user = user;
    req.log = { error() {}, warn() {} } as never;
    next();
  });
  app.use("/api", ...(routers as never[]));

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
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
      await request(base, "/api/storage/objects/uploads/private.zip"),
    ];

    assert.deepEqual(
      checks.map((response) => response.status),
      [401, 401, 401, 401, 401, 401, 401],
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