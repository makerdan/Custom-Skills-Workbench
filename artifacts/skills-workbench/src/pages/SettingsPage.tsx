import { CaseSensitive, Check, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { UserPreferences } from "@/lib/userPreferences";

type SettingsPageProps = {
  preferences: UserPreferences;
  onPreferenceChange: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => void;
  onReset: () => void;
};

type Choice<T extends string> = {
  value: T;
  label: string;
  detail: string;
  icon?: ReactNode;
};

function PreferenceGroup<T extends string>({
  id,
  title,
  description,
  value,
  choices,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  value: T;
  choices: Choice<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0" aria-describedby={`${id}-description`}>
      <legend className="text-sm font-semibold tracking-tight">{title}</legend>
      <p id={`${id}-description`} className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {choices.map((choice) => {
          const selected = value === choice.value;
          return (
            <label
              key={choice.value}
              className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background ${
                selected
                  ? "border-primary/50 bg-accent/35"
                  : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/35"
              }`}
              data-testid={`choice-${id}-${choice.value}`}
            >
              <input
                type="radio"
                name={id}
                value={choice.value}
                checked={selected}
                onChange={() => onChange(choice.value)}
                className="sr-only"
                data-testid={`radio-${id}-${choice.value}`}
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {choice.icon ?? <span className="text-xs font-semibold">{choice.label.slice(0, 1)}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">{choice.label}</span>
                <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                  {choice.detail}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                }`}
              >
                {selected && <Check size={10} strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function SettingsPage({
  preferences,
  onPreferenceChange,
  onReset,
}: SettingsPageProps) {
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const previewDark =
    preferences.appearance === "dark" ||
    (preferences.appearance === "system" && systemDark);
  const previewSerif = preferences.typeface === "serif";
  const previewTextSize =
    preferences.textSize === "small"
      ? "text-[11px]"
      : preferences.textSize === "large"
        ? "text-[15px]"
        : "text-[13px]";
  const previewSpace = preferences.density === "compact" ? "p-3" : "p-5";

  return (
    <section className="page-enter" data-testid="page-settings">
      <header className="mb-8 border-b border-border/80 pb-8 pt-11">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Personal workspace</p>
            <h1 className="display mt-2 text-[40px] leading-[1.04] sm:text-[48px]">
              Your settings.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Set up a reading space that feels right for the work you do here.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="btn-subtle"
            data-testid="button-reset-preferences"
          >
            <RotateCcw size={14} />
            Reset to defaults
          </button>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(330px,.88fr)]">
        <div className="panel divide-y divide-border px-5 sm:px-7" data-testid="settings-preferences">
          <div className="py-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/55 text-primary">
                <Sun size={17} />
              </span>
              <div>
                <h2 className="display text-2xl">Appearance & reading</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  These preferences apply to your workbench on this device.
                </p>
              </div>
            </div>
            <div className="space-y-7">
              <PreferenceGroup
                id="appearance"
                title="Appearance"
                description="Choose a steady theme or follow your device setting."
                value={preferences.appearance}
                onChange={(value) => onPreferenceChange("appearance", value)}
                choices={[
                  { value: "light", label: "Light", detail: "A bright, paper-like workspace.", icon: <Sun size={15} /> },
                  { value: "dark", label: "Dark", detail: "A low-light workspace.", icon: <Moon size={15} /> },
                  { value: "system", label: "System", detail: "Match your device appearance.", icon: <Monitor size={15} /> },
                ]}
              />
              <PreferenceGroup
                id="density"
                title="Layout density"
                description="Adjust the breathing room around lists and panels."
                value={preferences.density}
                onChange={(value) => onPreferenceChange("density", value)}
                choices={[
                  { value: "comfortable", label: "Comfortable", detail: "More room between items." },
                  { value: "compact", label: "Compact", detail: "Fit more into each view." },
                ]}
              />
              <PreferenceGroup
                id="text-size"
                title="Text size"
                description="Set the reading size used across your workspace."
                value={preferences.textSize}
                onChange={(value) => onPreferenceChange("textSize", value)}
                choices={[
                  { value: "small", label: "Small", detail: "A little more on screen." },
                  { value: "standard", label: "Standard", detail: "The balanced default." },
                  { value: "large", label: "Large", detail: "A more generous reading size." },
                ]}
              />
              <PreferenceGroup
                id="typeface"
                title="Typeface"
                description="Choose the voice of your notes and answers."
                value={preferences.typeface}
                onChange={(value) => onPreferenceChange("typeface", value)}
                choices={[
                  { value: "sans", label: "Sans serif", detail: "Clear and practical.", icon: <CaseSensitive size={16} /> },
                  { value: "serif", label: "Serif", detail: "A more editorial reading feel.", icon: <span className="font-serif text-base">Aa</span> },
                ]}
              />
            </div>
          </div>
          <div className="flex items-start gap-2.5 py-4 text-[11px] leading-5 text-muted-foreground">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
            <p>Settings are personal to your workbench. They don’t change the skill versions you’ve uploaded.</p>
          </div>
        </div>

        <aside className="xl:sticky xl:top-6" aria-labelledby="preview-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Live preview</p>
              <h2 id="preview-title" className="display mt-1 text-2xl">A sample reading view</h2>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground" data-testid="text-preview-mode">
              {preferences.appearance}
            </span>
          </div>
          <div
            className={`overflow-hidden rounded-2xl border shadow-sm transition-colors ${
              previewDark ? "border-[#344b47] bg-[#18302d] text-[#f1eee2]" : "border-border bg-[#fbfaf5] text-[#243b38]"
            }`}
            data-testid="settings-preview"
            aria-live="polite"
          >
            <div className={`flex items-center justify-between border-b ${previewDark ? "border-white/10" : "border-[#e5e1d6]"} px-4 py-3`}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${previewDark ? "bg-[#c8d990]" : "bg-[#647b48]"}`} />
                <span className="font-mono text-[9px] uppercase tracking-[.14em] opacity-65">Answer · v2.3.1</span>
              </div>
              <span className="font-mono text-[9px] opacity-50">SKILL CONTEXT</span>
            </div>
            <div className={previewSpace}>
              <p className={`font-mono text-[9px] uppercase tracking-[.13em] ${previewDark ? "text-[#c8d990]" : "text-[#5d7047]"}`}>
                From your uploaded skill
              </p>
              <h3 className={`mt-2 text-xl leading-tight tracking-tight ${previewSerif ? "font-serif" : "font-sans font-semibold"}`}>
                Keep the source close.
              </h3>
              <p className={`mt-3 leading-[1.75] opacity-80 ${previewTextSize} ${previewSerif ? "font-serif" : "font-sans"}`} data-testid="text-preview-sample">
                The implementation follows the patterns in your selected version. When behavior differs between releases, check the uploaded files before adapting the example.
              </p>
              <div className={`mt-4 flex items-center gap-2 border-t pt-3 font-mono text-[9px] ${previewDark ? "border-white/10 opacity-65" : "border-[#e5e1d6] opacity-60"}`}>
                <span className="rounded bg-black/5 px-1.5 py-1 dark:bg-white/10">src/patterns.md</span>
                <span>line 18</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground" data-testid="text-preview-description">
            Preview updates as you change appearance, spacing, and type.
          </p>
        </aside>
      </div>
    </section>
  );
}
