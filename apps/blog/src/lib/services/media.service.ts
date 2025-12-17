import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { db, media, type SelectMedia } from "@/schema";
import type {
  PresignedUploadResult,
  R2Service,
  UploadMetadata,
} from "./r2.service";

export interface CreateMediaInput {
  key: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  uploadedById?: string;
}

export interface MediaListOptions {
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  verifyR2Existence?: boolean;
}

export class MediaService {
  constructor(private readonly r2: R2Service) {}

  async requestUpload(
    metadata: UploadMetadata,
  ): Promise<PresignedUploadResult> {
    return this.r2.createPresignedUpload(metadata);
  }

  async confirmUpload(input: CreateMediaInput): Promise<SelectMedia> {
    try {
      const [created] = await db.insert(media).values(input).returning();
      return created;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_CREATE_FAILED, error, {
        filename: input.filename,
      });
      throw error;
    }
  }

  async getMediaList(options: MediaListOptions = {}): Promise<SelectMedia[]> {
    const {
      search,
      limit = 50,
      offset = 0,
      includeDeleted = false,
      verifyR2Existence = true,
    } = options;

    try {
      const conditions = includeDeleted ? [] : [isNull(media.deletedAt)];

      if (search) {
        conditions.push(
          or(
            ilike(media.filename, `%${search}%`),
            ilike(media.alt, `%${search}%`),
          )!,
        );
      }

      const mediaList = await db
        .select()
        .from(media)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset);

      if (!verifyR2Existence || mediaList.length === 0) {
        return mediaList;
      }

      // Verify R2 existence and filter out orphaned records
      const keys = mediaList.map((item) => item.key);
      const existenceMap = await this.r2.checkObjectsExist(keys);

      return mediaList.filter((item) => existenceMap.get(item.key) === true);
    } catch (error) {
      logError(ERROR_IDS.MEDIA_FETCH_FAILED, error);
      throw error;
    }
  }

  async getMediaById(
    id: string,
    verifyR2Existence = true,
  ): Promise<SelectMedia | null> {
    try {
      const [item] = await db
        .select()
        .from(media)
        .where(and(eq(media.id, id), isNull(media.deletedAt)))
        .limit(1);

      if (!item) return null;

      // Verify R2 existence if enabled
      if (verifyR2Existence) {
        const exists = await this.r2.objectExists(item.key);
        if (!exists) return null;
      }

      return item;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_FETCH_FAILED, error, { id });
      throw error;
    }
  }

  async updateMedia(
    id: string,
    updates: { alt?: string; caption?: string },
  ): Promise<SelectMedia | null> {
    try {
      const [updated] = await db
        .update(media)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(media.id, id))
        .returning();

      return updated ?? null;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_UPDATE_FAILED, error, { id });
      throw error;
    }
  }

  async softDeleteMedia(id: string): Promise<SelectMedia | null> {
    try {
      const [deleted] = await db
        .update(media)
        .set({ deletedAt: new Date() })
        .where(eq(media.id, id))
        .returning();

      return deleted ?? null;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_DELETE_FAILED, error, { id });
      throw error;
    }
  }

  async hardDeleteMedia(id: string): Promise<void> {
    try {
      const item = await this.getMediaById(id);
      if (!item) return;

      await this.r2.deleteObject(item.key);
      await db.delete(media).where(eq(media.id, id));
    } catch (error) {
      logError(ERROR_IDS.MEDIA_DELETE_FAILED, error, { id });
      throw error;
    }
  }

  async restoreMedia(id: string): Promise<SelectMedia | null> {
    try {
      const [restored] = await db
        .update(media)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(media.id, id))
        .returning();

      return restored ?? null;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_UPDATE_FAILED, error, { id });
      throw error;
    }
  }

  /**
   * Removes database records for media that no longer exists in R2.
   * This handles the edge case where files are deleted directly from R2.
   * @returns Array of IDs that were cleaned up
   */
  async cleanupOrphanedRecords(): Promise<string[]> {
    try {
      // Get all non-deleted media records without verifying R2 existence
      const allMedia = await this.getMediaList({
        verifyR2Existence: false,
        limit: 1000,
      });

      if (allMedia.length === 0) return [];

      // Check which objects exist in R2
      const keys = allMedia.map((item) => item.key);
      const existenceMap = await this.r2.checkObjectsExist(keys);

      // Find orphaned records (exist in DB but not in R2)
      const orphanedIds = allMedia
        .filter((item) => existenceMap.get(item.key) === false)
        .map((item) => item.id);

      if (orphanedIds.length === 0) return [];

      // Delete orphaned records from database
      for (const id of orphanedIds) {
        await db.delete(media).where(eq(media.id, id));
      }

      return orphanedIds;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_DELETE_FAILED, error, {
        operation: "cleanupOrphanedRecords",
      });
      throw error;
    }
  }
}
