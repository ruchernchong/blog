import {
  formatCost,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import type { UsageBreakdownRow } from "@workspace/usage/types";
import {
  type BreakdownNames,
  rowDisplayName,
  rowProviders,
} from "./usage-breakdown-rows";

interface UsageBreakdownListProps {
  rows: UsageBreakdownRow[];
  viewId: string;
  names: BreakdownNames;
}

/**
 * Phone layout for the Explorer: one compact card per row instead of a wide
 * grid that would scroll sideways. Same filtered, sorted rows as the grid.
 */
export function UsageBreakdownList({
  rows,
  viewId,
  names,
}: UsageBreakdownListProps) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-muted text-sm">
        No results match your filters.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {rows.map((row) => {
        const name = rowDisplayName(row, viewId, names);
        const providers = rowProviders(row)
          .map((provider) => names.providerDisplayNames[provider] ?? provider)
          .join(", ");

        return (
          <li className="flex flex-col gap-2 py-4" key={row.key}>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              {viewId !== "provider" && providers ? (
                <span className="text-muted text-xs">{providers}</span>
              ) : null}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Tokens</dt>
                <dd className="tabular-nums">{formatTokens(row.tokens)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">API eq.</dt>
                <dd className="tabular-nums">{formatCost(row.cost)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">$ / 1M</dt>
                <dd className="tabular-nums">
                  {formatCost(row.costPerMillionTokens)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Messages</dt>
                <dd className="tabular-nums">{formatNumber(row.messages)}</dd>
              </div>
            </dl>
            {row.providerRows ? (
              <ul className="flex flex-col gap-2 border-border border-s ps-4 text-xs">
                {row.providerRows.map((providerRow) => (
                  <li
                    className="flex justify-between gap-2"
                    key={providerRow.provider}
                  >
                    <span className="text-muted">
                      {names.providerDisplayNames[providerRow.provider ?? ""] ??
                        providerRow.provider}
                    </span>
                    <span className="tabular-nums">
                      {formatTokens(providerRow.tokens)} ·{" "}
                      {formatCost(providerRow.cost)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
