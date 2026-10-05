import type { SkillFileInput } from "@workspace/api-client-react";

const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;
const MAX_ENTRIES = 256;
const MAX_TEXT_FILES = 60;
const MAX_FILE_BYTES = 200_000;
const MAX_TOTAL_TEXT_BYTES = 2_500_000;
const TEXT_FILE_EXTENSION =
  /\.(md|mdx|txt|rst|json|ya?ml|toml|ini|cfg|py|js|jsx|ts|tsx|html|css|sh|sql|xml|go|rs|java|rb|php|c|h|cpp|vue|svelte)$/i;
const decoder = new TextDecoder("utf-8", { fatal: true });
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < table.length; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[n] = value >>> 0;
  }
  return table;
})();

export function suggestSkillMetadataFromFilename(fileName: string): {
  name: string;
  versionLabel: string;
} {
  const stem = fileName.replace(/\.zip$/i, "").trim();
  const versionPattern =
    /(^|[\s._-])(?:(?:version|ver)[\s._-]*|v)(\d+(?:\.\d+){0,2}(?:-(?:alpha|beta|rc|dev|preview|build)[\w.-]*)?(?:\+[\w.-]+)?|alpha|beta\d*|rc\d*|dev|preview|stable|release|nightly)(?=$|[\s._-])|(^|[\s._-])(\d+\.\d+(?:\.\d+)?(?:-(?:alpha|beta|rc|dev|preview|build)[\w.-]*)?(?:\+[\w.-]+)?)(?=$|[\s._-])|(^|[\s._-])(alpha|beta\d*|rc\d*|dev|preview|stable|release|nightly)(?=$|[\s._-])/i;
  const datePattern = /(^|[\s._-])(\d{4}-\d{2}-\d{2}|\d{8})(?=$|[\s._-])/g;
  const dates = Array.from(stem.matchAll(datePattern), (match) => {
    const token = match[2]!;
    const start = match.index + match[1]!.length;
    return {
      start,
      end: start + token.length,
      token,
      normalized: normalizeFilenameDate(token),
    };
  }).filter(
    (
      date,
    ): date is (typeof date) & {
      normalized: string;
    } => date.normalized !== null,
  );
  const versionMatches = Array.from(
    stem.matchAll(new RegExp(versionPattern.source, "gi")),
  );
  const explicitVersionMatches = versionMatches.filter((match) => {
    const value = match[2] || match[4] || match[6];
    if (!value || match.index === undefined) return false;
    const valueStart = match.index + match[0].indexOf(value);
    const overlapsDate = dates.some(
      (date) => valueStart >= date.start && valueStart + value.length <= date.end,
    );
    if (!overlapsDate) return true;

    const prefix = match[0].slice(0, match[0].indexOf(value));
    return /(?:version|ver|v)[\s._-]*$/i.test(prefix);
  });
  const match = explicitVersionMatches[0] ?? null;
  const selectedDate = match ? null : dates[0] ?? null;
  const versionLabel = match
    ? match[2] || match[4] || match[6] || "1.0.0"
    : selectedDate?.normalized ?? "1.0.0";
  const remaining = match
    ? `${stem.slice(0, match.index)} ${stem.slice(match.index + match[0].length)}`
    : selectedDate
      ? `${stem.slice(0, selectedDate.start)} ${stem.slice(selectedDate.end)}`
      : stem;
  const name = remaining
    .replace(/[\s._-]+/g, " ")
    .trim()
    .slice(0, 120);

  return {
    name: name || "New skill",
    versionLabel: versionLabel.slice(0, 80),
  };
}

