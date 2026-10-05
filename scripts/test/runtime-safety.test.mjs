import assert from "node:assert/strict";
import test from "node:test";

import { scanPortText, scanRepository } from "../check-runtime-ports.mjs";

test("rejects a hardcoded service listener and loopback URL", () => {
  const fixturePort = ["43", "21"].join("");
  const fixture = [
    "const server = createServer();",
    "server.listen(" + fixturePort + ", '127.0.0.1');",
    "fetch('http://127.0.0.1:" + fixturePort + "/healthz');",
  ].join("\n");

  const findings = scanPortText(fixture, "fixtures/hardcoded-service.mjs");

  assert.equal(findings.length, 2);
  assert.match(findings[0], /listener port/);
  assert.match(findings[1], /url port/);
});

test("accepts a service whose listener port comes from its environment", () => {
  const fixture = [
    "const port = Number(process.env.PORT);",
    "const server = createServer();",
    "server.listen(port, '127.0.0.1');",
  ].join("\n");

  assert.deepEqual(scanPortText(fixture, "fixtures/environment-service.mjs"), []);
});

test("the repository has distinct artifact-assigned service ports and no unowned literals", () => {
  assert.deepEqual(scanRepository(), []);
});
