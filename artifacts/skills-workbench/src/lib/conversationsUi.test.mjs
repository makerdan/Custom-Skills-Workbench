import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

test("conversation routes and user-visible management actions stay available", () => {
  assert.ok(appSource.includes("useListConversations()"));
  assert.ok(appSource.includes("Recent conversations"));
  assert.ok(appSource.includes("label: 'Saved conversations'"));
  assert.ok(appSource.includes("list-recent-conversations"));
  for (const route of [
    `path="/ask/:conversationId"`,
    `path="/ask"`,
    `path="/questions"`,
  ]) {
    assert.ok(appSource.includes(route), `missing conversation route: ${route}`);
  }

  for (const action of [
    "button-submit-question",
    "button-submit-follow-up",
    "button-branch-turn-",
    "button-duplicate-conversation",
    "button-rename-conversation",
    "button-reset-conversation-context",
    "button-delete-conversation",
    "button-history-duplicate-",
    "button-history-rename-",
    "button-history-reset-",
    "button-history-delete-",
  ]) {
    assert.ok(appSource.includes(action), `missing visible conversation action: ${action}`);
  }
});

test("conversation transcript, context reset, and confirm-delete feedback remain visible", () => {
  for (const state of [
    "list-conversation-turns",
    "status-context-reset",
    "Earlier turns remain visible but are excluded from future answers.",
    "The full transcript will remain visible",
    "Delete this conversation? Its branches will remain saved.",
    "status-conversation-action-error",
    "empty-conversation-history",
    "status-history-action-error",
  ]) {
    assert.ok(appSource.includes(state), `missing conversation UI state: ${state}`);
  }
});
