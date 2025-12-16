import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Note: This constant is duplicated from @/config because Convex functions
// run in an isolated environment and cannot import from the Next.js app.
// Keep in sync with apps/blog/src/config/index.ts
const MAX_LIKES_PER_USER = 50;

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("likes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return records.reduce((sum, record) => sum + record.count, 0);
  },
});

export const getByUser = query({
  args: { slug: v.string(), userHash: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("likes")
      .withIndex("by_slug_user", (q) =>
        q.eq("slug", args.slug).eq("userHash", args.userHash),
      )
      .first();
    return record?.count ?? 0;
  },
});

export const increment = mutation({
  args: { slug: v.string(), userHash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_slug_user", (q) =>
        q.eq("slug", args.slug).eq("userHash", args.userHash),
      )
      .first();

    if (existing) {
      if (existing.count >= MAX_LIKES_PER_USER) {
        return;
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("likes", {
        slug: args.slug,
        userHash: args.userHash,
        count: 1,
      });
    }
  },
});
