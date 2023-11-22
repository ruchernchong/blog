import { NextApiRequest, NextApiResponse } from "next";
import readBody from "@/lib/readBody";
import { BASE_URL } from "@/config";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // const body = await readBody(req);
  // const publishedPost = JSON.parse(body);
  // const { _id: id, content } = publishedPost;
  // const slug = await sanityClient.fetch(postUpdatedQuery, { id });
  //
  // try {
  //   const post = await fetch("https://dev.to/api/articles", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "api-key": process.env.DEV_TO_API_KEY
  //     },
  //     body: JSON.stringify({
  //       article: {
  //         ...publishedPost,
  //         body_markdown: content,
  //         published: true,
  //         canonical_url: `${HOST_URL}/blog/${slug}`
  //       }
  //     })
  //   }).then((res) => res.json());
  //   console.log(post);
  //
  //   return res
  //     .status(200)
  //     .json({ message: `Successfully published on: ${post.url}` });
  // } catch (err) {
  //   return res.status(400).json({ message: err.message });
  // }

  return res.status(200).json({ message: "Endpoint is working." });
};

export default handler;

// Next.js will by default parse the body, which can lead to invalid signatures
export const config = {
  api: {
    bodyParser: false,
  },
};
