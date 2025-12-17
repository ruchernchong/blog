import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { db, media, type SelectMedia } from "@/schema";
import type {
  R2Service,
  PresignedUploadResult,
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
}

export class MediaService {
  constructor(private readonly r2: R2Service) {}

  async requestUpload(metadata: UploadMetadata): Promise<PresignedUploadResult> {
    return this.r2.createPresignedUpload(metadata);
  }

  async confirmUpload(input: CreateMediaInput): Promise<SelectMedia> {
    try {
      const [created] = await db.insert(media).values(input).returning();
      return created;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_CREATE_FAILED, error, { filename: input.filename });
      throw error;
    }
  }

  async getMediaList(options: MediaListOptions = {}): Promise<SelectMedia[]> {
    const { search, limit = 50, offset = 0, includeDeleted = false } = options;

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

      return db
        .select()
        .from(media)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      logError(ERROR_IDS.MEDIA_FETCH_FAILED, error);
      throw error;
    }
  }

  async getMediaById(id: string): Promise<SelectMedia | null> {
    try {
      const [item] = await db
        .select()
        .from(media)
        .where(and(eq(media.id, id), isNull(media.deletedAt)))
        .limit(1);

      return item ?? null;
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
}
