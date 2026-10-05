import assert from "node:assert/strict";
import { test } from "node:test";
import { readZipTextFiles } from "./skillZip.ts";

const encoder = new TextEncoder();

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
  const localRecords = [];
  const centralRecords = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content ?? "");
    const flags = entry.flags ?? 0;
    const method = entry.method ?? 0;
    const checksum =
      (crc32(data) ^ (entry.corruptCrc ? 1 : 0)) >>> 0;

    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, flags, true);
    localView.setUint16(8, method, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    localRecords.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, entry.unixMode === undefined ? 20 : (3 << 8) | 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, flags, true);
    centralView.setUint16(10, method, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(
      38,
      entry.unixMode === undefined ? 0 : (entry.unixMode * 0x10000) >>> 0,
      true,
    );
    centralView.setUint32(42, localOffset, true);
    central.set(name, 46);
    centralRecords.push(central);
    localOffset += local.length;
  }

  const localData = concatenate(localRecords);
  const centralData = concatenate(centralRecords);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralData.length, true);
  endView.setUint32(16, localData.length, true);
  return new File([concatenate([localData, centralData, end])], "skill.zip", {
    type: "application/zip",
  });
}

function concatenate(chunks) {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

const skillFile = (content = "# Example skill\nFollow the project rules.") => ({
  name: "SKILL.md",
  content,
});

test("reads a valid SKILL.md archive and supported text files", async () => {
  const files = await readZipTextFiles(
    createZip([
      skillFile(),
      { name: "references/setup.md", content: "Install the required packages." },
      { name: "assets/logo.png", content: "ignored non-text content" },
    ]),
  );

  assert.deepEqual(files, [
    { path: "SKILL.md", content: "# Example skill\nFollow the project rules." },
    {
      path: "references/setup.md",
      content: "Install the required packages.",
    },
  ]);
});

test("rejects a ZIP without SKILL.md", async () => {
  await assert.rejects(
    readZipTextFiles(createZip([{ name: "README.md", content: "Not a skill." }])),
    /does not contain a SKILL\.md/,
  );
});

test("rejects traversal, absolute, and drive-prefixed paths", async (t) => {
  for (const name of ["../escape.md", "/absolute.md", "C:\\outside.md"]) {
    await t.test(name, async () => {
      await assert.rejects(
        readZipTextFiles(createZip([skillFile(), { name, content: "unsafe" }])),
        /unsafe or unreadable file path/,
      );
    });
  }
});

test("rejects duplicate text-file paths, including case-only duplicates", async () => {
  await assert.rejects(
    readZipTextFiles(
      createZip([
        skillFile(),
        { name: "skill.md", content: "# Duplicate path" },
      ]),
    ),
    /duplicate text-file paths/,
  );
});

test("rejects symbolic links and encrypted supported entries", async (t) => {
  await t.test("symbolic link", async () => {
    await assert.rejects(
      readZipTextFiles(
        createZip([
          skillFile(),
          { name: "references/link.md", content: "target", unixMode: 0o120777 },
        ]),
      ),
      /symbolic link/,
    );
  });

  await t.test("encrypted entry", async () => {
    await assert.rejects(
      readZipTextFiles(
        createZip([skillFile(), { name: "secret.md", content: "secret", flags: 1 }]),
      ),
      /Password-protected ZIP entries/,
    );
  });
});

test("rejects archives that exceed entry, text-file-count, per-file, or total-text limits", async (t) => {
  await t.test("central directory entry count", async () => {
    await assert.rejects(
      readZipTextFiles(
        createZip(
          Array.from({ length: 257 }, (_, index) => ({
            name: `ignored-${index}.bin`,
          })),
        ),
      ),
      /archive limits/,
    );
  });

  await t.test("supported text-file count", async () => {
    await assert.rejects(
      readZipTextFiles(
        createZip([
          skillFile(),
          ...Array.from({ length: 60 }, (_, index) => ({
            name: `notes-${index}.md`,
            content: "notes",
          })),
        ]),
      ),
      /more than 60 supported text files/,
    );
  });

  await t.test("single text-file size", async () => {
    await assert.rejects(
      readZipTextFiles(
        createZip([skillFile("x".repeat(200_001))]),
      ),
      /200 KB per-file limit/,
    );
  });

  await t.test("combined extracted text size", async () => {
    await assert.rejects(
      readZipTextFiles(
        createZip([
          skillFile("x".repeat(200_000)),
          ...Array.from({ length: 12 }, (_, index) => ({
            name: `notes-${index}.md`,
            content: "y".repeat(200_000),
          })),
        ]),
      ),
      /under 2\.5 MB/,
    );
  });

  await t.test("archive upload size", async () => {
    const oversized = {
      name: "large.zip",
      size: 20 * 1024 * 1024 + 1,
      arrayBuffer: async () => {
        throw new Error("The file should be rejected before reading.");
      },
    };
    await assert.rejects(
      readZipTextFiles(oversized),
      /20 MB or smaller/,
    );
  });
});

test("rejects CRC failures", async () => {
  await assert.rejects(
    readZipTextFiles(
      createZip([{ ...skillFile(), corruptCrc: true }]),
    ),
    /failed its integrity check/,
  );
});

test("rejects common credential formats in archive contents", async (t) => {
  const credentials = [
    `OPENAI_API_KEY=sk-proj-${"a".repeat(28)}`,
    `GitHub token: ghp_${"b".repeat(24)}`,
    `aws_secret_access_key=${"c".repeat(32)}`,
    "password=correct-horse-battery-staple",
    "-----BEGIN RSA PRIVATE KEY-----",
  ];

  for (const secret of credentials) {
    await t.test(secret.slice(0, 18), async () => {
      await assert.rejects(
        readZipTextFiles(createZip([skillFile(secret)])),
        /Remove passwords, API keys, tokens, or private keys/,
      );
    });
  }
});

test("allows documented credential placeholders", async () => {
  const files = await readZipTextFiles(
    createZip([skillFile("Set api_key=your_api_key_here in your environment.")]),
  );
  assert.equal(files.length, 1);
});