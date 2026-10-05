export type BatchWorkStatus = "uploading" | "saved" | "failed";

export type BatchWorkResult<T, TResult> =
  | { item: T; status: "saved"; value: TResult }
  | { item: T; status: "failed"; error: unknown };

export async function runRetryableBatch<
  T extends { status: string },
  TResult,
>(
  items: readonly T[],
  concurrency: number,
  process: (item: T) => Promise<TResult>,
  onStatus: (item: T, status: BatchWorkStatus, error?: unknown) => void,
): Promise<BatchWorkResult<T, TResult>[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("Batch concurrency must be a positive integer.");
  }

  const eligible = items.filter(
    (item) => item.status !== "saved" && item.status !== "uploading",
  );
  const results: BatchWorkResult<T, TResult>[] = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < eligible.length) {
      const item = eligible[cursor];
      cursor += 1;
      if (!item) continue;

      onStatus(item, "uploading");
      try {
        const value = await process(item);
        const result: BatchWorkResult<T, TResult> = {
          item,
          status: "saved",
          value,
        };
        results.push(result);
        onStatus(item, "saved");
      } catch (error) {
        const result: BatchWorkResult<T, TResult> = {
          item,
          status: "failed",
          error,
        };
        results.push(result);
        onStatus(item, "failed", error);
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, eligible.length) },
      () => worker(),
    ),
  );
  return results;
}