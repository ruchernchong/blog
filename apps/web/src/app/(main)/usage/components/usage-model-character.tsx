import { formatCost, formatTokens } from "@workspace/usage/format";
import {
  deriveModelCharacter,
  type ModelCharacter,
} from "@workspace/usage/model-character";
import type { UsageBreakdownRow } from "@workspace/usage/types";
import { Suspense } from "react";
import { UsageModelCharacterRows } from "./usage-model-character-rows.client";
import {
  UsageModelProfileButton,
  UsageModelProfileButtonFallback,
} from "./usage-model-profile-button.client";
import { UsageSection } from "./usage-section";

interface UsageModelCharacterProps {
  byModel: UsageBreakdownRow[];
  modelDisplayNames: Record<string, string>;
  /** How many of the biggest models show before "Show all". */
  limit?: number;
}

const percent = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 0,
  style: "percent",
});

const ratioFormat = new Intl.NumberFormat("en-SG", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const DASH = "–";

/** Percentage with an inline bar; a magnitude, so one hue (the accent). */
function RateCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted">{DASH}</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-default">
        <div
          className="h-full rounded-full bg-[var(--chart-3)]"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="tabular-nums">{percent.format(value)}</span>
    </div>
  );
}

/** Dash when there were no messages; N.A. when the model is unpriced. */
function costPerMessageLabel(row: ModelCharacter): string {
  if (row.tokensPerMessage === null) return DASH;
  return formatCost(row.costPerMessage);
}

/**
 * "Model character": how each of the biggest models behaves, not just how
 * much it ran. Doubles as the table view for the charts above it.
 */
export function UsageModelCharacter({
  byModel,
  modelDisplayNames,
  limit = 8,
}: UsageModelCharacterProps) {
  const rows = byModel
    .filter((row) => row.tokens > 0)
    .map((row) => ({
      key: row.key,
      label: modelDisplayNames[row.key] ?? row.key,
      ...deriveModelCharacter(row),
    }));

  return (
    <UsageSection
      description="Cache reuse, how much each model writes per token read, how much of that is reasoning, and message size. Open a model's profile for its full history."
      id="character"
      title="Model character"
    >
      {rows.length === 0 ? (
        <p className="text-muted text-sm">No model usage yet.</p>
      ) : (
        <UsageModelCharacterRows
          head={
            <thead className="text-muted text-xs uppercase tracking-wider">
              <tr className="border-border border-b">
                <th className="py-2 pr-4 font-medium" scope="col">
                  Model
                </th>
                <th className="py-2 pr-4 font-medium" scope="col">
                  Cache hit
                </th>
                <th className="py-2 pr-4 font-medium" scope="col">
                  Output per input
                </th>
                <th className="py-2 pr-4 font-medium" scope="col">
                  Reasoning
                </th>
                <th className="py-2 pr-4 text-right font-medium" scope="col">
                  Tokens / msg
                </th>
                <th className="py-2 text-right font-medium" scope="col">
                  Cost / msg
                </th>
              </tr>
            </thead>
          }
          initialCount={limit}
          rows={rows.map((row) => (
            <tr className="border-border border-b last:border-0" key={row.key}>
              <th className="max-w-56 py-3 pr-4" scope="row">
                <div className="flex flex-col gap-2">
                  <span className="truncate font-medium" title={row.key}>
                    {row.label}
                  </span>
                  {/* nuqs reads the URL, so the button needs a Suspense
                          boundary to keep the section in the static shell. */}
                  <Suspense fallback={<UsageModelProfileButtonFallback />}>
                    <UsageModelProfileButton
                      label={row.label}
                      model={row.key}
                    />
                  </Suspense>
                </div>
              </th>
              <td className="py-3 pr-4">
                <RateCell value={row.cacheHitRate} />
              </td>
              <td className="py-3 pr-4 tabular-nums">
                {row.outputInputRatio === null
                  ? DASH
                  : `${ratioFormat.format(row.outputInputRatio)}×`}
              </td>
              <td className="py-3 pr-4">
                <RateCell value={row.reasoningShare} />
              </td>
              <td className="py-3 pr-4 text-right tabular-nums">
                {row.tokensPerMessage === null
                  ? DASH
                  : formatTokens(row.tokensPerMessage)}
              </td>
              <td className="py-3 text-right tabular-nums">
                {costPerMessageLabel(row)}
              </td>
            </tr>
          ))}
        />
      )}
    </UsageSection>
  );
}
