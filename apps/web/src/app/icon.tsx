import { generateIcon } from "@/lib/og/icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  return generateIcon({ size: 64, fontSize: 40 });
}
