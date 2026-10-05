import {
  CreateSkillBody,
  CreateSkillResponse,
  CreateSkillVersionBody,
  CreateSkillVersionParams,
  CreateSkillVersionResponse,
  ListSkillsResponse,
  ListSkillVersionsParams,
  ListSkillVersionsResponse,
} from "@workspace/api-zod";
import {
  db,
  skillVersionsTable,
  skillsTable,
  type SkillTextFile,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

import { ObjectStorageService } from "../lib/objectStorage";
import { toSkillDto, toSkillVersionDto } from "./skillDtos";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();
const MAX_EXTRACTED_TEXT_BYTES = 2_500_000;
const OBJECT_PATH_PATTERN = /^\/objects\/uploads\/[a-f0-9-]{36}$/i;
const TEXT_FILE_EXTENSION =
  /\.(md|mdx|txt|rst|json|ya?ml|toml|ini|cfg|py|js|jsx|ts|tsx|html|css|sh|sql|xml|go|rs|java|rb|php|c|h|cpp|vue|svelte)$/i;

function validateVersionInput(input: {
  fileName: string;
  objectPath: string;
  files: SkillTextFile[];
}): string | null {
  if (!input.fileName.toLowerCase().endsWith(".zip")) {
    return "Upload a ZIP archive.";
  }
  if (!OBJECT_PATH_PATTERN.test(input.objectPath)) {
    return "The uploaded file reference is invalid.";
  }
  if (input.files.length < 1 || input.files.length > 60) {
    return "The archive must contain between 1 and 60 supported text files.";
  }

  let totalBytes = 0;
  for (const file of input.files) {
    const path = file.path.replaceAll("\\", "/");
    if (
      path !== file.path ||
      /[\u0000-\u001f\u007f]/.test(path) ||
      path.startsWith("/") ||
      path.split("/").some((segment) => segment === "..") ||
      path.includes("\0")
    ) {
      return "The archive contains an unsafe file path.";
    }
    if (!TEXT_FILE_EXTENSION.test(path) || file.content.includes("\0")) {
      return "The archive contains a file that is not supported text.";
    }
    if (likelyContainsCredential(file.content)) {
      return "Remove passwords, API keys, tokens, or private keys from the ZIP before uploading.";
    }
    totalBytes += Buffer.byteLength(file.content, "utf8");
    if (totalBytes > MAX_EXTRACTED_TEXT_BYTES) {
      return "The extracted skill text is too large. Keep it under 2.5 MB.";
    }
  }
  if (!input.files.some((file) => file.path.split("/").at(-1)?.toLowerCase() === "skill.md")) {
    return "This ZIP does not contain a SKILL.md file.";
  }
  return null;
}

function likelyContainsCredential(value: string): boolean {
  if (
    /(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/i.test(
      value,
    )
  ) {
    return true;
  }
  for (const match of value.matchAll(
    /(?:api[_-]?key|secret(?:[_-][a-z0-9]+)*|password|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]?([A-Za-z0-9_./+=-]{12,})/gi,
  )) {
    const candidate = match[1];
    if (
      candidate &&
      !/^(?:process\.env\.|import\.meta\.env\.|your[_-]?|example|placeholder|\$[A-Z_]+|<)/i.test(
        candidate,
      )
    ) {
      return true;
    }
  }
  return false;
}

async function setPrivateOwner(objectPath: string, ownerId: string) {
  await objectStorage.trySetObjectEntityAclPolicy(objectPath, {
    owner: ownerId,
    visibility: "private",
  });
}

router.get("/skills", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const skills = await db
    .select()
    .from(skillsTable)
    .where(eq(skillsTable.ownerId, req.user.id))
    .orderBy(desc(skillsTable.updatedAt));

  const versionRows = skills.length
    ? await db
        .select({ version: skillVersionsTable })
        .from(skillVersionsTable)
        .innerJoin(skillsTable, eq(skillVersionsTable.skillId, skillsTable.id))
        .where(eq(skillsTable.ownerId, req.user.id))
        .orderBy(desc(skillVersionsTable.uploadedAt))
    : [];

  const versionsBySkill = new Map<string, typeof versionRows>();
  for (const row of versionRows) {
    const versions = versionsBySkill.get(row.version.skillId) ?? [];
    versions.push(row);
    versionsBySkill.set(row.version.skillId, versions);
  }

  res.json(
    ListSkillsResponse.parse({
      skills: skills.map((skill) =>
        toSkillDto(
          skill,
          (versionsBySkill.get(skill.id) ?? []).map((row) => row.version),
        ),
      ),
    }),
  );
});

router.post("/skills", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateSkillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const invalid = validateVersionInput(parsed.data);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }

  try {
    await setPrivateOwner(parsed.data.objectPath, req.user.id);
    const [created] = await db.transaction(async (tx) => {
      const [skill] = await tx
        .insert(skillsTable)
        .values({
          ownerId: req.user.id,
          name: parsed.data.name.trim(),
          description: parsed.data.description?.trim() || null,
        })
        .returning();
      const [version] = await tx
        .insert(skillVersionsTable)
        .values({
          skillId: skill.id,
          versionLabel: parsed.data.versionLabel.trim(),
          fileName: parsed.data.fileName,
          objectPath: parsed.data.objectPath,
          files: parsed.data.files,
        })
        .returning();
      const [updatedSkill] = await tx
        .update(skillsTable)
        .set({ currentVersionId: version.id })
        .where(eq(skillsTable.id, skill.id))
        .returning();
      return [{ skill: updatedSkill, version }];
    });
    res.status(201).json(
      CreateSkillResponse.parse(
        toSkillDto(created.skill, [created.version]),
      ),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to create skill");
    res.status(500).json({ error: "The skill could not be saved." });
  }
});

