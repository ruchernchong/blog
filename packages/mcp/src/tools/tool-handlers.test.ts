import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing handlers
vi.mock("@/schema", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  posts: {
    id: "posts.id",
    slug: "posts.slug",
    status: "posts.status",
    deletedAt: "posts.deletedAt",
  },
  model: {
    table: "model",
    provider: "model.provider",
    id: "model.id",
    isOverride: "model.isOverride",
  },
  tokenUsage: { table: "token_usage", costUsd: "token_usage.costUsd" },
}));

vi.mock("@/lib/post-metadata", () => ({
  generatePostMetadata: vi.fn(() => ({
    readingTime: "5 min",
    description: "Test",
    canonical: "https://example.com/test",
    openGraph: {},
    twitter: {},
    structuredData: {},
  })),
}));

vi.mock("@/config/redis", () => ({
  default: {
    del: vi.fn(),
    zrem: vi.fn(),
  },
}));

vi.mock("@/lib/queries/overlapping-posts", () => ({
  getPostsWithOverlappingTags: vi.fn(),
}));

vi.mock("@/lib/queries/model-registry", () => ({
  entryToRow: (entry: unknown) => entry,
  keepOpenWeights: "keep-open-weights",
  rowToEntry: (row: unknown) => row,
}));

vi.mock("@/lib/services", () => ({
  mediaService: {
    confirmUpload: vi.fn(),
    uploadFromPath: vi.fn(),
    uploadFromUrl: vi.fn(),
  },
}));

import redis from "@/config/redis";
import { CacheConfig } from "@/lib/config/cache.config";
import { generatePostMetadata } from "@/lib/post-metadata";
import { getPostsWithOverlappingTags } from "@/lib/queries/overlapping-posts";
import { mediaService } from "@/lib/services";
import { db, model, posts } from "@/schema";
import {
  confirmUploadHandler,
  uploadFromPathHandler,
  uploadFromUrlHandler,
} from "./media.tools";
import {
  deleteModelOverrideHandler,
  upsertModelOverrideHandler,
} from "./models.tools";
import {
  createPostHandler,
  deletePostHandler,
  publishPostHandler,
  restorePostHandler,
  saveDraftHandler,
  updatePostHandler,
} from "./posts.tools";

const mockDbSelect = vi.mocked(db.select);
const mockDbInsert = vi.mocked(db.insert);
const mockDbUpdate = vi.mocked(db.update);
const mockDbDelete = vi.mocked(db.delete);
const mockGeneratePostMetadata = vi.mocked(generatePostMetadata);
const revalidateTags = vi.fn().mockResolvedValue(undefined);
const deps = { revalidateTags };

/** Every tag `invalidatePostCache` revalidates for a slug. */
function postTags(slug: string): string[] {
  return [
    `post:${slug}`,
    `mdx:${slug}`,
    `related:${slug}`,
    "posts:list",
    "posts:count",
    "posts:featured",
  ];
}

function mockInsertReturning(row: unknown) {
  mockDbInsert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([row]),
    }),
  } as any);
}

function mockSelectOne(row: unknown) {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([row]),
      }),
    }),
  } as any);
}

function mockUpdateReturning(row: unknown) {
  mockDbUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(row ? [row] : []),
      }),
    }),
  } as any);
}

function createMockExtra(userId?: string) {
  return {
    authInfo: userId
      ? {
          extra: { userId },
        }
      : undefined,
  };
}

