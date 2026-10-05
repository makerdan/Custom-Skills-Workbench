import { GetWorkbenchSummaryResponse } from "@workspace/api-zod";
import {
  db,
  questionsTable,
  skillVersionsTable,
  skillsTable,
} from "@workspace/db";
import { and, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/workbench/summary", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [[skillTotal], [versionTotal], [questionTotal]] = await Promise.all([
    db
      .select({ value: count() })
      .from(skillsTable)
      .where(eq(skillsTable.ownerId, req.user.id)),
    db
      .select({ value: count() })
      .from(skillVersionsTable)
      .innerJoin(skillsTable, eq(skillVersionsTable.skillId, skillsTable.id))
      .where(eq(skillsTable.ownerId, req.user.id)),
    db
      .select({ value: count() })
      .from(questionsTable)
      .where(eq(questionsTable.ownerId, req.user.id)),
  ]);

  const recentQuestions = await db
    .select({
      id: questionsTable.id,
      skillId: questionsTable.skillId,
      skillName: skillsTable.name,
      skillVersionId: questionsTable.skillVersionId,
      versionLabel: skillVersionsTable.versionLabel,
      projectName: questionsTable.projectName,
      question: questionsTable.question,
      answer: questionsTable.answer,
      createdAt: questionsTable.createdAt,
    })
    .from(questionsTable)
    .innerJoin(skillsTable, eq(questionsTable.skillId, skillsTable.id))
    .innerJoin(
      skillVersionsTable,
      eq(questionsTable.skillVersionId, skillVersionsTable.id),
    )
    .where(
      and(
        eq(questionsTable.ownerId, req.user.id),
        eq(skillsTable.ownerId, req.user.id),
      ),
    )
    .orderBy(desc(questionsTable.createdAt))
    .limit(5);

  res.json(
    GetWorkbenchSummaryResponse.parse({
      skillCount: skillTotal?.value ?? 0,
      versionCount: versionTotal?.value ?? 0,
      questionCount: questionTotal?.value ?? 0,
      recentQuestions,
    }),
  );
});

export default router;