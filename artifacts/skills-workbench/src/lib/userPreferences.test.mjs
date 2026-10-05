import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_USER_PREFERENCES,
  readUserPreferences,
  resetUserPreferences,
  userPreferencesStorageKey,
  validateUserPreferences,
  writeUserPreferences,
} from "./userPreferences.ts";

function createMemoryStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("preference defaults preserve the existing workbench settings", () => {
  assert.deepEqual(DEFAULT_USER_PREFERENCES, {
    appearance: "light",
    density: "comfortable",
    textSize: "standard",
    typeface: "sans",
  });
  assert.deepEqual(readUserPreferences("user-1", undefined), DEFAULT_USER_PREFERENCES);
});

test("validation accepts supported values and defaults invalid or missing fields", () => {
  assert.deepEqual(
    validateUserPreferences({
      appearance: "dark",
      density: "compact",
      textSize: "large",
      typeface: "serif",
      unrelated: true,
    }),
    {
      appearance: "dark",
      density: "compact",
      textSize: "large",
      typeface: "serif",
    },
  );
  assert.deepEqual(
    validateUserPreferences({
      appearance: "sepia",
      density: "roomy",
      textSize: 12,
      typeface: null,
    }),
    DEFAULT_USER_PREFERENCES,
  );
  assert.deepEqual(validateUserPreferences(null), DEFAULT_USER_PREFERENCES);
  assert.deepEqual(validateUserPreferences([]), DEFAULT_USER_PREFERENCES);
});

test("malformed saved JSON safely falls back to defaults", () => {
  const storage = createMemoryStorage();
  storage.setItem(userPreferencesStorageKey("user-1"), "{not json");
  assert.deepEqual(readUserPreferences("user-1", storage), DEFAULT_USER_PREFERENCES);
});

test("preferences persist under separate authenticated user keys", () => {
  const storage = createMemoryStorage();
  const customized = {
    appearance: "dark",
    density: "compact",
    textSize: "large",
    typeface: "serif",
  };

  writeUserPreferences("user/one", customized, storage);

  assert.equal(
    userPreferencesStorageKey("user/one"),
    "skills-workbench:preferences:user%2Fone",
  );
  assert.deepEqual(readUserPreferences("user/one", storage), customized);
  assert.deepEqual(readUserPreferences("user-two", storage), DEFAULT_USER_PREFERENCES);

  writeUserPreferences(
    "user-two",
    { ...DEFAULT_USER_PREFERENCES, appearance: "system" },
    storage,
  );
  assert.equal(readUserPreferences("user/one", storage).appearance, "dark");
  assert.equal(readUserPreferences("user-two", storage).appearance, "system");
});

test("reset removes only that user's stored preferences", () => {
  const storage = createMemoryStorage();
  writeUserPreferences(
    "user-1",
    { ...DEFAULT_USER_PREFERENCES, appearance: "dark" },
    storage,
  );
  writeUserPreferences(
    "user-2",
    { ...DEFAULT_USER_PREFERENCES, appearance: "system" },
    storage,
  );

  resetUserPreferences("user-1", storage);

  assert.deepEqual(readUserPreferences("user-1", storage), DEFAULT_USER_PREFERENCES);
  assert.equal(readUserPreferences("user-2", storage).appearance, "system");
});

test("browser storage failures do not break reading, saving, or resetting preferences", () => {
  const unavailableStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  assert.deepEqual(readUserPreferences("user-1", unavailableStorage), DEFAULT_USER_PREFERENCES);
  assert.doesNotThrow(() =>
    writeUserPreferences("user-1", DEFAULT_USER_PREFERENCES, unavailableStorage),
  );
  assert.doesNotThrow(() => resetUserPreferences("user-1", unavailableStorage));
});
