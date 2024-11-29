import Script from "next/script";
import type { WithContext } from "schema-dts";

type StructuredDataProps = {
  data: WithContext<any> | Record<string, unknown>;
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
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
};