describe("MCP Tool Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPostHandler", () => {
    it("should create a post with authorId when auth context is present", async () => {
      const mockPost = {
        id: "post-1",
        slug: "test-post",
        title: "Test Post",
        status: "draft",
      };

      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPost]),
        }),
      } as any);

      const result = await createPostHandler(
        {
          title: "Test Post",
          slug: "test-post",
          content: "# Hello",
        },
        createMockExtra("user-123"),
        deps,
      );

      expect(mockDbInsert).toHaveBeenCalledWith(posts);
      const insertCall =
        mockDbInsert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertCall.authorId).toBe("user-123");
      expect(result.structuredContent).toEqual({ post: mockPost });
    });

    it("should create a post with null authorId when no auth context", async () => {
      const mockPost = {
        id: "post-2",
        slug: "test-post-2",
        title: "Test Post 2",
        status: "draft",
      };

      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPost]),
        }),
      } as any);

      const result = await createPostHandler(
        {
          title: "Test Post 2",
          slug: "test-post-2",
          content: "# Hello",
        },
        createMockExtra(),
        deps,
      );

      const insertCall =
        mockDbInsert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertCall.authorId).toBeNull();
      expect(result.structuredContent).toEqual({ post: mockPost });
    });

    it("should call generatePostMetadata with correct arguments", async () => {
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([
              { id: "1", slug: "test", title: "Test", status: "published" },
            ]),
        }),
      } as any);

      await createPostHandler(
        {
          title: "Test",
          slug: "test",
          content: "Content",
          summary: "Summary",
          status: "published",
        },
        createMockExtra(),
        deps,
      );

      expect(mockGeneratePostMetadata).toHaveBeenCalledWith(
        "Test",
        "test",
        "Content",
        "Summary",
        expect.any(Date),
      );
    });
  });

  describe("saveDraftHandler", () => {
    it("should create new draft with authorId when auth context is present", async () => {
      const mockPost = {
        id: "draft-1",
        slug: "new-draft",
        title: "New Draft",
        status: "draft",
      };

      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPost]),
        }),
      } as any);

      const result = await saveDraftHandler(
        {
          title: "New Draft",
          content: "Draft content",
        },
        createMockExtra("user-456"),
        deps,
      );

      const insertCall =
        mockDbInsert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertCall.authorId).toBe("user-456");
      expect(insertCall.status).toBe("draft");
      expect(result.structuredContent).toEqual({ post: mockPost });
    });

    it("should create new draft with null authorId when no auth context", async () => {
      const mockPost = {
        id: "draft-2",
        slug: "another-draft",
        title: "Another Draft",
        status: "draft",
      };

      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPost]),
        }),
      } as any);

      const result = await saveDraftHandler(
        {
          title: "Another Draft",
        },
        createMockExtra(),
        deps,
      );

      const insertCall =
        mockDbInsert.mock.results[0].value.values.mock.calls[0][0];
      expect(insertCall.authorId).toBeNull();
      expect(result.structuredContent).toEqual({ post: mockPost });
    });

    it("should update existing draft without changing authorId", async () => {
      const existingPost = {
        id: "existing-1",
        title: "Old Title",
        slug: "old-slug",
        content: "Old content",
        summary: null,
        status: "draft",
        tags: [],
        metadata: {},
      };

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingPost]),
          }),
        }),
      } as any);

      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: "existing-1",
                title: "New Title",
                slug: "old-slug",
                status: "draft",
              },
            ]),
          }),
        }),
      } as any);

      const result = await saveDraftHandler(
        {
          id: "existing-1",
          title: "New Title",
        },
        createMockExtra("user-789"),
        deps,
      );

      // For updates, authorId should not be modified
      expect(mockDbUpdate).toHaveBeenCalledWith(posts);
      const updateCall =
        mockDbUpdate.mock.results[0].value.set.mock.calls[0][0];
      expect(updateCall.authorId).toBeUndefined();
      expect(result.structuredContent).toEqual({
        post: {
          id: "existing-1",
          title: "New Title",
          slug: "old-slug",
          status: "draft",
        },
      });
    });

    it("should reject update on published post", async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "published-1",
                title: "Published",
                status: "published",
              },
            ]),
          }),
        }),
      } as any);

      const result = await saveDraftHandler(
        {
          id: "published-1",
          title: "New Title",
        },
        createMockExtra(),
        deps,
      );

      expect(result.isError).toBe(true);
      const text = result.content.find((item) => item.type === "text")?.text;
      expect(text).toContain("Cannot use save_draft on a published post");
    });
  });

  describe("confirmUploadHandler", () => {
    it("should confirm upload with uploadedById when auth context is present", async () => {
      const mockMedia = {
        id: "media-1",
        filename: "image.png",
        url: "https://cdn.example.com/image.png",
      };

      vi.mocked(mediaService.confirmUpload).mockResolvedValue(mockMedia as any);

      const result = await confirmUploadHandler(
        {
          key: "uploads/image.png",
          filename: "image.png",
          url: "https://cdn.example.com/image.png",
          mimeType: "image/png",
          size: 1024,
        },
        createMockExtra("user-999"),
      );

      expect(mediaService.confirmUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: "user-999",
        }),
      );
      expect(result.structuredContent).toEqual({ media: mockMedia });
    });

    it("should confirm upload without uploadedById when no auth context", async () => {
      const mockMedia = {
        id: "media-2",
        filename: "photo.jpg",
        url: "https://cdn.example.com/photo.jpg",
      };

      vi.mocked(mediaService.confirmUpload).mockResolvedValue(mockMedia as any);

      const result = await confirmUploadHandler(
        {
          key: "uploads/photo.jpg",
          filename: "photo.jpg",
          url: "https://cdn.example.com/photo.jpg",
          mimeType: "image/jpeg",
          size: 2048,
        },
        createMockExtra(),
      );

      expect(mediaService.confirmUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: undefined,
        }),
      );
      expect(result.structuredContent).toEqual({ media: mockMedia });
    });
  });

  describe("uploadFromPathHandler", () => {
    it("should upload from path with uploadedById when auth context is present", async () => {
      const mockMedia = {
        id: "media-3",
        filename: "file.png",
        url: "https://cdn.example.com/file.png",
        mimeType: "image/png",
        size: 512,
      };

      vi.mocked(mediaService.uploadFromPath).mockResolvedValue(
        mockMedia as any,
      );

      const result = await uploadFromPathHandler(
        {
          filePath: "/tmp/file.png",
        },
        createMockExtra("user-111"),
      );

      expect(mediaService.uploadFromPath).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: "user-111",
        }),
      );
      expect(result.structuredContent).toEqual({ media: mockMedia });
    });

    it("should upload from path without uploadedById when no auth context", async () => {
      const mockMedia = {
        id: "media-4",
        filename: "doc.jpg",
        url: "https://cdn.example.com/doc.jpg",
        mimeType: "image/jpeg",
        size: 1024,
      };

      vi.mocked(mediaService.uploadFromPath).mockResolvedValue(
        mockMedia as any,
      );

      const result = await uploadFromPathHandler(
        {
          filePath: "/tmp/doc.jpg",
          alt: "A document",
        },
        createMockExtra(),
      );

      expect(mediaService.uploadFromPath).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: undefined,
        }),
      );
      expect(result.structuredContent).toEqual({ media: mockMedia });
    });
  });

  describe("uploadFromUrlHandler", () => {
    it("should upload from URL with uploadedById when auth context is present", async () => {
      const mockMedia = {
        id: "media-5",
        filename: "remote.png",
        url: "https://cdn.example.com/remote.png",
        mimeType: "image/png",
        size: 2048,
      };

      vi.mocked(mediaService.uploadFromUrl).mockResolvedValue(mockMedia as any);

      const result = await uploadFromUrlHandler(
        {
          url: "https://example.com/image.png",
          alt: "Remote image",
        },
        createMockExtra("user-222"),
      );

      expect(mediaService.uploadFromUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: "user-222",
        }),
      );
      expect(result.structuredContent).toEqual({ media: mockMedia });
    });

    it("should upload from URL without uploadedById when no auth context", async () => {
      const mockMedia = {
        id: "media-6",
        filename: "web.jpg",
        url: "https://cdn.example.com/web.jpg",
        mimeType: "image/jpeg",
        size: 4096,
      };

      vi.mocked(mediaService.uploadFromUrl).mockResolvedValue(mockMedia as any);

      const result = await uploadFromUrlHandler(
        {
          url: "https://example.com/photo.jpg",
        },
        createMockExtra(),
      );

      expect(mediaService.uploadFromUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedById: undefined,
        }),
      );
      expect(result.structuredContent).toEqual({ media: mockMedia });
    });
  });

  describe("cache revalidation", () => {
    it("should revalidate the post tags after create_post", async () => {
      mockInsertReturning({
        id: "1",
        slug: "hello",
        title: "Hello",
        status: "draft",
      });

      await createPostHandler(
        { title: "Hello", slug: "hello", content: "# Hi" },
        createMockExtra(),
        deps,
      );

      expect(redis.del).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POST_STATS("hello"),
      );
      expect(revalidateTags.mock.calls).toEqual([[postTags("hello")]]);
    });

    it("should revalidate the merged slug's tags after save_draft updates a draft", async () => {
      mockSelectOne({
        id: "draft-1",
        title: "Old",
        slug: "old",
        content: "Body",
        summary: null,
        status: "draft",
      });
      mockUpdateReturning({
        id: "draft-1",
        slug: "new-title",
        title: "New Title",
        status: "draft",
      });

      await saveDraftHandler(
        { id: "draft-1", title: "New Title" },
        createMockExtra(),
        deps,
      );

      expect(revalidateTags.mock.calls).toEqual([[postTags("new-title")]]);
    });

    it("should not revalidate when save_draft creates a new draft", async () => {
      mockInsertReturning({
        id: "draft-2",
        slug: "fresh",
        title: "Fresh",
        status: "draft",
      });

      await saveDraftHandler({ title: "Fresh" }, createMockExtra(), deps);

      expect(revalidateTags).not.toHaveBeenCalled();
    });

    it("should revalidate new, old and overlapping-tag posts after update_post", async () => {
      mockSelectOne({
        id: "post-1",
        title: "Post",
        slug: "old",
        content: "Body",
        summary: null,
        status: "published",
        tags: ["a"],
        publishedAt: new Date("2026-01-01"),
      });
      mockUpdateReturning({
        id: "post-1",
        slug: "new",
        title: "Post",
        status: "draft",
      });
      vi.mocked(getPostsWithOverlappingTags).mockResolvedValue([
        { slug: "other" },
      ] as any);

      await updatePostHandler(
        { id: "post-1", slug: "new", status: "draft", tags: ["a", "b"] },
        deps,
      );

      // The slug change and the unpublish each drop the old slug from popular.
      expect(redis.zrem).toHaveBeenCalledTimes(2);
      expect(redis.zrem).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        "old",
      );
      expect(getPostsWithOverlappingTags).toHaveBeenCalledWith(
        ["a", "a", "b"],
        "new",
      );
      expect(revalidateTags.mock.calls).toEqual([
        [postTags("new")],
        [postTags("old")],
        [postTags("old")],
        [["related:other", "post:other"]],
      ]);
    });

    it("should revalidate only the post tags when update_post keeps slug, status and tags", async () => {
      mockSelectOne({
        id: "post-1",
        title: "Post",
        slug: "same",
        content: "Body",
        summary: null,
        status: "published",
        tags: ["a"],
        publishedAt: new Date("2026-01-01"),
      });
      mockUpdateReturning({
        id: "post-1",
        slug: "same",
        title: "Renamed",
        status: "published",
      });

      await updatePostHandler({ id: "post-1", title: "Renamed" }, deps);

      expect(redis.zrem).not.toHaveBeenCalled();
      expect(getPostsWithOverlappingTags).not.toHaveBeenCalled();
      expect(revalidateTags.mock.calls).toEqual([[postTags("same")]]);
    });

    it("should drop the post from popular and revalidate its tags after delete_post", async () => {
      mockUpdateReturning({ id: "post-1", slug: "gone" });

      await deletePostHandler({ id: "post-1" }, deps);

      expect(redis.zrem).toHaveBeenCalledWith(
        CacheConfig.REDIS_KEYS.POPULAR_SET,
        "gone",
      );
      expect(revalidateTags.mock.calls).toEqual([[postTags("gone")]]);
    });

    it("should not revalidate when delete_post finds no post", async () => {
      mockUpdateReturning(undefined);

      await deletePostHandler({ id: "missing" }, deps);

      expect(revalidateTags).not.toHaveBeenCalled();
    });

    it("should revalidate the post tags after restore_post", async () => {
      mockUpdateReturning({ id: "post-1", slug: "back", title: "Back" });

      await restorePostHandler({ id: "post-1" }, deps);

      expect(revalidateTags.mock.calls).toEqual([[postTags("back")]]);
    });

    it("should revalidate the post tags after publish_post", async () => {
      mockSelectOne({
        id: "post-1",
        title: "Draft",
        slug: "draft",
        content: "Body",
        summary: null,
        status: "draft",
        publishedAt: null,
      });
      mockUpdateReturning({
        id: "post-1",
        slug: "draft",
        title: "Draft",
        publishedAt: new Date("2026-01-01"),
      });

      await publishPostHandler({ id: "post-1" }, deps);

      expect(revalidateTags.mock.calls).toEqual([[postTags("draft")]]);
    });

    describe("model overrides", () => {
      const savedRow = {
        provider: "openai",
        id: "gpt-x",
        displayName: "GPT X",
        inputRate: "1",
        outputRate: "2",
        cacheReadRate: null,
        cacheWriteRate: null,
        contextLimit: null,
        releaseDate: null,
        openWeights: null,
        source: "override",
        isOverride: true,
        aliasTarget: null,
        updatedAt: new Date("2026-01-01"),
      };

      beforeEach(() => {
        // Empty registry for loadPricing, no unpriced token_usage rows.
        mockDbSelect.mockImplementation(
          () =>
            ({
              from: (table: unknown) =>
                table === model
                  ? Promise.resolve([])
                  : { where: vi.fn().mockResolvedValue([]) },
            }) as any,
        );
      });

      it("should reprice and revalidate the usage tags after upsert_model_override", async () => {
        mockDbInsert.mockReturnValue({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([savedRow]),
            }),
          }),
        } as any);

        await upsertModelOverrideHandler(
          { provider: "openai", id: "gpt-x", inputRate: 1, outputRate: 2 },
          deps,
        );

        expect(revalidateTags.mock.calls).toEqual([
          [["usage", "models:providers"]],
        ]);
      });

      it("should reprice and revalidate the usage tags after delete_model_override removes a row", async () => {
        mockDbDelete.mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ provider: "openai", id: "gpt-x" }]),
          }),
        } as any);

        await deleteModelOverrideHandler(
          { provider: "openai", id: "gpt-x" },
          deps,
        );

        expect(revalidateTags.mock.calls).toEqual([
          [["usage", "models:providers"]],
        ]);
      });

      it("should not revalidate when delete_model_override removes nothing", async () => {
        mockDbDelete.mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        } as any);

        await deleteModelOverrideHandler(
          { provider: "openai", id: "gpt-x" },
          deps,
        );

        expect(revalidateTags).not.toHaveBeenCalled();
      });
    });
  });
});
