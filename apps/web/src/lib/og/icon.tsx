import { ImageResponse } from "next/og";
import { OG_COLOURS } from "@/lib/og/colours";

interface GenerateIconOptions {
  size: number;
}

export async function generateIcon({ size }: GenerateIconOptions) {
  return new ImageResponse(
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="16" fill={OG_COLOURS.foreground} />
      <path
        d="M10 11 L15 16 L10 21"
        stroke={OG_COLOURS.primary}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="17.5"
        y1="21"
        x2="23"
        y2="21"
        stroke={OG_COLOURS.primary}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>,
    {
      width: size,
      height: size,
    },
  );
}
