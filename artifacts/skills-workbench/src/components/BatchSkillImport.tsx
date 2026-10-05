import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  useAnalyzeSkillDescription,
  useCreateSkill,
  useRequestUploadUrl,
} from "@workspace/api-client-react";
import type { SkillFileInput } from "@workspace/api-client-react";
import {
  AlertCircle,
  Check,
  FileArchive,
  LoaderCircle,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  readZipTextFiles,
  suggestSkillMetadataFromFilename,
} from "@/lib/skillZip";
import { runRetryableBatch } from "@/lib/skillBatch";

type RowStatus = "queued" | "uploading" | "saved" | "failed";
type BatchRow = {
  id: string;
  file: File;
  name: string;
  versionLabel: string;
  description: string;
  status: RowStatus;
  progress: number;
  error?: string;
  files?: SkillFileInput[];
  analyzing: boolean;
  analysisError?: string;
};

type BatchSkillImportProps = {
  onClose: () => void;
  onComplete: () => void;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const rowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function progressForStep(step: number) {
  return [8, 28, 66, 88, 100][step] ?? 8;
}

export default function BatchSkillImport({
  onClose,
  onComplete,
}: BatchSkillImportProps) {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [batchMessage, setBatchMessage] = useState("");
  const requestUpload = useRequestUploadUrl();
  const createSkill = useCreateSkill();
  const analyzeDescription = useAnalyzeSkillDescription();

  const updateRow = (id: string, patch: Partial<BatchRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setSelectionError("");
    if (selected.length === 0) return;

    const invalidFiles = selected.filter(
      (file) => !file.name.toLowerCase().endsWith(".zip"),
    );
    const validFiles = selected.filter((file) =>
      file.name.toLowerCase().endsWith(".zip"),
    );

    if (invalidFiles.length > 0) {
      const names = invalidFiles.map((file) => file.name).join(", ");
      setSelectionError(
        `${invalidFiles.length === 1 ? "This file is" : "These files are"} not ZIP archives and ${invalidFiles.length === 1 ? "was" : "were"} not added: ${names}`,
      );
    }

    const additions = validFiles.map((file): BatchRow => {
      const suggestion = suggestSkillMetadataFromFilename(file.name);
      return {
        id: rowId(),
        file,
        name: suggestion.name,
        versionLabel: suggestion.versionLabel,
        description: "",
        status: "queued",
        progress: 0,
        analyzing: false,
      };
    });
    if (additions.length > 0) setRows((current) => [...current, ...additions]);
  };

  const analyzeRow = async (row: BatchRow) => {
    updateRow(row.id, { analyzing: true, analysisError: undefined });
    try {
      const files = await readZipTextFiles(row.file);
      const result = await analyzeDescription.mutateAsync({ data: { files } });
      setRows((current) =>
        current.map((currentRow) =>
          currentRow.id === row.id
            ? {
                ...currentRow,
                files,
                description: result.description,
                analyzing: false,
                analysisError: undefined,
              }
            : currentRow,
        ),
      );
    } catch (error) {
      updateRow(row.id, {
        analyzing: false,
        analysisError: errorMessage(
          error,
          "Description analysis could not finish. Try again.",
        ),
      });
    }
  };

  const processRows = async (targetIds: string[]) => {
    if (targetIds.length === 0 || submitting) return;
    setSubmitting(true);
    setBatchMessage(
      `Preparing ${targetIds.length} ${targetIds.length === 1 ? "archive" : "archives"} for import. Up to three uploads run at once.`,
    );

    try {
      const targetRows = rows.filter((row) => targetIds.includes(row.id));
      const results = await runRetryableBatch(
        targetRows,
        3,
        async (row) => {
          updateRow(row.id, {
            progress: progressForStep(0),
            error: undefined,
          });
          const files = row.files ?? (await readZipTextFiles(row.file));
          updateRow(row.id, { files, progress: progressForStep(1) });

          const signed = await requestUpload.mutateAsync({
            data: {
              name: row.file.name,
              size: row.file.size,
              contentType: "application/zip",
            },
          });
          updateRow(row.id, { progress: progressForStep(2) });

          const response = await fetch(signed.uploadURL, {
            method: "PUT",
            headers: { "Content-Type": "application/zip" },
            body: row.file,
          });
          if (!response.ok) {
            throw new Error("The ZIP upload did not finish. Please try again.");
          }
          updateRow(row.id, { progress: progressForStep(3) });

          await createSkill.mutateAsync({
            data: {
              name: row.name.trim(),
              description: row.description.trim() || undefined,
              versionLabel: row.versionLabel.trim(),
              fileName: row.file.name,
              objectPath: signed.objectPath,
              files,
            },
          });
          updateRow(row.id, { progress: progressForStep(4) });
        },
        (row, status, error) => {
          updateRow(row.id, {
            status,
            error:
              status === "failed"
                ? errorMessage(error, "This archive could not be imported.")
                : undefined,
          });
        },
      );
      const succeeded = results.filter((result) => result.status === "saved").length;
      const failed = results.filter((result) => result.status === "failed").length;
      setBatchMessage(
        `Import pass finished: ${succeeded} saved, ${failed} failed.`,
      );
    } finally {
      setSubmitting(false);
      onComplete();
    }
  };

  const queuedRows = rows.filter((row) => row.status === "queued");
  const failedRows = rows.filter((row) => row.status === "failed");
  const savedCount = rows.filter((row) => row.status === "saved").length;
  const activeCount = rows.filter((row) => row.status === "uploading").length;
  const analysisActive = rows.some((row) => row.analyzing);

  const submitQueued = () => {
    void processRows(queuedRows.map((row) => row.id));
  };
  const retryFailed = () => {
    void processRows(failedRows.map((row) => row.id));
  };

  return (
    <section
      className="panel page-enter overflow-hidden"
      aria-labelledby="batch-import-title"
      data-testid="panel-batch-skill-import"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow">Skill library · batch import</p>
          <h2
            id="batch-import-title"
            className="display mt-1 text-2xl sm:text-3xl"
          >
            Bring in a few skills.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Each ZIP becomes its own skill and keeps its exact uploaded version.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting || analysisActive}
          aria-label="Close batch import"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="button-close-batch-import"
        >
          <X size={18} />
        </button>
      </header>

      <div className="space-y-5 p-5 sm:p-7">
        <label
          className={`group flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-[hsl(var(--input))] bg-[hsl(var(--background)/.5)] px-5 py-6 text-center transition-colors hover:border-primary/60 hover:bg-accent/20 ${
            submitting ? "pointer-events-none opacity-55" : ""
          }`}
          data-testid="dropzone-batch-skill-zips"
        >
          <input
            type="file"
            accept=".zip,application/zip"
            multiple
            className="sr-only"
            onChange={handleFiles}
            disabled={submitting}
            data-testid="input-batch-skill-zips"
          />
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/65 text-primary transition-transform group-hover:-translate-y-0.5">
            <Upload size={19} />
          </span>
          <span className="mt-3 text-sm font-semibold">
            Choose ZIP archives
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Select multiple archives to review them before importing
          </span>
        </label>

        {selectionError && (
          <p
            role="alert"
            className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive"
            data-testid="status-batch-selection-error"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {selectionError}
          </p>
        )}

        {rows.length > 0 ? (
          <div className="space-y-3" data-testid="list-batch-skill-rows">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow">Review each archive</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "archive" : "archives"} ·{" "}
                  {savedCount} saved
                  {failedRows.length > 0 ? ` · ${failedRows.length} need attention` : ""}
                </p>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                MAX 3 IN PARALLEL
              </span>
            </div>

            {rows.map((row, index) => {
              const editable = !submitting && row.status !== "saved" && !row.analyzing;
              const statusLabel =
                row.status === "uploading"
                  ? "Importing"
                  : row.status === "saved"
                    ? "Saved"
                    : row.status === "failed"
                      ? "Failed"
                      : "Ready";
              return (
                <article
                  key={row.id}
                  className="rounded-xl border border-border bg-[hsl(var(--background)/.45)] p-4 sm:p-5"
                  data-testid={`row-batch-skill-${row.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/45 text-primary">
                      <FileArchive size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className="truncate text-sm font-semibold"
                          title={row.file.name}
                          data-testid={`text-batch-file-${row.id}`}
                        >
                          {row.file.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                            row.status === "saved"
                              ? "bg-primary/10 text-primary"
                              : row.status === "failed"
                                ? "bg-destructive/10 text-destructive"
                                : row.status === "uploading"
                                  ? "bg-accent/50 text-accent-foreground"
                                  : "bg-muted text-muted-foreground"
                          }`}
                          role="status"
                          data-testid={`status-batch-row-${row.id}`}
                          data-status={row.status}
                        >
                          {row.status === "uploading" && (
                            <LoaderCircle size={11} className="animate-spin" />
                          )}
                          {row.status === "saved" && <Check size={11} />}
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {(row.file.size / 1024 / 1024).toFixed(2)} MB
                        {row.status === "uploading" ? ` · ${row.progress}%` : ""}
                      </p>
                    </div>
                    {!submitting && row.status !== "saved" && (
                      <button
                        type="button"
                        onClick={() =>
                          setRows((current) =>
                            current.filter((candidate) => candidate.id !== row.id),
                          )
                        }
                        aria-label={`Remove ${row.file.name}`}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`button-remove-batch-row-${row.id}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold">
                      Skill name
                      <input
                        className="field mt-1.5 py-2.5 text-sm font-normal"
                        value={row.name}
                        onChange={(event) =>
                          updateRow(row.id, { name: event.currentTarget.value })
                        }
                        maxLength={120}
                        required
                        disabled={!editable}
                        data-testid={`input-batch-name-${row.id}`}
                      />
                    </label>
                    <label className="text-xs font-semibold">
                      Version label
                      <input
                        className="field mt-1.5 py-2.5 text-sm font-normal"
                        value={row.versionLabel}
                        onChange={(event) =>
                          updateRow(row.id, {
                            versionLabel: event.currentTarget.value,
                          })
                        }
                        maxLength={80}
                        required
                        disabled={!editable}
                        data-testid={`input-batch-version-${row.id}`}
                      />
                    </label>
                    <label className="text-xs font-semibold sm:col-span-2">
                      Description{" "}
                      <span className="font-normal text-muted-foreground">
                        optional
                      </span>
                      <textarea
                        className="field mt-1.5 min-h-[76px] resize-y text-sm font-normal"
                        value={row.description}
                        onChange={(event) =>
                          updateRow(row.id, {
                            description: event.currentTarget.value,
                          })
                        }
                        maxLength={1000}
                        placeholder="What this skill helps you build"
                        disabled={!editable}
                        data-testid={`input-batch-description-${row.id}`}
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-h-8 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void analyzeRow(row)}
                        disabled={submitting || row.status === "saved" || row.analyzing}
                        className="btn-subtle !px-2.5 !py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
                        data-testid={`button-auto-analyze-${row.id}`}
                      >
                        {row.analyzing ? (
                          <LoaderCircle size={13} className="animate-spin" />
                        ) : (
                          <Sparkles size={13} />
                        )}
                        {row.analyzing ? "Analyzing…" : "Auto-Analyze"}
                      </button>
                      {row.analysisError && (
                        <span
                          className="text-[11px] text-destructive"
                          role="status"
                          data-testid={`status-analysis-error-${row.id}`}
                        >
                          {row.analysisError}
                        </span>
                      )}
                    </div>
                    {row.status === "uploading" && (
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:w-36"
                        aria-label={`Import progress ${row.progress}%`}
                        data-testid={`progress-batch-row-${row.id}`}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-300"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {row.error && (
                    <p
                      className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
                      role="alert"
                      data-testid={`status-row-error-${row.id}`}
                    >
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      {row.error}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-xl border border-border bg-[hsl(var(--background)/.45)] px-5 py-8 text-center"
            data-testid="empty-batch-import"
          >
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
              <FileArchive size={18} />
            </span>
            <p className="mt-3 text-sm font-semibold">No archives selected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose ZIPs to review their names and versions before import.
            </p>
          </div>
        )}

        <p
          className="min-h-5 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="status-batch-progress"
          data-status={submitting ? "uploading" : failedRows.length ? "attention" : "idle"}
        >
          {submitting
            ? `Importing ${activeCount} ${activeCount === 1 ? "archive" : "archives"} now. ${savedCount} saved so far.`
            : batchMessage}
        </p>

        <footer className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || analysisActive}
            className="btn-subtle"
            data-testid="button-cancel-batch-import"
          >
            Close
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {failedRows.length > 0 && queuedRows.length > 0 && (
              <button
                type="button"
                onClick={retryFailed}
                disabled={submitting || analysisActive}
                className="btn-subtle"
                data-testid="button-retry-failed-batch"
              >
                Retry failed ({failedRows.length})
              </button>
            )}
            {(queuedRows.length > 0 || failedRows.length > 0) && (
              <button
                type="button"
                onClick={queuedRows.length > 0 ? submitQueued : retryFailed}
                disabled={submitting || analysisActive}
                className="btn-primary"
                data-testid="button-submit-batch-import"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Importing…
                  </>
                ) : queuedRows.length > 0 ? (
                  <>
                    <Upload size={15} />
                    Import {queuedRows.length}{" "}
                    {queuedRows.length === 1 ? "skill" : "skills"}
                  </>
                ) : (
                  <>
                    <AlertCircle size={15} />
                    Retry failed ({failedRows.length})
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}