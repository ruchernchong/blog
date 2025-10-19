import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const posts = pgTable(
  "posts",
  {
    id: uuid().defaultRandom().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text(),
    metadata: jsonb().$type<PostMetadata>().notNull(),
    content: text().notNull(),
    status: text({ enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    tags: text().array().notNull().default([]),
    featured: boolean().notNull().default(false),
    coverImage: text(),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return [
      index().on(table.slug),
      index().on(table.status),
      index().on(table.featured),
      index().on(table.publishedAt),
    ];
  },
);

export interface PostMetadata {
  readingTime: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    siteName: string;
    description: string;
    type: string;
    publishedTime: string;
    url: string;
    images: string[];
    locale: string;
  };
  twitter: {
    card: string;
    site: string;
    title: string;
    description: string;
    images: string[];
  };
  structuredData: {
    "@context": string;
    "@type": string;
    headline: string;
    dateModified: string;
    datePublished: string;
    description: string;
    image: string[];
    url: string;
    author: {
      "@type": string;
      name: string;
      url: string;
    };
  };
}

export type InsertPost = typeof posts.$inferInsert;
export type SelectPost = typeof posts.$inferSelect;
