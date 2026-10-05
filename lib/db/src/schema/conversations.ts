import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { questionsTable } from "./questions";
import { skillVersionsTable, skillsTable } from "./skills";

export const conversationsTable = pgTable(
  "skill_conversations",
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
    title: varchar("title", { length: 160 }).notNull(),
    parentConversationId: uuid("parent_conversation_id").references(
      (): AnyPgColumn => conversationsTable.id,
      { onDelete: "set null" },
    ),
    branchFromSequence: integer("branch_from_sequence"),
    contextStartSequence: integer("context_start_sequence").notNull().default(0),
    legacyQuestionId: uuid("legacy_question_id").references(
      () => questionsTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("skill_conversations_owner_updated_idx").on(
      table.ownerId,
      table.updatedAt,
    ),
    index("skill_conversations_parent_idx").on(table.parentConversationId),
    uniqueIndex("skill_conversations_legacy_question_idx").on(
      table.legacyQuestionId,
    ),
  ],
);

export const conversationTurnsTable = pgTable(
  "skill_conversation_turns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    codeContext: text("code_context"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("skill_conversation_turn_sequence_idx").on(
      table.conversationId,
      table.sequence,
    ),
    index("skill_conversation_turns_conversation_idx").on(
      table.conversationId,
      table.sequence,
    ),
  ],
);

export type Conversation = typeof conversationsTable.$inferSelect;
export type ConversationTurn = typeof conversationTurnsTable.$inferSelect;
