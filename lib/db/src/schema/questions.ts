import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { skillVersionsTable, skillsTable } from "./skills";

export const questionsTable = pgTable(
  "skill_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: varchar("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skillsTable.id, { onDelete: "cascade" }),
    skillVersionId: uuid("skill_version_id")
      .notNull()
      .references(() => skillVersionsTable.id, { onDelete: "cascade" }),
    projectName: varchar("project_name", { length: 120 }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("skill_questions_owner_created_idx").on(
      table.ownerId,
      table.createdAt,
    ),
    index("skill_questions_version_idx").on(table.skillVersionId),
  ],
);

export type SkillQuestion = typeof questionsTable.$inferSelect;