router.get("/skills/:skillId/versions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = ListSkillVersionsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [skill] = await db
    .select({ id: skillsTable.id })
    .from(skillsTable)
    .where(
      and(
        eq(skillsTable.id, parsed.data.skillId),
        eq(skillsTable.ownerId, req.user.id),
      ),
    )
    .limit(1);
  if (!skill) {
    res.status(404).json({ error: "Skill not found." });
    return;
  }
  const versions = await db
    .select()
    .from(skillVersionsTable)
    .where(eq(skillVersionsTable.skillId, skill.id))
    .orderBy(desc(skillVersionsTable.uploadedAt));
  res.json(
    ListSkillVersionsResponse.parse({
      versions: versions.map(toSkillVersionDto),
    }),
  );
});

router.post("/skills/:skillId/versions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = CreateSkillVersionParams.safeParse(req.params);
  const body = CreateSkillVersionBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const validationError = !params.success ? params.error : body.error;
    res.status(400).json({
      error: validationError?.message ?? "Invalid input.",
    });
    return;
  }
  const invalid = validateVersionInput(body.data);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }

  const [skill] = await db
    .select()
    .from(skillsTable)
    .where(
      and(
        eq(skillsTable.id, params.data.skillId),
        eq(skillsTable.ownerId, req.user.id),
      ),
    )
    .limit(1);
  if (!skill) {
    res.status(404).json({ error: "Skill not found." });
    return;
  }

  try {
    await setPrivateOwner(body.data.objectPath, req.user.id);
    const [version] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(skillVersionsTable)
        .values({
          skillId: skill.id,
          versionLabel: body.data.versionLabel.trim(),
          fileName: body.data.fileName,
          objectPath: body.data.objectPath,
          files: body.data.files,
        })
        .returning();
      await tx
        .update(skillsTable)
        .set({ currentVersionId: inserted.id, updatedAt: new Date() })
        .where(eq(skillsTable.id, skill.id));
      return [inserted];
    });
    res.status(201).json(
      CreateSkillVersionResponse.parse(toSkillVersionDto(version)),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to save skill version");
    res.status(400).json({
      error: "The version could not be saved. Check its label and try again.",
    });
  }
});

export default router;