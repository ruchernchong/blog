import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { BASE_URL } from "@/config";

export const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title");

  return new ImageResponse(
    <div
      style={{ background: `url("${BASE_URL}/opengraph-bg.png")` }}
      tw="flex flex-col w-full h-full items-center justify-center text-zinc-50"
    >
      <div tw="flex text-center mx-12">
        <h1 tw="text-6xl capitalize">{title}</h1>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
};
