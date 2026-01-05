import { cacheLife } from "next/cache";
import { OG_CONFIG } from "./config";

/**
 * Load a Google Font for use in OG images
 *
 * @see lib/og/icon.tsx for the original pattern
 */
async function loadGoogleFont(
  font: string,
  weight: number,
  text?: string,
): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");

  const params = new URLSearchParams({
    family: `${font}:wght@${weight}`,
  });

  if (text) {
    params.set("text", text);
  }

  const url = `https://fonts.googleapis.com/css2?${params.toString()}`;
  const css = await (await fetch(url)).text();

  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype|woff2)'\)/,
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error(`Failed to load font: ${font} weight ${weight}`);
}

/**
 * Get Figtree fonts for OG images
 *
 * Returns regular (400) and bold (700) weights
 */
export async function getOGFonts() {
  const [regular, bold] = await Promise.all([
    loadGoogleFont(OG_CONFIG.fontFamily, 400),
    loadGoogleFont(OG_CONFIG.fontFamily, 700),
  ]);

  return [
    {
      name: OG_CONFIG.fontFamily,
      data: regular,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: OG_CONFIG.fontFamily,
      data: bold,
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
}
