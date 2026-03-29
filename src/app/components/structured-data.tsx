import Script from "next/script";
import type { Thing, WithContext } from "schema-dts";

type StructuredDataProps = {
  data: WithContext<Thing> | Record<string, unknown>;
  type?: string;
};

export const StructuredData = ({
  data,
  type = "application/ld+json",
}: StructuredDataProps) => {
  const jsonString = JSON.stringify(data);

  return (
    <Script
      id={`structured-data${jsonString.length}`}
      type={type}
      strategy="afterInteractive"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data injection
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
};