function normalizeFilenameDate(token: string): string | null {
  const parts =
    token.length === 8
      ? [token.slice(0, 4), token.slice(4, 6), token.slice(6, 8)]
      : token.split("-");
  const [yearText, monthText, dayText] = parts;
  if (!yearText || !monthText || !dayText) return null;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  if (
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12 ||
    !daysInMonth ||
    day < 1 ||
    day > daysInMonth
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
}

function crc32(data: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of data) {
    value = CRC_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function readBoundedStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    const readNext = () => {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            const result = new Uint8Array(size);
            let offset = 0;
            for (const chunk of chunks) {
              result.set(chunk, offset);
              offset += chunk.byteLength;
            }
            resolve(result);
            return;
          }
          size += value.byteLength;
          if (size > maxBytes) {
            void reader.cancel();
            reject(new Error("An archive file expands beyond the 200 KB limit."));
            return;
          }
          chunks.push(value);
          readNext();
        })
        .catch(reject);
    };

    readNext();
  });
}

function assertSafePath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    /^[a-z]:/i.test(normalized) ||
    normalized.includes("\0") ||
    normalized.split("/").some((part) => part === "..") ||
    normalized.includes("\ufffd")
  ) {
    throw new Error("The ZIP contains an unsafe or unreadable file path.");
  }
  return normalized;
}

