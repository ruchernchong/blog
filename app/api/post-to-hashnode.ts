import { NextApiRequest, NextApiResponse } from "next";
import readBody from "@/lib/readBody";
import { BASE_URL } from "@/config";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // const body = await readBody(req);
  // const publishedPost = JSON.parse(body);
  // const { title, content } = publishedPost;
  // const slug = publishedPost.slug.current;
  //
  // const query = `
  //   mutation createPublicationStory($publicationId: String! , $input: CreateStoryInput!) {
  //     createPublicationStory(publicationId: $publicationId,input: $input) {
  //       code
  //       success
  //       message
  //       post {
  //         sourcedFromGithub
  //         isRepublished
  //         followersCount
  //         cuid
  //         slug
  //         title
  //         type
  //         partOfPublication
  //         dateUpdated
  //         totalReactions
  //         numCollapsed
  //         isDelisted
  //         isFeatured
  //         isActive
  //         replyCount
  //         responseCount
  //         popularity
  //         dateAdded
  //         contentMarkdown
  //         content
  //         brief
  //         coverImage
  //         isAnonymous
  //       }
  //     }
  //   }
  // `;
  // const variables = {
  //   publicationId: process.env.HASHNODE_PUBLICATION_ID,
  //   input: {
  //     title,
  //     contentMarkdown: content,
  //     isRepublished: {
  //       originalArticleURL: `${HOST_URL}/blog/${slug}`
  //     },
  //     tags: []
  //   }
  // };
  //
  // try {
  //   const { data } = await fetch("https://api.hashnode.com", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: process.env.HASHNODE_ACCESS_TOKEN
  //     },
  //     body: JSON.stringify({ query, variables })
  //   }).then((res) => res.json());
  //   const { createPublicationStory } = data;
  //   console.log(createPublicationStory);
  //
  //   return res.status(200).json({ message: createPublicationStory.message });
  // } catch (e) {
  //   return res.status(400).json({ message: e.message });
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
