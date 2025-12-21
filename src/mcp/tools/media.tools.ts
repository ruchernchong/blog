import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mediaService } from "@/lib/services";

export function registerMediaTools(server: McpServer): void {
  // List media with optional search
  server.registerTool(
    "list_media",
    {
      title: "List Media",
      description: "List uploaded media files with optional search",
      inputSchema: {
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      },
      outputSchema: {
        media: z.array(
          z.object({
            id: z.string(),
            filename: z.string(),
            url: z.string(),
            mimeType: z.string(),
            size: z.number(),
            width: z.number().nullable(),
            height: z.number().nullable(),
            alt: z.string().nullable(),
            caption: z.string().nullable(),
            createdAt: z.string(),
          }),
        ),
        total: z.number(),
      },
    },
    async ({ search, limit = 50, offset = 0 }) => {
      const result = await mediaService.getMediaList({
        search,
        limit,
        offset,
        verifyR2Existence: true,
      });

      const output = {
        media: result.map((m) => ({
          id: m.id,
          filename: m.filename,
          url: m.url,
          mimeType: m.mimeType,
          size: m.size,
          width: m.width,
          height: m.height,
          alt: m.alt,
          caption: m.caption,
          createdAt: m.createdAt.toISOString(),
        })),
        total: result.length,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Get single media item
  server.registerTool(
    "get_media",
    {
      title: "Get Media",
      description: "Get a single media item by ID",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        media: z
          .object({
            id: z.string(),
            key: z.string(),
            filename: z.string(),
            url: z.string(),
            mimeType: z.string(),
            size: z.number(),
            width: z.number().nullable(),
            height: z.number().nullable(),
            alt: z.string().nullable(),
            caption: z.string().nullable(),
            createdAt: z.string(),
          })
          .nullable(),
      },
    },
    async ({ id }) => {
      const result = await mediaService.getMediaById(id);

      const output = {
        media: result
          ? {
              id: result.id,
              key: result.key,
              filename: result.filename,
              url: result.url,
              mimeType: result.mimeType,
              size: result.size,
              width: result.width,
              height: result.height,
              alt: result.alt,
              caption: result.caption,
              createdAt: result.createdAt.toISOString(),
            }
          : null,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Request presigned upload URL
  server.registerTool(
    "request_upload",
    {
      title: "Request Upload",
      description: "Get a presigned URL for uploading media to R2",
      inputSchema: {
        filename: z.string(),
        mimeType: z.string(),
        size: z.number(),
      },
      outputSchema: {
        uploadUrl: z.string(),
        key: z.string(),
        publicUrl: z.string(),
      },
    },
    async ({ filename, mimeType, size }) => {
      const result = await mediaService.requestUpload({
        filename,
        mimeType,
        size,
      });

      const output = {
        uploadUrl: result.uploadUrl,
        key: result.key,
        publicUrl: result.publicUrl,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Confirm upload and create database record
  server.registerTool(
    "confirm_upload",
    {
      title: "Confirm Upload",
      description: "Confirm a completed upload and create the database record",
      inputSchema: {
        key: z.string(),
        filename: z.string(),
        url: z.string(),
        mimeType: z.string(),
        size: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      },
      outputSchema: {
        media: z.object({
          id: z.string(),
          filename: z.string(),
          url: z.string(),
        }),
      },
    },
    async ({
      key,
      filename,
      url,
      mimeType,
      size,
      width,
      height,
      alt,
      caption,
    }) => {
      const result = await mediaService.confirmUpload({
        key,
        filename,
        url,
        mimeType,
        size,
        width,
        height,
        alt,
        caption,
      });

      const output = {
        media: {
          id: result.id,
          filename: result.filename,
          url: result.url,
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Upload media from local file path
  server.registerTool(
    "upload_from_path",
    {
      title: "Upload From Path",
      description:
        "Upload an image from a local file path to R2 storage. The MCP server reads the file directly from disk.",
      inputSchema: {
        filePath: z
          .string()
          .describe(
            "Absolute path to the image file (e.g., '/Users/name/image.png')",
          ),
        alt: z.string().optional().describe("Alt text for accessibility"),
        caption: z.string().optional().describe("Caption for the image"),
      },
      outputSchema: {
        media: z.object({
          id: z.string(),
          filename: z.string(),
          url: z.string(),
          mimeType: z.string(),
          size: z.number(),
        }),
      },
    },
    async ({ filePath, alt, caption }) => {
      const result = await mediaService.uploadFromPath({
        filePath,
        alt,
        caption,
      });

      const output = {
        media: {
          id: result.id,
          filename: result.filename,
          url: result.url,
          mimeType: result.mimeType,
          size: result.size,
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Upload media from URL
  server.registerTool(
    "upload_from_url",
    {
      title: "Upload From URL",
      description:
        "Fetch an image from a public URL and upload it to R2 storage. IMPORTANT: Before calling this tool, you MUST confirm with the user: 1) The image URL to upload, 2) Alt text for accessibility. Only proceed after user confirms.",
      inputSchema: {
        url: z.string().url().describe("The public URL of the image to upload"),
        alt: z.string().optional().describe("Alt text for accessibility"),
        caption: z.string().optional().describe("Caption for the image"),
      },
      outputSchema: {
        media: z.object({
          id: z.string(),
          filename: z.string(),
          url: z.string(),
          mimeType: z.string(),
          size: z.number(),
        }),
      },
    },
    async ({ url, alt, caption }) => {
      const result = await mediaService.uploadFromUrl({ url, alt, caption });

      const output = {
        media: {
          id: result.id,
          filename: result.filename,
          url: result.url,
          mimeType: result.mimeType,
          size: result.size,
        },
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  // Soft delete media
  server.registerTool(
    "delete_media",
    {
      title: "Delete Media",
      description:
        "Soft delete a media item. IMPORTANT: Before calling this tool, you MUST confirm with the user that they want to delete this specific media. Only proceed after explicit user confirmation.",
      inputSchema: {
        id: z.string(),
      },
      outputSchema: {
        success: z.boolean(),
        filename: z.string().nullable(),
      },
    },
    async ({ id }) => {
      const deleted = await mediaService.softDeleteMedia(id);

      const output = {
        success: !!deleted,
        filename: deleted?.filename ?? null,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );
}
