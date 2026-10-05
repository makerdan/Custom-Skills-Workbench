import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

const shim = new URL("./test-bounds.mjs", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier === "node:test" || specifier === "test") && context.parentURL !== shim) {
      return { url: shim, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

// No caller-controlled timeout values. This preload is part of the pinned runner.
export const source = fileURLToPath(import.meta.url);
