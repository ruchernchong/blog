import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing handlers
vi.mock("@/schema", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  posts: {
    id: "posts.id",
    slug: "posts.slug",
    status: "posts.status",
    deletedAt: "posts.deletedAt",
  },
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

vi.mock("@/lib/services/cache-invalidation", () => ({
  invalidatePost: vi.fn(),
  invalidatePopularPost: vi.fn(),
  invalidateRelatedByTags: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  mediaService: {
    confirmUpload: vi.fn(),
    uploadFromPath: vi.fn(),
    uploadFromUrl: vi.fn(),
  },
}));

import { generatePostMetadata } from "@/lib/post-metadata";
import { mediaService } from "@/lib/services";
import { db, posts } from "@/schema";
import {
  confirmUploadHandler,
  uploadFromPathHandler,
  uploadFromUrlHandler,
} from "../../tools/media.tools";
import { createPostHandler, saveDraftHandler } from "../../tools/posts.tools";

const mockDbSelect = vi.mocked(db.select);
const mockDbInsert = vi.mocked(db.insert);
const mockDbUpdate = vi.mocked(db.update);
const mockGeneratePostMetadata = vi.mocked(generatePostMetadata);

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
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(
        "Cannot use save_draft on a published post",
      );
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
});
