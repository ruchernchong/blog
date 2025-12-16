import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("viewCounts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return record?.count ?? 0;
  },
});

export const getTop = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    // Note: Convex doesn't support ordering by non-indexed fields, so we fetch
    // all records and sort in memory. This is acceptable for small datasets
    // (< 1000 posts) but may need optimisation for larger scale.
    const records = await ctx.db.query("viewCounts").collect();
    return records
      .sort((a, b) => b.count - a.count)
      .slice(0, args.limit)
      .map((r) => ({ slug: r.slug, views: r.count }));
  },
});

export const increment = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("viewCounts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("viewCounts", { slug: args.slug, count: 1 });
    }
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("viewCounts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
