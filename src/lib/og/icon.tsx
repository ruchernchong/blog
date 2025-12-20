import { ImageResponse } from "next/og";

const TEXT = "R";
const FONT_FAMILY = "Figtree";

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data");
}

interface GenerateIconOptions {
  size: number;
  fontSize: number;
}

export async function generateIcon({ size, fontSize }: GenerateIconOptions) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#d4513b",
        borderRadius: "50%",
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          fontWeight: 600,
          color: "#ffffff",
          transform: "rotate(-15deg)",
        }}
      >
        {TEXT}
      </span>
    </div>,
    {
      width: size,
      height: size,
      fonts: [
        {
          name: FONT_FAMILY,
          data: await loadGoogleFont(FONT_FAMILY, TEXT),
          style: "normal",
        },
      ],
    },
  );
}
