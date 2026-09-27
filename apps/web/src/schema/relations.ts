import { defineRelations } from "drizzle-orm";
import { authRelations } from "./auth";
import * as schema from "./schema";

/**
 * App relations over the full schema, so every table gets a `db.query` entry.
 * Keep `user`-side relations in `authRelations`: the spread below lets the
 * auth part replace the auth tables' entries here.
 */
const appRelations = defineRelations(schema, (r) => ({
  posts: {
    author: r.one.user({ from: r.posts.authorId, to: r.user.id }),
    series: r.one.series({ from: r.posts.seriesId, to: r.series.id }),
  },
  series: {
    posts: r.many.posts({ from: r.series.id, to: r.posts.seriesId }),
  },
}));

export const relations = { ...appRelations, ...authRelations };
