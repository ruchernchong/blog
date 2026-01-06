import { getVisits } from "@/lib/umami";
import { VisitsChartClient } from "./visits-chart.client";

export async function VisitsChart() {
  const visits = await getVisits();
  return <VisitsChartClient data={visits} />;
}
