import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { mediaService } from "@/lib/services";
import type { ToolExtra } from "./posts.tools";

function makeError(message: string): CallToolResult {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

export async function listMediaHandler(args: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<CallToolResult> {
  const { search, limit = 50, offset = 0 } = args;

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
}

export async function getMediaHandler(args: {
  id: string;
}): Promise<CallToolResult> {
  const { id } = args;

  const result = await mediaService.getMediaById(id);

  if (!result) {
    return makeError(`Media with id "${id}" not found`);
  }

  const output = {
    media: {
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
    },
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    structuredContent: output,
  };
}

export async function requestUploadHandler(args: {
  filename: string;
  mimeType: string;
  size: number;
}): Promise<CallToolResult> {
  const { filename, mimeType, size } = args;

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
}

export async function confirmUploadHandler(
  args: {
    key: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
  },
  extra: ToolExtra,
): Promise<CallToolResult> {
  const { key, filename, url, mimeType, size, width, height, alt, caption } =
    args;

  const uploadedById =
    (extra.authInfo?.extra?.userId as string | undefined) ?? undefined;

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
    uploadedById,
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
}

export async function uploadFromPathHandler(
  args: {
    filePath: string;
    alt?: string;
    caption?: string;
  },
  extra: ToolExtra,
): Promise<CallToolResult> {
  const { filePath, alt, caption } = args;

  const uploadedById =
    (extra.authInfo?.extra?.userId as string | undefined) ?? undefined;

  const result = await mediaService.uploadFromPath({
    filePath,
    alt,
    caption,
    uploadedById,
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
}

export async function uploadFromUrlHandler(
  args: {
    url: string;
    alt?: string;
    caption?: string;
  },
  extra: ToolExtra,
): Promise<CallToolResult> {
  const { url, alt, caption } = args;

  const uploadedById =
    (extra.authInfo?.extra?.userId as string | undefined) ?? undefined;

  const result = await mediaService.uploadFromUrl({
    url,
    alt,
    caption,
    uploadedById,
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
}

export async function deleteMediaHandler(args: {
  id: string;
}): Promise<CallToolResult> {
  const { id } = args;

  const deleted = await mediaService.softDeleteMedia(id);

  const output = {
    success: !!deleted,
    filename: deleted?.filename ?? null,
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    structuredContent: output,
  };
}

export function registerMediaTools(server: McpServer): void {
  server.registerTool(
    "list_media",
    {
      title: "List Media",
      description: "List uploaded media files with optional search",
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe("Search query to filter media by filename"),
        limit: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of items to return"),
        offset: z
          .number()
          .min(0)
          .optional()
          .describe("Number of items to skip for pagination"),
      }),
      outputSchema: z.object({
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
      }),
      annotations: {
        readOnlyHint: true,
      },
    },
    (args) => listMediaHandler(args),
  );

  server.registerTool(
    "get_media",
    {
      title: "Get Media",
      description: "Get a single media item by ID",
      inputSchema: z.object({
        id: z.string().describe("Media item UUID"),
      }),
      outputSchema: z.object({
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
      }),
      annotations: {
        readOnlyHint: true,
      },
    },
    (args) => getMediaHandler(args),
  );

  server.registerTool(
    "request_upload",
    {
      title: "Request Upload",
      description: "Get a presigned URL for uploading media to R2",
      inputSchema: z.object({
        filename: z.string().describe("Name of the file to upload"),
        mimeType: z
          .string()
          .describe("MIME type of the file (e.g., image/png)"),
        size: z.number().describe("File size in bytes"),
      }),
      outputSchema: z.object({
        uploadUrl: z.string(),
        key: z.string(),
        publicUrl: z.string(),
      }),
    },
    (args) => requestUploadHandler(args),
  );

  server.registerTool(
    "confirm_upload",
    {
      title: "Confirm Upload",
      description: "Confirm a completed upload and create the database record",
      inputSchema: z.object({
        key: z.string().describe("R2 object key from request_upload"),
        filename: z.string().describe("Original filename"),
        url: z.string().describe("Public URL of the uploaded file"),
        mimeType: z.string().describe("MIME type of the file"),
        size: z.number().describe("File size in bytes"),
        width: z.number().optional().describe("Image width in pixels"),
        height: z.number().optional().describe("Image height in pixels"),
        alt: z.string().optional().describe("Alt text for accessibility"),
        caption: z.string().optional().describe("Caption for the image"),
      }),
      outputSchema: z.object({
        media: z.object({
          id: z.string(),
          filename: z.string(),
          url: z.string(),
        }),
      }),
      annotations: {
        idempotentHint: true,
      },
    },
    (args, extra) => confirmUploadHandler(args, extra),
  );

  server.registerTool(
    "upload_from_path",
    {
      title: "Upload From Path",
      description:
        "Upload an image from a local file path to R2 storage. The MCP server reads the file directly from disk.",
      inputSchema: z.object({
        filePath: z
          .string()
          .describe(
            "Absolute path to the image file (e.g., '/Users/name/image.png')",
          ),
        alt: z.string().optional().describe("Alt text for accessibility"),
        caption: z.string().optional().describe("Caption for the image"),
      }),
      outputSchema: z.object({
        media: z.object({
          id: z.string(),
          filename: z.string(),
          url: z.string(),
          mimeType: z.string(),
          size: z.number(),
        }),
      }),
    },
    (args, extra) => uploadFromPathHandler(args, extra),
  );

  server.registerTool(
    "upload_from_url",
    {
      title: "Upload From URL",
      description:
        "Fetch an image from a public URL and upload it to R2 storage. IMPORTANT: Before calling this tool, you MUST confirm with the user: 1) The image URL to upload, 2) Alt text for accessibility. Only proceed after user confirms.",
      inputSchema: z.object({
        url: z.string().url().describe("The public URL of the image to upload"),
        alt: z.string().optional().describe("Alt text for accessibility"),
        caption: z.string().optional().describe("Caption for the image"),
      }),
      outputSchema: z.object({
        media: z.object({
          id: z.string(),
          filename: z.string(),
          url: z.string(),
          mimeType: z.string(),
          size: z.number(),
        }),
      }),
    },
    (args, extra) => uploadFromUrlHandler(args, extra),
  );

  server.registerTool(
    "delete_media",
    {
      title: "Delete Media",
      description:
        "Soft delete a media item. IMPORTANT: Before calling this tool, you MUST confirm with the user that they want to delete this specific media. Only proceed after explicit user confirmation.",
      inputSchema: z.object({
        id: z.string().describe("Media item UUID to delete"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        filename: z.string().nullable(),
      }),
      annotations: {
        destructiveHint: true,
      },
    },
    (args) => deleteMediaHandler(args),
  );
}
