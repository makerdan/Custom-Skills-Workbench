import assert from "node:assert/strict";
import { test } from "node:test";
import { runRetryableBatch } from "./skillBatch.ts";

test("batch processing isolates failures, bounds concurrency, and skips saved rows on retry", async () => {
  const rows = [
    { id: "will-fail", status: "queued" },
    { id: "will-save", status: "queued" },
    { id: "already-saved", status: "saved" },
  ];
  const calls = [];
  let active = 0;
  let maxActive = 0;

  const run = async () =>
    runRetryableBatch(
      rows,
      2,
      async (row) => {
        calls.push(row.id);
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
        if (row.id === "will-fail" && calls.filter((id) => id === row.id).length === 1) {
          throw new Error("temporary upload failure");
        }
        return `${row.id} saved`;
      },
      (row, status) => {
        row.status = status;
      },
    );

  const firstPass = await run();
  assert.deepEqual(
    firstPass.map((result) => result.status).sort(),
    ["failed", "saved"],
  );
  assert.deepEqual(rows.map((row) => row.status), ["failed", "saved", "saved"]);
  assert.ok(maxActive <= 2);

  const secondPass = await run();
  assert.deepEqual(secondPass.map((result) => result.item.id), ["will-fail"]);
  assert.deepEqual(calls, ["will-fail", "will-save", "will-fail"]);
  assert.deepEqual(rows.map((row) => row.status), ["saved", "saved", "saved"]);
});

test("batch concurrency must be a positive integer", async () => {
  await assert.rejects(
    runRetryableBatch([], 0, async () => undefined, () => {}),
    /positive integer/,
  );
});