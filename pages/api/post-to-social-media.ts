import { NextApiRequest, NextApiResponse } from "next";
import readBody from "lib/readBody";
import { postToDevCommunity } from "lib/postToDevCommunity";
import { postToHashnode } from "lib/postToHashnode";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = await readBody(req);
  const publishedPost = JSON.parse(body);

  try {
    const posts = await Promise.all([
      postToDevCommunity(publishedPost),
      postToHashnode(publishedPost),
    ]);

    posts.forEach((post) => console.log(`Post`, post));

    return res
      .status(200)
      .json({ message: "Successfully published on Dev.to and Hashnode." });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

export default handler;

// Next.js will by default parse the body, which can lead to invalid signatures
export const config = {
  api: {
    bodyParser: false,
  },
};
