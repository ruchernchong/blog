import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const views = await prisma.views.findFirst();
    return res.status(200).json(views);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
};

export default handler;
