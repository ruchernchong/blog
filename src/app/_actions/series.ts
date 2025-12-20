"use server";

import { eq } from "drizzle-orm";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, series } from "@/schema";
import type { CreateSeriesInput, UpdateSeriesInput } from "@/types/api";

export async function createSeries(input: CreateSeriesInput) {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session) {
    throw new Error("Unauthorised");
  }

  const [created] = await db.insert(series).values(input).returning();

  revalidatePath("/studio/series");
  redirect("/studio/series" as Route);

  return created;
}

export async function updateSeries(id: string, input: UpdateSeriesInput) {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session) {
    throw new Error("Unauthorised");
  }

  const [existing] = await db
    .select()
    .from(series)
    .where(eq(series.id, id))
    .limit(1);

  if (!existing) {
    throw new Error("Series not found");
  }

  const [updated] = await db
    .update(series)
    .set({
      title: input.title ?? existing.title,
      slug: input.slug ?? existing.slug,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status,
      coverImage: input.coverImage ?? existing.coverImage,
      updatedAt: new Date(),
    })
    .where(eq(series.id, id))
    .returning();

  revalidatePath("/studio/series");
  revalidatePath(`/studio/series/${id}/edit`);

  return updated;
}

export async function deleteSeries(id: string) {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session) {
    throw new Error("Unauthorised");
  }

  await db
    .update(series)
    .set({ deletedAt: new Date() })
    .where(eq(series.id, id));

  revalidatePath("/studio/series");
}

export async function restoreSeries(id: string) {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session) {
    throw new Error("Unauthorised");
  }

  await db
    .update(series)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(series.id, id));

  revalidatePath("/studio/series");
}
