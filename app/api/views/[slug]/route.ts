import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import type { Views } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface RequestParams {
  params: {
    slug: string;
  };
}

export const runtime = "edge";

export const POST = async (req: NextRequest, { params }: RequestParams) => {
  noStore();
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json(handleInvalidSlug(), { status: 400 });
  }

  const viewCount = await getViewCountBySlug(slug);
  await updateViewCount(slug, viewCount);
  return NextResponse.json({ count: viewCount + 1 });
};

export const GET = async (req: NextRequest, { params }: RequestParams) => {
  noStore();
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json(handleInvalidSlug(), { status: 400 });
  }

  const viewCount = await getViewCountBySlug(slug);
  return NextResponse.json({ count: viewCount });
};

const handleInvalidSlug = () => ({
  error: "Invalid slug",
});

const getViewCountBySlug = async (slug: string): Promise<number> => {
  const data: Views | null = await prisma.views.findUnique({
    where: { slug },
  });

  return data?.count || 0;
};

const updateViewCount = (slug: string, count: number): Promise<Views> =>
  prisma.views.upsert({
    where: { slug },
    create: { slug, count: 1 },
    update: { count: count + 1 },
  });
