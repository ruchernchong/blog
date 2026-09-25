import { formatCost } from "@workspace/usage/format";
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
}: Readonly<UsageCostScatterProps>) {
  const points = toCostPoints(byModel, modelDisplayNames);
  const labelled = points
    .filter((point) => point.directLabel)
    .sort((a, b) => b.cost - a.cost);

  return (
    <UsageSection
      description="Blended price per million tokens against volume, per model. Bigger dots mean more messages. Both axes are log scale."
      id="money"
      title="Where the money goes"
    >
      {points.length === 0 ? (
        <p className="text-muted text-sm">No priced usage yet.</p>
      ) : (
        <>
          <p className="sr-only">
            Biggest spenders:{" "}
            {labelled
              .map(
                (point) =>
                  `${point.label}, ${formatCost(point.cost)} at ${formatCost(point.rate)} per million tokens`,
              )
              .join("; ")}
            . Every model's figures are in the Explorer table below.
          </p>
          <div aria-hidden="true">
            <CostScatterChartClient points={points} />
          </div>
        </>
      )}
    </UsageSection>
  );
}
