import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ViewCount } from "@/types";

interface RequestParams {
  params: {
    slug: string;
  };
}

export const POST = async (req: NextRequest, { params }: RequestParams) => {
  noStore();
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json(handleInvalidSlug(), { status: 400 });
  }

  const views = await getViewsBySlug(slug);
  await updateViews(slug, views);

  return NextResponse.json({ views: views + 1 });
};

export const GET = async (req: NextRequest, { params }: RequestParams) => {
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json(handleInvalidSlug(), { status: 400 });
  }

  const views = await getViewsBySlug(slug);

  return NextResponse.json({ views });
};

const handleInvalidSlug = () => {
  return {
    error: "Invalid slug",
  };
};

const getViewsBySlug = async (slug: string): Promise<number> => {
  const data = await prisma.views.findMany({
    where: {
      slug: { equals: slug },
    },
  });

  return data.length === 0 ? 0 : data[0].count;
};

const updateViews = async (slug: string, count: number): Promise<ViewCount> => {
  return await prisma.views.upsert({
    where: { slug },
    create: { slug, count: 1 },
    update: { count: count + 1 },
  });
};
