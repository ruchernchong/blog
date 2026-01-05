import { getPages } from "@/app/(main)/analytics/_actions/pages";
import { ViewsByPageClient } from "./views-by-page.client";

export async function ViewsByPage() {
  const pages = await getPages();
  return <ViewsByPageClient data={pages} />;
}
