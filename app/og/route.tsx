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
          background: `url("${BASE_URL}/images/post-cover-image.png")`,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
        tw="text-neutral-50 border border-8 border-indigo-300"
      >
        <div tw="flex ml-[64px]">
          <h1 tw="text-6xl">{title}</h1>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
};
