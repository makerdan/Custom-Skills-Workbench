import type { Skill, SkillVersion } from "@workspace/db";

export function toSkillVersionDto(version: SkillVersion) {
  return {
    id: version.id,
    skillId: version.skillId,
    versionLabel: version.versionLabel,
    fileName: version.fileName,
    fileCount: version.files.length,
    filePaths: version.files.map((file) => file.path),
    uploadedAt: version.uploadedAt,
  };
}

export function toSkillDto(skill: Skill, versions: SkillVersion[]) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    currentVersionId: skill.currentVersionId ?? versions[0]?.id ?? "",
    versions: versions.map(toSkillVersionDto),
    createdAt: skill.createdAt,
  };
}