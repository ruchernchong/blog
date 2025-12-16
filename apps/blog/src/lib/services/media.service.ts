import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";
import { db, media, type InsertMedia, type SelectMedia } from "@/schema";
import type { CacheService } from "./cache.service";
import type {
  R2Service,
  PresignedUploadResult,
  UploadMetadata,
} from "./r2.service";

// Extend InsertMedia with slug for temp storage
export type TempMediaData = Omit<
  InsertMedia,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
> & {
  slug: string;
  createdAt: number; // Unix timestamp for Redis
};

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
  private readonly TEMP_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  private readonly TEMP_PREFIX = "media:tmp:";
  private readonly TEMP_SLUG_PREFIX = "media:tmp:slug:";

  constructor(
    private readonly r2: R2Service,
    private readonly cache: CacheService,
  ) {}

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

  // === TEMP MEDIA (Redis) ===

  async saveTempMedia(id: string, data: TempMediaData): Promise<void> {
    try {
      // Save temp media data with TTL
      await this.cache.set(`${this.TEMP_PREFIX}${id}`, data, {
        ex: this.TEMP_TTL,
      });

      // Add to slug's temp media set (for lookup by slug)
      const slugKey = `${this.TEMP_SLUG_PREFIX}${data.slug}`;
      await this.cache.set(
        slugKey,
        [...((await this.cache.get<string[]>(slugKey)) ?? []), id],
        { ex: this.TEMP_TTL },
      );
    } catch (error) {
      logError(ERROR_IDS.TEMP_MEDIA_SAVE_FAILED, error, { id, slug: data.slug });
      throw error;
    }
  }

  async getTempMedia(id: string): Promise<TempMediaData | null> {
    try {
      return await this.cache.get<TempMediaData>(`${this.TEMP_PREFIX}${id}`);
    } catch (error) {
      logError(ERROR_IDS.TEMP_MEDIA_FETCH_FAILED, error, { id });
      return null;
    }
  }

  async getTempMediaBySlug(slug: string): Promise<TempMediaData[]> {
    try {
      const slugKey = `${this.TEMP_SLUG_PREFIX}${slug}`;
      const ids = (await this.cache.get<string[]>(slugKey)) ?? [];

      const tempMedia: TempMediaData[] = [];
      for (const id of ids) {
        const data = await this.getTempMedia(id);
        if (data) {
          tempMedia.push(data);
        }
      }

      return tempMedia;
    } catch (error) {
      logError(ERROR_IDS.TEMP_MEDIA_FETCH_FAILED, error, { slug });
      return [];
    }
  }

  async deleteTempMedia(id: string, slug?: string): Promise<void> {
    try {
      await this.cache.del(`${this.TEMP_PREFIX}${id}`);

      // Remove from slug's temp media set if slug provided
      if (slug) {
        const slugKey = `${this.TEMP_SLUG_PREFIX}${slug}`;
        const ids = (await this.cache.get<string[]>(slugKey)) ?? [];
        const filtered = ids.filter((i) => i !== id);
        if (filtered.length > 0) {
          await this.cache.set(slugKey, filtered, { ex: this.TEMP_TTL });
        } else {
          await this.cache.del(slugKey);
        }
      }
    } catch (error) {
      logError(ERROR_IDS.TEMP_MEDIA_DELETE_FAILED, error, { id, slug });
    }
  }

  // === PROMOTE (Temp → Permanent) ===

  async promoteMedia(slug: string): Promise<SelectMedia[]> {
    try {
      const tempMedia = await this.getTempMediaBySlug(slug);
      const promoted: SelectMedia[] = [];

      for (const temp of tempMedia) {
        // Copy file in R2: media/tmp/... → media/...
        const { newKey, newUrl } = await this.r2.copyToPermanent(temp.key);

        // Save to PostgreSQL
        const saved = await this.confirmUpload({
          key: newKey,
          filename: temp.filename,
          url: newUrl,
          mimeType: temp.mimeType,
          size: temp.size,
          width: temp.width ?? undefined,
          height: temp.height ?? undefined,
          alt: temp.alt ?? undefined,
          caption: temp.caption ?? undefined,
          uploadedById: temp.uploadedById ?? undefined,
        });

        promoted.push(saved);
      }

      // Delete all temp media for this slug from Redis
      const slugKey = `${this.TEMP_SLUG_PREFIX}${slug}`;
      const ids = (await this.cache.get<string[]>(slugKey)) ?? [];
      for (const id of ids) {
        await this.cache.del(`${this.TEMP_PREFIX}${id}`);
      }
      await this.cache.del(slugKey);

      return promoted;
    } catch (error) {
      logError(ERROR_IDS.MEDIA_PROMOTE_FAILED, error, { slug });
      throw error;
    }
  }
}
