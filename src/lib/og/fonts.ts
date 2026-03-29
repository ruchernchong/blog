import { cacheLife, cacheTag } from "next/cache";
import { OG_CONFIG } from "./config";

async function loadGoogleFont(
  font: string,
  weight: number,
  text?: string,
): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  cacheTag(`og:font:${font}:${weight}`);

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

export async function getOGFonts() {
  "use cache";
  cacheLife("max");
  cacheTag("og:fonts");

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
