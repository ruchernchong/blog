import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  likes: defineTable({
    slug: v.string(),
    userHash: v.string(),
    count: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_slug_user", ["slug", "userHash"]),

  viewCounts: defineTable({
    slug: v.string(),
    count: v.number(),
  }).index("by_slug", ["slug"]),
});
