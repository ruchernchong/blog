import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { Section } from "@/lib/og/templates/section";

export const alt = "Projects - Ru Chern";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fonts = await getOGFonts();

  return new ImageResponse(
    <Section
      title="Projects"
      description="A showcase of completed projects and experiments with new technologies"
    />,
    {
      ...size,
      fonts,
    },
  );
}
