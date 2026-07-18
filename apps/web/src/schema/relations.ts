import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

// Drizzle v1 Relations v2: relations are defined centrally with defineRelations
// (replacing the per-table relations() helpers). Passing the whole schema here
// registers every table for the relational query builder (db.query.*), even
// tables without explicit relations — which is all the Better Auth adapter needs.
// Only relations the app actually loads via `with` are declared below.
export const relations = defineRelations(schema, (r) => ({
  posts: {
    author: r.one.user({ from: r.posts.authorId, to: r.user.id }),
    series: r.one.series({ from: r.posts.seriesId, to: r.series.id }),
  },
  series: {
    posts: r.many.posts(),
  },
}));
