export const USER_PREFERENCES_KEY_PREFIX = "skills-workbench:preferences:";

export const DEFAULT_USER_PREFERENCES = {
  appearance: "light",
  density: "comfortable",
  textSize: "standard",
  typeface: "sans",
} as const;

export type AppearancePreference = "light" | "dark" | "system";
export type DensityPreference = "comfortable" | "compact";
export type TextSizePreference = "small" | "standard" | "large";
export type TypefacePreference = "sans" | "serif";

export interface UserPreferences {
  appearance: AppearancePreference;
  density: DensityPreference;
  textSize: TextSizePreference;
  typeface: TypefacePreference;
}

export type PreferenceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(): PreferenceStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function userPreferencesStorageKey(userId: string): string {
  return `${USER_PREFERENCES_KEY_PREFIX}${encodeURIComponent(userId)}`;
}

export function validateUserPreferences(value: unknown): UserPreferences {
  const candidate =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    appearance:
      candidate.appearance === "dark" || candidate.appearance === "system"
        ? candidate.appearance
        : DEFAULT_USER_PREFERENCES.appearance,
    density:
      candidate.density === "compact"
        ? candidate.density
        : DEFAULT_USER_PREFERENCES.density,
    textSize:
      candidate.textSize === "small" || candidate.textSize === "large"
        ? candidate.textSize
        : DEFAULT_USER_PREFERENCES.textSize,
    typeface:
      candidate.typeface === "serif"
        ? candidate.typeface
        : DEFAULT_USER_PREFERENCES.typeface,
  };
}

export function readUserPreferences(
  userId: string,
  storage: PreferenceStorage | undefined = getBrowserStorage(),
): UserPreferences {
  if (!userId || !storage) return { ...DEFAULT_USER_PREFERENCES };

  try {
    const stored = storage.getItem(userPreferencesStorageKey(userId));
    if (stored === null) return { ...DEFAULT_USER_PREFERENCES };
    return validateUserPreferences(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function writeUserPreferences(
  userId: string,
  preferences: UserPreferences,
  storage: PreferenceStorage | undefined = getBrowserStorage(),
): void {
  if (!userId || !storage) return;

  try {
    storage.setItem(
      userPreferencesStorageKey(userId),
      JSON.stringify(validateUserPreferences(preferences)),
    );
  } catch {
    // Preferences are best-effort browser state; unavailable storage must not block the app.
  }
}

export function resetUserPreferences(
  userId: string,
  storage: PreferenceStorage | undefined = getBrowserStorage(),
): void {
  if (!userId || !storage) return;

  try {
    storage.removeItem(userPreferencesStorageKey(userId));
  } catch {
    // Keep the in-memory defaults even if browser storage is unavailable.
  }
}
