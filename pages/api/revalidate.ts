import { NextApiRequest, NextApiResponse } from "next";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { sanityClient } from "lib/sanity-server";
import { postUpdatedQuery } from "lib/queries";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const signature = req.headers[SIGNATURE_HEADER_NAME] as string;
  const body = await readBody(req);
  console.info(JSON.parse(body));
  if (
    !isValidSignature(
      body,
      signature,
      process.env.SANITY_STUDIO_REVALIDATE_SECRET
    )
  ) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  const { _id: id } = JSON.parse(body);
  if (typeof id !== "string" || !id) {
    return res.status(400).json({ message: "Invalid _id" });
  }

  try {
    const slug = await sanityClient.fetch(postUpdatedQuery, { id });
    await res.revalidate("/");
    // await Promise.all([res.revalidate("/"), res.revalidate(`/blog/${slug}`)]);

    return res.status(200).json({ message: `Update ${slug}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
export default handler;

// Next.js will by default parse the body, which can lead to invalid signatures
export const config = {
  api: {
    bodyParser: false
  }
};

const readBody = async (readable: NextApiRequest) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};
