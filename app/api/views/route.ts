import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async () => {
  const data = await prisma.views.findMany();
  return NextResponse.json(data);
};
