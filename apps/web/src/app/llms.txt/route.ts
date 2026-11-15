import { NextResponse } from "next/server";
import { getLlmsContent } from "@/lib/llms";

export async function GET() {
  const content = await getLlmsContent();

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
    },
  });
}
