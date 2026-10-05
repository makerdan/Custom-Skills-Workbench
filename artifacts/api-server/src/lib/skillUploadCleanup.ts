import { inArray } from 'drizzle-orm';

import { db, skillVersionsTable } from '@workspace/db';
import { logger } from './logger';
import { ObjectStorageService } from './objectStorage';

/**
 * Unreferenced skill ZIP uploads are retained for 30 days before deletion.
 * This is much longer than the 15-minute upload URL lifetime and gives users
 * time to finish saving a skill after uploading.
 */
export const ABANDONED_UPLOAD_RETENTION_DAYS = 30;
export const ABANDONED_UPLOAD_RETENTION_MS =
  ABANDONED_UPLOAD_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const SAVED_PATH_QUERY_BATCH_SIZE = 500;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface SkillUploadObject {
  objectPath: string;
  createdAt: Date;
}

export interface SkillUploadCleanupStorage {
  listSkillUploadObjects(): Promise<SkillUploadObject[]>;
  deleteSkillUploadObject(objectPath: string): Promise<void>;
}

export interface SkillUploadCleanupResult {
  deleted: number;
  active: number;
  saved: number;
  failed: number;
}

type FindSavedObjectPaths = (
  candidatePaths: string[],
) => Promise<Set<string>>;

async function findSavedSkillUploadPaths(
  candidatePaths: string[],
): Promise<Set<string>> {
  const savedPaths = new Set<string>();
  for (
    let offset = 0;
    offset < candidatePaths.length;
    offset += SAVED_PATH_QUERY_BATCH_SIZE
  ) {
    const batch = candidatePaths.slice(
      offset,
      offset + SAVED_PATH_QUERY_BATCH_SIZE,
    );
    const rows = await db
      .select({ objectPath: skillVersionsTable.objectPath })
      .from(skillVersionsTable)
      .where(inArray(skillVersionsTable.objectPath, batch));
    for (const row of rows) {
      savedPaths.add(row.objectPath);
    }
  }
  return savedPaths;
}

export async function cleanupAbandonedSkillUploads({
  objectStorage = new ObjectStorageService(),
  findSavedPaths = findSavedSkillUploadPaths,
  now = new Date(),
}: {
  objectStorage?: SkillUploadCleanupStorage;
  findSavedPaths?: FindSavedObjectPaths;
  now?: Date;
} = {}): Promise<SkillUploadCleanupResult> {
  const uploads = await objectStorage.listSkillUploadObjects();
  const cutoff = now.getTime() - ABANDONED_UPLOAD_RETENTION_MS;
  const expiredUploads = uploads.filter(
    ({ createdAt }) =>
      Number.isFinite(createdAt.getTime()) && createdAt.getTime() < cutoff,
  );
  const active = uploads.length - expiredUploads.length;
  if (expiredUploads.length === 0) {
    return { deleted: 0, active, saved: 0, failed: 0 };
  }

  const expiredPaths = expiredUploads.map(({ objectPath }) => objectPath);
  const savedPaths = await findSavedPaths(expiredPaths);
  let deleted = 0;
  let failed = 0;
  let saved = 0;

  for (const objectPath of expiredPaths) {
    if (savedPaths.has(objectPath)) {
      saved += 1;
      continue;
    }
    try {
      await objectStorage.deleteSkillUploadObject(objectPath);
      deleted += 1;
    } catch (error) {
      failed += 1;
      logger.error({ err: error }, 'Failed to delete abandoned skill upload');
    }
  }

  return { deleted, active, saved, failed };
}

export function startAbandonedSkillUploadCleanup(): () => void {
  const runCleanup = async () => {
    try {
      const result = await cleanupAbandonedSkillUploads();
      logger.info(result, 'Abandoned skill upload cleanup finished');
    } catch (error) {
      logger.error({ err: error }, 'Abandoned skill upload cleanup failed');
    }
  };

  void runCleanup();
  const interval = setInterval(() => void runCleanup(), CLEANUP_INTERVAL_MS);
  interval.unref();
  return () => clearInterval(interval);
}