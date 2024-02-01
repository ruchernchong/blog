import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async () => {
  noStore();
  const data = await prisma.views.findMany();
  return NextResponse.json(data);
};
