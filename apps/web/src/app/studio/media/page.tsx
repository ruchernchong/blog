import { connection } from "next/server";
import { MediaLibrary } from "@/app/studio/media/components/media-library";

export default async function MediaPage() {
  await connection();
  return <MediaLibrary />;
}
