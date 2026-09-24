import type { UsageBreakdownRow } from "@workspace/usage/types";
import { CostScatterChartClient } from "./cost-scatter-chart.client";
import { toCostPoints } from "./usage-cost-points";
import { UsageSection } from "./usage-section";

interface UsageCostScatterProps {
  byModel: UsageBreakdownRow[];
  modelDisplayNames: Record<string, string>;
}

/** Server shell for "Where the money goes". */
export function UsageCostScatter({
  byModel,
  modelDisplayNames,
}: UsageCostScatterProps) {
  const points = toCostPoints(byModel, modelDisplayNames);

  return (
    <UsageSection
      description="Blended price per million tokens against volume, per model. Bigger dots mean more messages. Both axes are log scale."
      id="money"
      title="Where the money goes"
    >
      {points.length === 0 ? (
        <p className="text-muted text-sm">No priced usage yet.</p>
      ) : (
        <CostScatterChartClient points={points} />
      )}
    </UsageSection>
  );
}
