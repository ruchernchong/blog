import { connection } from "next/server";
import { PostsTable } from "@/app/studio/posts/components/posts-table";

export default async function PostsPage() {
  await connection();
  return <PostsTable />;
}
