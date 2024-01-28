import type { NextApiRequest } from "next";

const readBody = async (readable: NextApiRequest) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

export default readBody;
