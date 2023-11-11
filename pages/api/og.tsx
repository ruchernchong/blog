import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { HOST_URL } from "@/config";

export const config = {
  runtime: "edge",
};

const handler = (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get("title")?.slice(0, 100);

    return new ImageResponse(
      (
        <div
          style={{
            background: `url("${HOST_URL}/images/post-cover-image.png")`,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
          tw="text-neutral-50"
        >
          <div tw="flex ml-[64px]">
            <div tw="text-6xl">{title}</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(`${e.message}`);
    return new Response("Failed to generate the image", { status: 500 });
  }
};

export default handler;
