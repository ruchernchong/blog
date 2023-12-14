import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { BASE_URL } from "@/config";

export const runtime = "edge";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.slice(0, 100);

  return new ImageResponse(
    (
      <div
        style={{
          background: `url("${BASE_URL}/images/cover-image.png")`,
        }}
        tw="flex flex-col w-full h-full justify-center text-gray-50"
      >
        <div tw="flex w-full max-w-[75%] mx-16">
          <h1 tw="text-6xl capitalize">{title}</h1>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
};
