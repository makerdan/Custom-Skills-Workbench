import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skippedDirectories = new Set([
  ".git",
  ".local",
  ".agents",
  "node_modules",
  "dist",
  "build",
  ".test-build",
]);
const textExtensions = new Set([
  ".cjs",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const portPatterns = [
  {
    kind: "listener",
    regex: /\blisten\s*\(\s*(["']?)(\d{1,5})\1\s*(?=[,)])/g,
    portGroup: 2,
  },
  {
    kind: "url",
    regex:
      /\b(?:https?:\/\/)?(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]):(\d{1,5})\b/g,
    portGroup: 1,
  },
  {
    kind: "assignment",
    regex: /\b(?:localPort|PORT|port)\s*=\s*["']?(\d{1,5})["']?/g,
    portGroup: 1,
  },
  {
    kind: "port-option",
    regex: /\bport\s*:\s*["']?(\d{1,5})["']?/g,
    portGroup: 1,
  },
  {
    kind: "documentation",
    regex: /\bport\s+(\d{1,5})\b/gi,
    portGroup: 1,
  },
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function configuredArtifactPorts(files) {
  const ports = new Set();
  const errors = [];
  const artifactFiles = [...files.entries()].filter(([filePath]) =>
    filePath.endsWith("/.replit-artifact/artifact.toml"),
  );

  for (const [filePath, text] of artifactFiles) {
    const matches = [...text.matchAll(/^\s*localPort\s*=\s*(\d{1,5})\s*$/gm)];
    if (matches.length !== 1) {
      errors.push(
        `${filePath}: expected exactly one artifact-assigned localPort; found ${matches.length}`,
      );
      continue;
    }

    const port = Number(matches[0][1]);
    if (port < 1 || port > 65535) {
      errors.push(`${filePath}: invalid artifact-assigned localPort ${port}`);
      continue;
    }
    if (ports.has(port)) {
      errors.push(`${filePath}: artifact-assigned port ${port} is not distinct`);
    }
    ports.add(port);

    const envPortValues = [
      ...text.matchAll(/^\s*PORT\s*=\s*["']?(\d{1,5})["']?\s*$/gm),
    ].map((match) => Number(match[1]));
    if (envPortValues.some((envPort) => envPort !== port)) {
      errors.push(
        `${filePath}: configured PORT must match artifact-assigned localPort ${port}`,
      );
    }
  }

  if (artifactFiles.length !== 3) {
    errors.push(
      `expected the three registered service artifact configurations; found ${artifactFiles.length}`,
    );
  }

  return { ports, errors };
}

function isAllowedHistoricalBuildInput(filePath, line, kind, port) {
  // Retain these exact compile-only observations in the older handoff; they are
  // historical build inputs, not service listeners or current port defaults.
  const firstBuildCommand = ["PORT", "=5000", " pnpm run build"].join("");
  const fullBuildCommand = [
    "PORT",
    "=5000",
    " BASE_PATH=/ pnpm run build",
  ].join("");
  return (
    filePath === "docs/validation/regression-guard-apply-handoff.md" &&
    kind === "assignment" &&
    port === 5000 &&
    (line.includes(firstBuildCommand) || line.includes(fullBuildCommand))
  );
}

function isAllowedObjectStorageSidecar(filePath, line, kind, port, content) {
  // This one host-provided URL is an object-storage sidecar, not a project
  // listener. Keep the exception bound to the exact files and URL.
  const sidecarAddress = ["127.0.0.1", ":", "1106"].join("");
  if (
    kind !== "url" ||
    port !== 1106 ||
    !line.includes(sidecarAddress) ||
    !content.includes("Replit object-storage credential sidecar")
  ) {
    return false;
  }

  return (
    filePath === "artifacts/api-server/src/lib/objectStorage.ts" ||
    filePath === "artifacts/api-server/test/routes.test.ts" ||
    filePath === "docs/validation/app-support-runtime-safety-apply-handoff.md"
  );
}

function isAllowedOccurrence(filePath, line, kind, port, artifactPorts, content) {
  if (
    kind === "listener" &&
    port === 0 &&
    filePath === "artifacts/api-server/test/routes.test.ts"
  ) {
    return true;
  }

  if (filePath.endsWith("/.replit-artifact/artifact.toml")) {
    return (
      (kind === "assignment" || kind === "documentation") &&
      artifactPorts.has(port)
    );
  }

  if (
    filePath === "replit.md" ||
    filePath.startsWith("docs/validation/")
  ) {
    if (
      (kind === "assignment" || kind === "documentation") &&
      artifactPorts.has(port)
    ) {
      return true;
    }
    if (kind === "documentation" && port === 0 && /ephemeral/i.test(line)) {
      return true;
    }
  }

  return (
    isAllowedHistoricalBuildInput(filePath, line, kind, port) ||
    isAllowedObjectStorageSidecar(filePath, line, kind, port, content)
  );
}

export function scanPortText(content, filePath, artifactPorts = new Set()) {
  const normalizedPath = normalizePath(filePath);
  const lines = content.split(/\r?\n/);
  const findings = new Map();

  for (const { kind, regex, portGroup } of portPatterns) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) {
      const port = Number(match[portGroup]);
      const lineNumber = content.slice(0, match.index).split(/\r?\n/).length;
      const line = lines[lineNumber - 1] ?? "";
      if (
        isAllowedOccurrence(
          normalizedPath,
          line,
          kind,
          port,
          artifactPorts,
          content,
        )
      ) {
        continue;
      }

      findings.set(
        `${lineNumber}:${port}`,
        `${normalizedPath}:${lineNumber}: unowned fixed ${kind} port ${port}`,
      );
    }
  }

  return [...findings.values()];
}

function walkFiles(directory, root, files) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, root, files);
    } else if (
      entry.isFile() &&
      textExtensions.has(path.extname(entry.name)) &&
      !entry.name.endsWith(".map")
    ) {
      const relativePath = normalizePath(path.relative(root, absolutePath));
      files.set(relativePath, readFileSync(absolutePath, "utf8"));
    }
  }
}

export function scanRepository(root = projectRoot) {
  const files = new Map();

  for (const filePath of [
    ".replit",
    "replit.md",
    "README.md",
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "tsconfig.base.json",
  ]) {
    const absolutePath = path.join(root, filePath);
    try {
      if (statSync(absolutePath).isFile()) {
        files.set(filePath, readFileSync(absolutePath, "utf8"));
      }
    } catch {
      // Optional top-level runtime files are reported only when present.
    }
  }

  for (const directory of [
    "scripts",
    "artifacts",
    "lib",
    "test-fixtures",
    "docs/validation",
    ".github",
  ]) {
    const absolutePath = path.join(root, directory);
    try {
      if (statSync(absolutePath).isDirectory()) {
        walkFiles(absolutePath, root, files);
      }
    } catch {
      // A missing optional scan root does not prevent checking other roots.
    }
  }

  const { ports: artifactPorts, errors } = configuredArtifactPorts(files);
  for (const [filePath, content] of files) {
    errors.push(...scanPortText(content, filePath, artifactPorts));
  }

  return errors;
}

function main() {
  const errors = scanRepository();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log("Runtime port scan passed for the three configured service artifacts.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
