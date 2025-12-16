import { z } from "zod";

/**
 * Validation schema for creating a new blog post via API.
 *
 * Ensures all required fields are present and valid before database insertion.
 */
export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  summary: z
    .string()
    .max(500, "Summary too long")
    .nullable()
    .optional()
    .transform((val) => val || null),
  content: z
    .string()
    .min(1, "Content is required")
    .max(100000, "Content too long"),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z
    .array(z.string())
    .or(
      z.string().transform((str) =>
        str
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      ),
    )
    .default([]),
  coverImage: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .optional()
    .transform((val) => val || null),
  featured: z.boolean().optional().default(false),
});

/**
 * Validation schema for updating an existing blog post via API.
 *
 * All fields are optional to support partial updates.
 */
export const updatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
  summary: z.string().max(500, "Summary too long").nullable().optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(100000, "Content too long")
    .optional(),
  status: z.enum(["draft", "published"]).optional(),
  tags: z
    .array(z.string())
    .or(
      z.string().transform((str) =>
        str
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      ),
    )
    .optional(),
  coverImage: z.string().url("Must be a valid URL").nullable().optional(),
  featured: z.boolean().optional(),
});

/**
 * Inferred TypeScript type for create post request body
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Inferred TypeScript type for update post request body
 */
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

/**
 * Validation schema for post ID parameter
 */
export const postIdSchema = z.string().uuid("Invalid post ID format");

/**
 * Helper function to validate and parse request body
 *
 * @param schema - Zod schema to validate against
 * @param data - Raw request data
 * @returns Validated and transformed data
 * @throws ZodError if validation fails
 */
export const validateRequestBody = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T => schema.parse(data);

export const mediaIdSchema = z.string().uuid("Invalid media ID format");

export const requestUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().positive("File size must be positive"),
  isTemp: z.boolean().optional().default(false),
});

export const confirmUploadSchema = z.object({
  key: z.string().min(1, "Key is required"),
  filename: z.string().min(1, "Filename is required"),
  url: z.string().url("Must be a valid URL"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().positive("File size must be positive"),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export const confirmTempUploadSchema = confirmUploadSchema.extend({
  slug: z.string().min(1, "Slug is required for temp uploads"),
});

export const updateMediaSchema = z.object({
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type ConfirmTempUploadInput = z.infer<typeof confirmTempUploadSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
