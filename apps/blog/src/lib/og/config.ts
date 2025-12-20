/**
 * OG image configuration
 */
export const OG_CONFIG = {
  /** Standard OG image dimensions */
  width: 1200,
  height: 630,

  /** Font family (must match fonts.ts) */
  fontFamily: "Figtree",

  /** Author name for blog posts */
  author: "Ru Chern Chong",

  /** Site name for branding */
  siteName: "Ru Chern",

  /** Site URL for branding */
  siteUrl: "ruchern.dev",

  /** Border radius in pixels (--radius: 0.625rem = 10px) */
  borderRadius: 10,
} as const;

/** Exported size object for Next.js OG image metadata */
export const OG_SIZE = {
  width: OG_CONFIG.width,
  height: OG_CONFIG.height,
} as const;
