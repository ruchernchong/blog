import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StructuredData } from "./structured-data";

const render = (data: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(StructuredData, { data }));

describe("StructuredData", () => {
  it("should render JSON-LD as a script tag in the server HTML", () => {
    const data = { "@context": "https://schema.org", "@type": "Person" };
    const html = render(data);

    const open = '<script type="application/ld+json">';
    const close = "</script>";

    expect(html.startsWith(open)).toBe(true);
    expect(html.endsWith(close)).toBe(true);
    expect(JSON.parse(html.slice(open.length, -close.length))).toEqual(data);
  });

  it("should escape markup that would end the script tag", () => {
    const html = render({ name: "</script><script>alert(1)</script>" });

    expect(html.split("</script>")).toHaveLength(2);
    expect(html).toContain("\\u003c/script>");
  });
});
