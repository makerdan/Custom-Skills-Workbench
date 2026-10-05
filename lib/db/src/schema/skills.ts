import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export interface SkillTextFile {
  path: string;
  content: string;
}

export const skillsTable = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: varchar("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("skills_owner_created_idx").on(table.ownerId, table.createdAt),
  ],
);

export const skillVersionsTable = pgTable(
  "skill_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skillsTable.id, { onDelete: "cascade" }),
    versionLabel: varchar("version_label", { length: 80 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    objectPath: text("object_path").notNull(),
    files: jsonb("files").$type<SkillTextFile[]>().notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("skill_versions_skill_label_idx").on(
      table.skillId,
      table.versionLabel,
    ),
    index("skill_versions_skill_uploaded_idx").on(
      table.skillId,
      table.uploadedAt,
    ),
  ],
);

export type Skill = typeof skillsTable.$inferSelect;
export type SkillVersion = typeof skillVersionsTable.$inferSelect;