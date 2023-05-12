import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { method, query } = req;
    const slug = query?.slug as string;

    if (!slug) {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const data = await prisma.views.findFirst({
      where: { slug },
    });
    const views = data.count;

    switch (method) {
      case "POST":
        await prisma.views.upsert({
          where: { slug },
          create: { slug, count: 1 },
          update: { count: views + 1 },
        });

        return res.status(200).json({ views: views + 1 });
      case "GET":
        return res.status(200).json({ views });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
};

export default handler;
