import { sanityClient } from "lib/sanity-server";
import { postUpdatedQuery } from "lib/queries";
import { HOST_URL } from "config";

export const postToDevCommunity = async (publishedPost) => {
  const { _id: id, content } = publishedPost;
  const slug = await sanityClient.fetch(postUpdatedQuery, { id });

  try {
    return fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.DEV_TO_API_KEY,
      },
      body: JSON.stringify({
        article: {
          ...publishedPost,
          body_markdown: content,
          published: true,
          canonical_url: `${HOST_URL}/blog/${slug}`,
        },
      }),
    }).then((res) => res.json());
  } catch (e) {
    return e.message;
  }
};
