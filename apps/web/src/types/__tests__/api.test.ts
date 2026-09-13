import { describe, expect, it } from "vitest";
import { createPostSchema, updatePostSchema } from "../api";

const basePost = {
  title: "Hello",
  slug: "hello",
  content: "Content",
};

describe("createPostSchema", () => {
  it("should apply defaults", () => {
    const result = createPostSchema.parse(basePost);

    expect(result).toMatchObject({
      summary: null,
      coverImage: null,
      status: "draft",
      tags: [],
      featured: false,
    });
  });

  it("should split comma-separated tags", () => {
    const result = createPostSchema.parse({
      ...basePost,
      tags: "react, next.js, ,",
    });

    expect(result.tags).toEqual(["react", "next.js"]);
  });

  it("should turn an empty summary into null", () => {
    const result = createPostSchema.parse({ ...basePost, summary: "" });

    expect(result.summary).toBeNull();
  });

  it("should reject an invalid slug", () => {
    const result = createPostSchema.safeParse({ ...basePost, slug: "Hello!" });

    expect(result.success).toBe(false);
  });
});

describe("updatePostSchema", () => {
  it("should split comma-separated tags", () => {
    const result = updatePostSchema.parse({ tags: "react, next.js" });

    expect(result.tags).toEqual(["react", "next.js"]);
  });

  it("should accept an empty update", () => {
    expect(updatePostSchema.parse({})).toEqual({});
  });
});
