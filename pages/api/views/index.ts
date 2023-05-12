import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await prisma.views.findMany();
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
};

export default handler;
