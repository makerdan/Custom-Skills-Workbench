import { questionsTable } from "../../../../lib/db/src/schema/questions.ts";
import {
  conversationTurnsTable,
  conversationsTable,
} from "../../../../lib/db/src/schema/conversations.ts";
import {
  skillVersionsTable,
  skillsTable,
  type SkillTextFile,
} from "../../../../lib/db/src/schema/skills.ts";

export {
  conversationTurnsTable,
  conversationsTable,
  questionsTable,
  skillVersionsTable,
  skillsTable,
};
export type { SkillTextFile };

// The routes are built with the same table definitions, but tests provide
// request-specific fake database instances to their router factories.
export const db = {};