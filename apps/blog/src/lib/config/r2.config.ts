export const R2Config = {
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
  ] as const,

  MAX_FILE_SIZE: 10 * 1024 * 1024,

  SIGNED_URL_EXPIRATION: 5 * 60,
} as const;

export type AllowedMimeType = (typeof R2Config.ALLOWED_MIME_TYPES)[number];
