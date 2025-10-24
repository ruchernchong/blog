import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ERROR_IDS } from "@/constants/error-ids";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { db, posts } from "@/schema";
import { postIdSchema } from "@/types/api";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized. Please sign in to restore posts." },
      { status: 401 },
    );
  }

  let postId: string;

  // Validate params
  try {
    const resolvedParams = await params;
    postId = postIdSchema.parse(resolvedParams.id);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid post ID format" },
        { status: 400 },
      );
    }
    logError(ERROR_IDS.INVALID_PARAMS, error);
    return NextResponse.json(
      { message: "Invalid request parameters" },
      { status: 400 },
    );
  }

  try {
    // Restore: set deletedAt to null
    const [restoredPost] = await db
      .update(posts)
      .set({ deletedAt: null })
      .where(eq(posts.id, postId))
      .returning();

    if (!restoredPost) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Post restored successfully",
      post: restoredPost,
    });
  } catch (error) {
    logError(ERROR_IDS.POST_UPDATE_FAILED, error, { postId });

    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Failed to restore post" },
      { status: 500 },
    );
  }
};
