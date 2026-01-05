import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { generatePostMetadata } from "@/lib/post-metadata";
import {
  invalidatePopularPost,
  invalidateRelatedByTags,
} from "@/lib/services/cache-invalidation";
import { db, posts } from "@/schema";

export function registerPostTools(server: McpServer): void {
  // List posts with optional filters
  server.registerTool(
    "list_posts",
    {
      title: "List Posts",
      description: "List all blog posts with optional status filter",
      inputSchema: {
        status: z.enum(["draft", "published"]).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        includeDeleted: z.boolean().optional(),
      },
      outputSchema: {
        posts: z.array(
          z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            summary: z.string().nullable(),
            status: z.string(),
            tags: z.array(z.string()),
            featured: z.boolean(),
            publishedAt: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
        ),
        total: z.number(),
      },
    },
    async ({ status, limit = 50, offset = 0, includeDeleted = false }) => {
      const conditions = [];

      if (!includeDeleted) {
        conditions.push(isNull(posts.deletedAt));
      }

      if (status) {
        conditions.push(eq(posts.status, status));
      }

      const result = await db
        .select()
        .from(posts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(posts.updatedAt))
        .limit(limit)
        .offset(offset);

      const output = {
        posts: result.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          status: p.status,
          tags: p.tags,
          featured: p.featured,
          publishedAt: p.publishedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        total: result.length,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Get single post by ID or slug
  server.registerTool(
    "get_post",
    {
      title: "Get Post",
      description: "Get a single blog post by ID or slug",
      inputSchema: {
        id: z.string().optional(),
        slug: z.string().optional(),
      },
      outputSchema: {
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            summary: z.string().nullable(),
            content: z.string(),
            status: z.string(),
            tags: z.array(z.string()),
            featured: z.boolean(),
            coverImage: z.string().nullable(),
            publishedAt: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string(),
          })
          .nullable(),
      },
    },
    async ({ id, slug }) => {
      if (!id && !slug) {
        throw new Error("Either id or slug must be provided");
      }

      const condition = id ? eq(posts.id, id) : eq(posts.slug, slug!);

      const [result] = await db
        .select()
        .from(posts)
        .where(and(condition, isNull(posts.deletedAt)))
        .limit(1);

      const output = {
        post: result
          ? {
              id: result.id,
              slug: result.slug,
              title: result.title,
              summary: result.summary,
              content: result.content,
              status: result.status,
              tags: result.tags,
              featured: result.featured,
              coverImage: result.coverImage,
              publishedAt: result.publishedAt?.toISOString() ?? null,
              createdAt: result.createdAt.toISOString(),
              updatedAt: result.updatedAt.toISOString(),
            }
          : null,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Create new post
  server.registerTool(
    "create_post",
    {
      title: "Create Post",
      description:
        "Create a new blog post with auto-generated metadata. IMPORTANT: Before calling this tool, you MUST first discuss and confirm with the user: 1) Post title and slug, 2) Content outline or full content, 3) Tags to apply, 4) Whether to publish immediately or save as draft. Only proceed after user confirms all details.",
      inputSchema: {
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(100),
        content: z.string().min(1),
        summary: z.string().max(500).optional(),
        status: z.enum(["draft", "published"]).optional(),
        tags: z.array(z.string()).optional(),
        coverImage: z.string().optional(),
        featured: z.boolean().optional(),
      },
      outputSchema: {
        post: z.object({
          id: z.string(),
          slug: z.string(),
          title: z.string(),
          status: z.string(),
        }),
      },
    },
    async ({
      title,
      slug,
      content,
      summary,
      status = "draft",
      tags = [],
      coverImage,
      featured = false,
    }) => {
      const publishedAt = status === "published" ? new Date() : null;
      const metadata = generatePostMetadata(
        title,
        slug,
        content,
        summary ?? null,
        publishedAt,
      );

      const [created] = await db
        .insert(posts)
        .values({
          title,
          slug,
          content,
          summary: summary ?? null,
          status,
          tags,
          coverImage: coverImage ?? null,
          featured,
          metadata,
          publishedAt,
        })
        .returning();

      const output = {
        post: {
          id: created.id,
          slug: created.slug,
          title: created.title,
          status: created.status,
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Update existing post
  server.registerTool(
    "update_post",
    {
      title: "Update Post",
      description:
        "Update an existing blog post. IMPORTANT: Before calling this tool, you MUST confirm with the user which fields to update and their new values. Only proceed after user confirms all changes.",
      inputSchema: {
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        slug: z.string().min(1).max(100).optional(),
        content: z.string().min(1).optional(),
        summary: z.string().max(500).optional(),
        status: z.enum(["draft", "published"]).optional(),
        tags: z.array(z.string()).optional(),
        coverImage: z.string().nullable().optional(),
        featured: z.boolean().optional(),
      },
      outputSchema: {
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            status: z.string(),
          })
          .nullable(),
      },
    },
    async ({ id, ...updates }) => {
      // Get existing post
      const [existing] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      if (!existing) {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify({ post: null }) },
          ],
          structuredContent: { post: null },
        };
      }

      const oldSlug = existing.slug;
      const oldTags = existing.tags;

      // Determine publishedAt
      let publishedAt = existing.publishedAt;
      if (updates.status === "published" && !existing.publishedAt) {
        publishedAt = new Date();
      } else if (updates.status === "draft") {
        publishedAt = null;
      }

      // Regenerate metadata
      const title = updates.title ?? existing.title;
      const slug = updates.slug ?? existing.slug;
      const content = updates.content ?? existing.content;
      const summary = updates.summary ?? existing.summary;

      const metadata = generatePostMetadata(
        title,
        slug,
        content,
        summary,
        publishedAt,
      );

      const [updated] = await db
        .update(posts)
        .set({
          ...updates,
          metadata,
          publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, id))
        .returning();

      // Invalidate cache if slug or tags changed
      if (updates.slug && updates.slug !== oldSlug) {
        await invalidatePopularPost(oldSlug);
      }
      if (
        updates.tags &&
        JSON.stringify(updates.tags) !== JSON.stringify(oldTags)
      ) {
        await invalidateRelatedByTags([...oldTags, ...updates.tags], slug);
      }

      const output = {
        post: {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          status: updated.status,
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Soft delete post
  server.registerTool(
    "delete_post",
    {
      title: "Delete Post",
      description:
        "Soft delete a blog post. IMPORTANT: Before calling this tool, you MUST confirm with the user that they want to delete this specific post. Only proceed after explicit user confirmation.",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        success: z.boolean(),
        slug: z.string().nullable(),
      },
    },
    async ({ id }) => {
      const [deleted] = await db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();

      if (deleted) {
        await invalidatePopularPost(deleted.slug);
      }

      const output = {
        success: !!deleted,
        slug: deleted?.slug ?? null,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Restore soft-deleted post
  server.registerTool(
    "restore_post",
    {
      title: "Restore Post",
      description: "Restore a soft-deleted blog post",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        success: z.boolean(),
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
          })
          .nullable(),
      },
    },
    async ({ id }) => {
      const [restored] = await db
        .update(posts)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();

      const output = {
        success: !!restored,
        post: restored
          ? {
              id: restored.id,
              slug: restored.slug,
              title: restored.title,
            }
          : null,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Publish a draft post
  server.registerTool(
    "publish_post",
    {
      title: "Publish Post",
      description:
        "Publish a draft blog post (sets publishedAt). IMPORTANT: Before calling this tool, you MUST confirm with the user that they want to publish this post. Only proceed after explicit user confirmation.",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        success: z.boolean(),
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            publishedAt: z.string(),
          })
          .nullable(),
      },
    },
    async ({ id }) => {
      const [existing] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id))
        .limit(1);

      if (!existing) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: false, post: null }),
            },
          ],
          structuredContent: { success: false, post: null },
        };
      }

      const publishedAt = existing.publishedAt ?? new Date();
      const metadata = generatePostMetadata(
        existing.title,
        existing.slug,
        existing.content,
        existing.summary,
        publishedAt,
      );

      const [published] = await db
        .update(posts)
        .set({
          status: "published",
          publishedAt,
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, id))
        .returning();

      const output = {
        success: true,
        post: {
          id: published.id,
          slug: published.slug,
          title: published.title,
          publishedAt: published.publishedAt!.toISOString(),
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );
}
