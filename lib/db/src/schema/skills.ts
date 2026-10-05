import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
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
    isPublic: boolean("is_public").notNull().default(false),
    publicCategory: varchar("public_category", { length: 64 }),
    publicLanguage: varchar("public_language", { length: 64 }),
    publicFramework: varchar("public_framework", { length: 80 }),
    publicUseCase: varchar("public_use_case", { length: 80 }),
    publicTags: jsonb("public_tags").$type<string[]>().notNull().default([]),
    publicCreatorLabel: varchar("public_creator_label", { length: 60 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
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
    index("skills_public_published_idx").on(table.isPublic, table.publishedAt),
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