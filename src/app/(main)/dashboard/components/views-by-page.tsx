import { connection } from "next/server";
import { getPages } from "@/lib/umami";
import { ViewsByPageClient } from "./views-by-page.client";

export async function ViewsByPage() {
  await connection();
  const pages = await getPages();
  return <ViewsByPageClient data={pages} />;
}
