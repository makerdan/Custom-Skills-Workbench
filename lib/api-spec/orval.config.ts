import { defineConfig, InputTransformerFn } from "orval";
import path from "path";
import { copyFileSync, mkdirSync } from "node:fs";
import process from "node:process";

const root = path.resolve(__dirname, "..", "..");
const apiClientReactSrc = path.resolve(root, "lib", "api-client-react", "src");
const apiZodSrc = path.resolve(root, "lib", "api-zod", "src");
const stageId = process.env.WORKSPACE_ORVAL_STAGE_ID ?? `direct-${process.pid}`;

if (!/^[A-Za-z0-9_-]{1,80}$/.test(stageId)) {
  throw new Error("WORKSPACE_ORVAL_STAGE_ID must be a short path-safe identifier");
}

// Direct Orval runs may clean and write only these ignored per-run staging
// folders. run_codegen.py promotes their contents into accepted source while
// holding the shared Failure Gate writer lock.
const apiClientStage = path.resolve(
  root,
  "lib",
  "api-client-react",
  "dist",
  `.orval-stage-${stageId}`,
);
const apiZodStage = path.resolve(
  root,
  "lib",
  "api-zod",
  "dist",
  `.orval-stage-${stageId}`,
);
for (const [stage, source] of [
  [apiClientStage, apiClientReactSrc],
  [apiZodStage, apiZodSrc],
]) {
  mkdirSync(path.join(stage, "generated"), { recursive: true });
  copyFileSync(path.join(source, "index.ts"), path.join(stage, "index.ts"));
}
copyFileSync(
  path.join(apiClientReactSrc, "custom-fetch.ts"),
  path.join(apiClientStage, "custom-fetch.ts"),
);

// Our exports make assumptions about the title of the API being "Api" (i.e. generated output is `api.ts`).
const titleTransformer: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = "Api";

  return config;
};

export default defineConfig({
  "api-client-react": {
    input: {
      target: "./openapi.yaml",
      override: {
        transformer: titleTransformer,
      },
    },
    output: {
      workspace: apiClientStage,
      target: "generated",
      client: "react-query",
      mode: "split",
      baseUrl: "/api",
      clean: true,
      prettier: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: path.join(apiClientStage, "custom-fetch.ts"),
          name: "customFetch",
        },
      },
    },
  },
  zod: {
    input: {
      target: "./openapi.yaml",
      override: {
        transformer: titleTransformer,
      },
    },
    output: {
      workspace: apiZodStage,
      client: "zod",
      target: "generated",
      schemas: { path: "generated/types", type: "typescript" },
      mode: "split",
      clean: true,
      prettier: true,
      override: {
        zod: {
          // Orval resolves `auto` from lib/api-spec/package.json, which has no
          // zod dependency, so orval >= 8.23 falls back to Zod 4 syntax while
          // the catalog installs zod 3. Pin to match the catalog.
          version: 3,
          coerce: {
            query: ['boolean', 'number', 'string'],
            param: ['boolean', 'number', 'string'],
            body: ['bigint', 'date'],
            response: ['bigint', 'date'],
          },
        },
        useDates: true,
        useBigInt: true,
      },
    },
  },
});