function looksLikeCredential(value: string): boolean {
  if (
    /(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/i.test(
      value,
    )
  ) {
    return true;
  }
  const assignments = value.matchAll(
    /(?:api[_-]?key|secret(?:[_-][a-z0-9]+)*|password|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]?([A-Za-z0-9_./+=-]{12,})/gi,
  );
  for (const match of assignments) {
    const candidate = match[1];
    if (
      candidate &&
      !/^(?:process\.env\.|import\.meta\.env\.|your[_-]?|example|placeholder|\$[A-Z_]+|<)/i.test(
        candidate,
      )
    ) {
      return true;
    }
  }
  return false;
}

async function decompressEntry(
  method: number,
  compressed: Uint8Array,
): Promise<Uint8Array> {
  if (method === 0) return compressed;
  if (method !== 8) {
    throw new Error("The ZIP uses a compression method this app cannot read.");
  }
  const stream = new Blob([compressed.slice().buffer as ArrayBuffer])
    .stream()
    .pipeThrough(
      new DecompressionStream(
        "deflate-raw" as CompressionFormat,
      ) as ReadableWritablePair<Uint8Array, Uint8Array>,
    );
  return readBoundedStream(stream, MAX_FILE_BYTES);
}

export async function readZipTextFiles(file: File): Promise<SkillFileInput[]> {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Choose a .zip archive to continue.");
  }
  if (file.size > MAX_ARCHIVE_BYTES) {
    throw new Error("ZIP files must be 20 MB or smaller.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength < 22) {
    throw new Error("This file does not look like a valid ZIP archive.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let endRecord = -1;
  const searchStart = Math.max(0, bytes.byteLength - 22 - 65_535);
  for (let offset = bytes.byteLength - 22; offset >= searchStart; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endRecord = offset;
      break;
    }
  }
  if (endRecord < 0 || endRecord + 22 > bytes.byteLength) {
    throw new Error("This file does not look like a valid ZIP archive.");
  }

  const diskNumber = view.getUint16(endRecord + 4, true);
  const centralDirectoryDisk = view.getUint16(endRecord + 6, true);
  const diskEntryCount = view.getUint16(endRecord + 8, true);
  const entryCount = view.getUint16(endRecord + 10, true);
  const centralDirectorySize = view.getUint32(endRecord + 12, true);
  const centralDirectoryOffset = view.getUint32(endRecord + 16, true);
  const commentLength = view.getUint16(endRecord + 20, true);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    diskEntryCount !== entryCount ||
    entryCount === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff ||
    entryCount > MAX_ENTRIES ||
    centralDirectoryEnd > endRecord ||
    endRecord + 22 + commentLength > bytes.byteLength
  ) {
    throw new Error("The ZIP structure is invalid or exceeds the archive limits.");
  }

  const files: SkillFileInput[] = [];
  const uniquePaths = new Set<string>();
  let totalTextBytes = 0;
  let offset = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (
      offset + 46 > centralDirectoryEnd ||
      view.getUint32(offset, true) !== 0x02014b50
    ) {
      throw new Error("The ZIP contains an invalid directory entry.");
    }

    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const expectedCrc = view.getUint32(offset + 16, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const externalAttributes = view.getUint32(offset + 38, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const entryEnd = offset + 46 + nameLength + extraLength + entryCommentLength;

    if (
      entryEnd > centralDirectoryEnd ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff
    ) {
      throw new Error("The ZIP contains an unsupported or incomplete entry.");
    }

    const centralNameBytes = bytes.slice(offset + 46, offset + 46 + nameLength);
    const rawPath = decoder.decode(centralNameBytes);
    const path = assertSafePath(rawPath);
    const unixMode = externalAttributes >>> 16;
    if ((unixMode & 0xf000) === 0xa000) {
      throw new Error("The ZIP contains a symbolic link, which is not accepted.");
    }

    offset = entryEnd;
    if (path.endsWith("/") || path.startsWith("__MACOSX/")) continue;
    if (!TEXT_FILE_EXTENSION.test(path)) continue;
    if (flags & 0x0001) {
      throw new Error("Password-protected ZIP entries are not supported.");
    }
    if (uncompressedSize > MAX_FILE_BYTES) {
      throw new Error(`${path} expands beyond the 200 KB per-file limit.`);
    }
    if (files.length >= MAX_TEXT_FILES) {
      throw new Error("The ZIP contains more than 60 supported text files.");
    }
    if (totalTextBytes + uncompressedSize > MAX_TOTAL_TEXT_BYTES) {
      throw new Error("The extracted skill text must stay under 2.5 MB.");
    }

    if (
      localHeaderOffset + 30 > centralDirectoryOffset ||
      view.getUint32(localHeaderOffset, true) !== 0x04034b50
    ) {
      throw new Error(`The ZIP entry for ${path} is incomplete.`);
    }
    const localFlags = view.getUint16(localHeaderOffset + 6, true);
    const localMethod = view.getUint16(localHeaderOffset + 8, true);
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const localNameStart = localHeaderOffset + 30;
    const localDataStart = localNameStart + localNameLength + localExtraLength;
    const localDataEnd = localDataStart + compressedSize;
    const localName = bytes.slice(localNameStart, localNameStart + localNameLength);

    if (
      localFlags !== flags ||
      localMethod !== method ||
      localNameLength !== centralNameBytes.byteLength ||
      localDataStart > centralDirectoryOffset ||
      localDataEnd > centralDirectoryOffset ||
      localName.some((byte, index) => byte !== centralNameBytes[index])
    ) {
      throw new Error(`The ZIP entry for ${path} is inconsistent.`);
    }

    const packed = bytes.slice(localDataStart, localDataEnd);
    const contentBytes = await decompressEntry(method, packed);
    if (
      contentBytes.byteLength !== uncompressedSize ||
      (crc32(contentBytes) >>> 0) !== expectedCrc
    ) {
      throw new Error(`The ZIP entry for ${path} failed its integrity check.`);
    }

    const content = decoder.decode(contentBytes);
    if (content.includes("\0")) {
      throw new Error(`${path} does not appear to be a text file.`);
    }
    if (looksLikeCredential(content)) {
      throw new Error(
        "Remove passwords, API keys, tokens, or private keys from the ZIP before uploading.",
      );
    }

    const normalizedKey = path.normalize("NFC").toLowerCase();
    if (uniquePaths.has(normalizedKey)) {
      throw new Error("The ZIP contains duplicate text-file paths.");
    }
    uniquePaths.add(normalizedKey);
    totalTextBytes += contentBytes.byteLength;
    files.push({ path, content });
  }

  if (offset !== centralDirectoryEnd) {
    throw new Error("The ZIP directory size does not match its entries.");
  }
  if (!files.some((entry) => entry.path.split("/").at(-1)?.toLowerCase() === "skill.md")) {
    throw new Error("This ZIP does not contain a SKILL.md file.");
  }
  return files;
}