import { agentLabel } from "@workspace/usage/narrative";
import type { WeeklyShare } from "@workspace/usage/types";
import { toWeeklyShareRows } from "@workspace/usage/weekly-insights";
import { UsageSection } from "./usage-section";
import { describeSeries } from "./usage-series";
import { UsageStackShiftClient } from "./usage-stack-shift.client";

interface UsageStackShiftProps {
  weeklyShare: WeeklyShare;
  modelDisplayNames: Record<string, string>;
}

/** Server shell for "How my stack shifted": shapes both views up front. */
export function UsageStackShift({
  weeklyShare,
  modelDisplayNames,
}: Readonly<UsageStackShiftProps>) {
  const { weeks, models, agents } = weeklyShare;

  return (
    <UsageSection
      description="Each week's tokens split by model or agent, as a share of that week."
      id="stack"
      title="How my stack shifted"
    >
      {weeks.length === 0 ? (
        <p className="text-muted text-sm">No activity yet.</p>
      ) : (
        <UsageStackShiftClient
          views={{
            model: {
              rows: toWeeklyShareRows(weeks, models),
              series: describeSeries(
                models,
                (key) => modelDisplayNames[key] ?? key,
              ),
            },
            agent: {
              rows: toWeeklyShareRows(weeks, agents),
              series: describeSeries(agents, agentLabel),
            },
          }}
        />
      )}
    </UsageSection>
  );
}
