import { generateIcon } from "@/lib/og/icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return generateIcon({ size: 180, fontSize: 112 });
}
