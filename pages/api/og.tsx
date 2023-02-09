import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { HOST_URL } from "config";

export const config = {
  runtime: "edge"
};

const handler = (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const hasTitle = searchParams.has("title");
    const title = hasTitle ? searchParams.get("title")?.slice(0, 100) : "";
    const hasDate = searchParams.has("date");
    const date = hasDate ? searchParams.get("date") : "";

    return new ImageResponse(
      (
        <div
          style={{
            background: `url("${HOST_URL}/cover-image.png")`,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            textAlign: "center",
          }}
          tw="text-white"
        >
          <div tw="flex flex-col items-center mb-12">
            <div tw="text-6xl">{title}</div>
            <div tw="text-2xl">{date}</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response("Failed to generate the image", { status: 500 });
  }
};

export default handler;
