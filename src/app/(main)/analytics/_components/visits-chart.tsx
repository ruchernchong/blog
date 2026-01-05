import { getVisits } from "@/app/(main)/analytics/_actions/visits";
import { VisitsChartClient } from "./visits-chart.client";

export async function VisitsChart() {
  const visits = await getVisits();
  return <VisitsChartClient data={visits} />;
}
