#!/usr/bin/env node

import process from "node:process";
import { checkWorkspaceSkillStatus } from "./src/workspace-skill-sync.mjs";

function parseSkillId(args) {
  if (args[0] === "--") args = args.slice(1);
  if (args.length !== 2 || args[0] !== "--skill") return null;
  return args[1];
}

const skillId = parseSkillId(process.argv.slice(2));
if (!skillId) {
  console.error("workspace-skill status: usage error");
  process.exitCode = 1;
} else {
  const { outcome, exitCode } = checkWorkspaceSkillStatus(skillId);
  const safeId =
    skillId.length <= 128 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillId);
  console.log(
    safeId
      ? `workspace-skill status: ${outcome} (${skillId})`
      : `workspace-skill status: ${outcome}`,
  );
  process.exitCode = exitCode;
}
