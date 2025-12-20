import { ImageResponse } from "next/og";
import { OG_SIZE } from "@/lib/og/config";
import { getOGFonts } from "@/lib/og/fonts";
import { Section } from "@/lib/og/templates/section";

export const alt = "Dashboard - Ru Chern";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fonts = await getOGFonts();

  return new ImageResponse(
    <Section
      title="Dashboard"
      description="Real-time analytics and GitHub statistics"
    />,
    {
      ...size,
      fonts,
    },
  );
}
