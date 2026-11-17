import type { Thing, WithContext } from "schema-dts";

type StructuredDataProps = {
  data: WithContext<Thing> | Record<string, unknown>;
};

/**
 * JSON-LD as a plain `<script>` in the server HTML. `next/script` only wrote
 * it into the RSC payload, so a crawler that runs no JavaScript never saw it.
 */
export const StructuredData = ({ data }: StructuredDataProps) => (
  <script
    type="application/ld+json"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data injection
    dangerouslySetInnerHTML={{
      // Escaping `<` keeps a value such as "</script>" from ending the tag.
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);
