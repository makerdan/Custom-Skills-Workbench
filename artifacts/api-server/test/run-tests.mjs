import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const apiDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Keep the bundled file beneath the package root so Node can resolve its
// external dependencies through this package's pnpm node_modules links.
const outputDir = await mkdtemp(path.join(apiDir, ".api-server-test-"));
const bundledTest = path.join(outputDir, "routes.test.mjs");

try {
  await build({
    absWorkingDir: apiDir,
    entryPoints: ["test/routes.test.ts"],
    outfile: bundledTest,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    alias: {
      "@workspace/db": path.join(apiDir, "test/support/mock-db.ts"),
      "@workspace/api-zod": path.resolve(apiDir, "../../lib/api-zod/src/index.ts"),
      "zod/v4": path.resolve(
        apiDir,
        "../../lib/api-zod/node_modules/zod/v4/index.js",
      ),
      zod: path.resolve(apiDir, "../../lib/api-zod/node_modules/zod/index.js"),
      "@workspace/integrations-openai-ai-server": path.join(
        apiDir,
        "test/support/mock-openai.ts",
      ),
    },
    logLevel: "silent",
  });

  const result = spawnSync(process.execPath, ["--test", bundledTest], {
    cwd: apiDir,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(outputDir, { recursive: true, force: true });
}