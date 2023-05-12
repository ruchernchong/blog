import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { method, query } = req;
    const slug = query?.slug as string;
    console.log(`Slug`, slug);

    if (!slug) {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const data = await prisma.views.findMany();
    console.log(`Data`, data);
    const views = data.length === 0 ? 0 : Number(data[0].count);
    console.log(`Views`, views);

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
