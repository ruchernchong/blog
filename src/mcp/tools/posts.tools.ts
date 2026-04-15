import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, desc, eq, isNull } from "drizzle-orm";
import slugify from "slugify";
import { z } from "zod";
import { generatePostMetadata } from "@/lib/post-metadata";
import {
  invalidatePopularPost,
  invalidatePost,
  invalidateRelatedByTags,
} from "@/lib/services/cache-invalidation";
import { db, posts } from "@/schema";

function makeError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

export function registerPostTools(server: McpServer): void {
  server.registerTool(
    "list_posts",
    {
      title: "List Posts",
      description: "List all blog posts with optional status filter",
      inputSchema: z.object({
        status: z
          .enum(["draft", "published"])
          .optional()
          .describe("Filter by post status"),
        limit: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of posts to return"),
        offset: z
          .number()
          .min(0)
          .optional()
          .describe("Number of posts to skip for pagination"),
        includeDeleted: z
          .boolean()
          .optional()
          .describe("Include soft-deleted posts in results"),
      }),
      outputSchema: z.object({
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
      }),
      annotations: {
        readOnlyHint: true,
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

  server.registerTool(
    "get_post",
    {
      title: "Get Post",
      description: "Get a single blog post by ID or slug",
      inputSchema: z.object({
        id: z.string().optional().describe("Post UUID"),
        slug: z.string().optional().describe("Post URL slug"),
      }),
      outputSchema: z.object({
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
      }),
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ id, slug }) => {
      if (!id && !slug) {
        return makeError("Either id or slug must be provided");
      }

      const condition = id ? eq(posts.id, id) : eq(posts.slug, slug as string);

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

  server.registerTool(
    "create_post",
    {
      title: "Create Post",
      description:
        "Create a new blog post with auto-generated metadata. IMPORTANT: Before calling this tool, you MUST first discuss and confirm with the user: 1) Post title and slug, 2) Content outline or full content, 3) Tags to apply, 4) Whether to publish immediately or save as draft. Only proceed after user confirms all details.",
      inputSchema: z.object({
        title: z.string().min(1).max(200).describe("Post title"),
        slug: z.string().min(1).max(100).describe("URL-friendly post slug"),
        content: z.string().min(1).describe("Post content in MDX format"),
        summary: z
          .string()
          .max(500)
          .optional()
          .describe("Brief post summary for SEO and previews"),
        status: z
          .enum(["draft", "published"])
          .optional()
          .describe("Post status; defaults to draft"),
        tags: z.array(z.string()).optional().describe("Array of tag strings"),
        coverImage: z.string().optional().describe("Cover image URL"),
        featured: z
          .boolean()
          .optional()
          .describe("Whether the post is featured"),
      }),
      outputSchema: z.object({
        post: z.object({
          id: z.string(),
          slug: z.string(),
          title: z.string(),
          status: z.string(),
        }),
      }),
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

  server.registerTool(
    "save_draft",
    {
      title: "Save Draft",
      description:
        "Save a draft post with minimal required fields. Use this for incremental drafting — start with a title, add content progressively. If an id is provided, updates an existing draft; otherwise creates a new one. Only works on drafts — published posts cannot be modified with this tool.",
      inputSchema: z.object({
        id: z
          .string()
          .optional()
          .describe(
            "Existing post ID to update. If omitted, a new draft is created.",
          ),
        title: z.string().min(1).max(200).describe("Post title (required)"),
        slug: z
          .string()
          .max(100)
          .optional()
          .describe("URL-friendly slug. Auto-generated from title if omitted."),
        content: z
          .string()
          .optional()
          .describe(
            "Post content in MDX format. Empty string if not yet written.",
          ),
        summary: z.string().max(500).optional().describe("Brief post summary"),
        tags: z.array(z.string()).optional().describe("Array of tag strings"),
      }),
      outputSchema: z.object({
        post: z.object({
          id: z.string(),
          slug: z.string(),
          title: z.string(),
          status: z.string(),
        }),
      }),
      annotations: {
        idempotentHint: true,
      },
    },
    async ({ id, title, slug: slugInput, content, summary, tags = [] }) => {
      const slug =
        slugInput ||
        slugify(title, { lower: true, strict: true }) ||
        title.toLowerCase().replace(/\s+/g, "-");

      const postContent = content ?? "";

      if (id) {
        const [existing] = await db
          .select()
          .from(posts)
          .where(eq(posts.id, id))
          .limit(1);

        if (!existing) {
          return makeError(`Post with id "${id}" not found`);
        }

        if (existing.status === "published") {
          return makeError(
            "Cannot use save_draft on a published post. Use update_post instead.",
          );
        }

        const mergedTitle = title ?? existing.title;
        const mergedSlug = slug ?? existing.slug;
        const mergedContent = postContent || existing.content;
        const mergedSummary = summary ?? existing.summary;

        const metadata = generatePostMetadata(
          mergedTitle,
          mergedSlug,
          mergedContent,
          mergedSummary,
          null,
        );

        const [updated] = await db
          .update(posts)
          .set({
            title: mergedTitle,
            slug: mergedSlug,
            content: mergedContent,
            summary: mergedSummary,
            tags,
            metadata,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, id))
          .returning();

        await invalidatePost(mergedSlug);

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
      }

      const metadata = generatePostMetadata(
        title,
        slug,
        postContent,
        summary ?? null,
        null,
      );

      const [created] = await db
        .insert(posts)
        .values({
          title,
          slug,
          content: postContent,
          summary: summary ?? null,
          status: "draft",
          tags,
          metadata,
          publishedAt: null,
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

  server.registerTool(
    "update_post",
    {
      title: "Update Post",
      description:
        "Update an existing blog post. IMPORTANT: Before calling this tool, you MUST confirm with the user which fields to update and their new values. Only proceed after user confirms all changes.",
      inputSchema: z.object({
        id: z.string().describe("Post ID to update"),
        title: z.string().min(1).max(200).optional().describe("New post title"),
        slug: z.string().min(1).max(100).optional().describe("New URL slug"),
        content: z
          .string()
          .min(1)
          .optional()
          .describe("New post content in MDX format"),
        summary: z.string().max(500).optional().describe("New post summary"),
        status: z
          .enum(["draft", "published"])
          .optional()
          .describe("New post status"),
        tags: z
          .array(z.string())
          .optional()
          .describe("New array of tag strings"),
        coverImage: z
          .string()
          .nullable()
          .optional()
          .describe("New cover image URL, or null to remove"),
        featured: z.boolean().optional().describe("New featured flag"),
      }),
      outputSchema: z.object({
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            status: z.string(),
          })
          .nullable(),
      }),
      annotations: {
        idempotentHint: true,
      },
    },
    async ({ id, ...updates }) => {
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

      let publishedAt = existing.publishedAt;
      if (updates.status === "published" && !existing.publishedAt) {
        publishedAt = new Date();
      } else if (updates.status === "draft") {
        publishedAt = null;
      }

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

  server.registerTool(
    "delete_post",
    {
      title: "Delete Post",
      description:
        "Soft delete a blog post. IMPORTANT: Before calling this tool, you MUST confirm with the user that they want to delete this specific post. Only proceed after explicit user confirmation.",
      inputSchema: z.object({
        id: z.string().describe("Post ID to delete"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        slug: z.string().nullable(),
      }),
      annotations: {
        destructiveHint: true,
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

  server.registerTool(
    "restore_post",
    {
      title: "Restore Post",
      description: "Restore a soft-deleted blog post",
      inputSchema: z.object({
        id: z.string().describe("Post ID to restore"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
          })
          .nullable(),
      }),
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

  server.registerTool(
    "publish_post",
    {
      title: "Publish Post",
      description:
        "Publish a draft blog post (sets publishedAt). IMPORTANT: Before calling this tool, you MUST confirm with the user that they want to publish this post. Only proceed after explicit user confirmation.",
      inputSchema: z.object({
        id: z.string().describe("Post ID to publish"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        post: z
          .object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            publishedAt: z.string(),
          })
          .nullable(),
      }),
      annotations: {
        destructiveHint: true,
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

      if (existing.status === "published") {
        return makeError(
          `Post "${existing.title}" is already published. Use update_post to modify it.`,
        );
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
          publishedAt: (published.publishedAt ?? new Date()).toISOString(),
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );
}
