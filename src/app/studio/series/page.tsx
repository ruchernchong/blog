import { connection } from "next/server";
import { SeriesTable } from "@/app/studio/series/components/series-table";

export default async function SeriesPage() {
  await connection();
  return <SeriesTable />;
}
