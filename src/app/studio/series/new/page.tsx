import { connection } from "next/server";
import { SeriesForm } from "@/components/studio/series-form";

export default async function NewSeriesPage() {
  await connection();
  return <SeriesForm />;
}
