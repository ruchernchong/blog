import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { Section } from "@/lib/og/templates/section";

export const alt = "Blog - Ru Chern";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fonts = await getOGFonts();

  return new ImageResponse(
    <Section
      title="Blog"
      description="Posts on coding, tech, and random thoughts"
    />,
    {
      ...size,
      fonts,
    },
  );
}
