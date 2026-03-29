import { getPages } from "@/lib/umami";
import { ViewsByPageClient } from "./views-by-page.client";

export async function ViewsByPage() {
  const pages = await getPages();
  return <ViewsByPageClient data={pages} />;
}
