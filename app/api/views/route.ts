import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ViewCount } from "@/types";

export const GET = async (): Promise<NextResponse<ViewCount[]>> => {
  noStore();
  const views: ViewCount[] = await prisma.views.findMany();
  return NextResponse.json(views);
};
