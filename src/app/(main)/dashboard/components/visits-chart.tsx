import { connection } from "next/server";
import { getVisits } from "@/lib/umami";
import { VisitsChartClient } from "./visits-chart.client";

export async function VisitsChart() {
  await connection();
  const visits = await getVisits();
  return <VisitsChartClient data={visits} />;
}
