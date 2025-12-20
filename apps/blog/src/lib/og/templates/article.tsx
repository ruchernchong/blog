import { OG_COLOURS } from "../colours";
import { OG_CONFIG } from "../config";
import { Layout } from "./layout";

interface ArticleProps {
  title: string;
  date: string;
  author?: string;
}

/**
 * Article template for blog post OG images
 *
 * Features post title, author avatar, author name, and date
 */
export function Article({
  title,
  date,
  author = OG_CONFIG.author,
}: ArticleProps) {
  return (
    <Layout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        {/* Post title */}
        <h1
          style={{
            fontSize: title.length > 60 ? 48 : 56,
            fontWeight: 700,
            color: OG_COLOURS.foreground,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>

        {/* Author and date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: "auto",
          }}
        >
          {/* Author avatar - coral circle with initial */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: OG_COLOURS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: OG_COLOURS.primaryForeground,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              R
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: OG_COLOURS.foreground,
              }}
            >
              {author}
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 400,
                color: OG_COLOURS.mutedForeground,
              }}
            >
              {date}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
