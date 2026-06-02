import { OG_COLOURS } from "../colours";
import { Layout } from "./layout";

interface SectionProps {
  title: string;
  description?: string;
}

/**
 * Section template for About and Blog listing pages
 *
 * Features page title, optional description, and site branding
 */
export function Section({ title, description }: SectionProps) {
  return (
    <Layout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        {/* Page title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: OG_COLOURS.foreground,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: OG_COLOURS.mutedForeground,
              margin: 0,
              lineHeight: 1.4,
              maxWidth: "80%",
            }}
          >
            {description}
          </p>
        )}
      </div>
    </Layout>
  );
}
