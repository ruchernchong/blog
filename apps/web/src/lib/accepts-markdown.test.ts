import { describe, expect, it } from "vitest";
import { ACCEPTS_MARKDOWN_PATTERN } from "./accepts-markdown";

// Next.js anchors a rewrite's `has` value the same way.
const acceptsMarkdown = (accept: string) =>
  new RegExp(`^${ACCEPTS_MARKDOWN_PATTERN}$`).test(accept);

describe("ACCEPTS_MARKDOWN_PATTERN", () => {
  it.each([
    "text/markdown",
    "text/markdown, text/html;q=0.8",
    "text/html;q=0.8, text/markdown",
    "text/html, text/markdown;q=0.5, */*;q=0.1",
    "text/markdown;charset=utf-8",
    "text/markdown; q=0.01",
    "text/markdown;q=1.0",
  ])("should match %s", (accept) => {
    expect(acceptsMarkdown(accept)).toBe(true);
  });

  it.each([
    "text/html",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "*/*",
    "text/html, text/markdown;q=0",
    "text/markdown;q=0.0, text/html",
    "text/markdown; charset=utf-8; q=0.000",
    "text/markdown-extra",
    "",
  ])("should not match %s", (accept) => {
    expect(acceptsMarkdown(accept)).toBe(false);
  });
});
