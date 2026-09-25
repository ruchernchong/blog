"use client";

import {
  formatCost,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import {
  CartesianGrid,
  LabelList,
  type LabelProps,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { type CostPoint, logAxis } from "./usage-cost-points";

interface CostScatterChartClientProps {
  points: CostPoint[];
}

const rateFormat = new Intl.NumberFormat("en-SG", {
  currency: "USD",
  maximumSignificantDigits: 2,
  style: "currency",
});

const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };

function CostTooltip({
  active,
  payload,
}: Readonly<{
  active?: boolean;
  payload?: readonly { payload?: CostPoint }[];
}>) {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-overlay px-3 py-2 text-sm shadow-(--overlay-shadow)">
      <span className="font-medium">{point.label}</span>
      <dl className="grid grid-cols-[auto_auto] gap-2 text-muted">
        <dt>Tokens</dt>
        <dd className="text-right text-foreground tabular-nums">
          {formatTokens(point.tokens)}
        </dd>
        <dt>API equivalent</dt>
        <dd className="text-right text-foreground tabular-nums">
          {formatCost(point.cost)}
        </dd>
        <dt>Per 1M tokens</dt>
        <dd className="text-right text-foreground tabular-nums">
          {rateFormat.format(point.rate)}
        </dd>
        <dt>Messages</dt>
        <dd className="text-right text-foreground tabular-nums">
          {formatNumber(point.messages)}
        </dd>
      </dl>
    </div>
  );
}

/**
 * One-line direct label centred above its dot. Recharts' default label wraps
 * to the dot's width, which splits multi-word model names across lines.
 */
function DirectLabel({ x, y, width, value }: LabelProps) {
  if (!value) {
    return null;
  }
  return (
    <text
      fill="var(--foreground)"
      fontSize={12}
      textAnchor="middle"
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 8}
    >
      {String(value)}
    </text>
  );
}

/**
 * Interactive client leaf: blended rate against volume, both log scale, dot
 * area by message count. One hue on purpose: identity comes from the direct
 * labels and tooltip, since a many-series scatter cannot keep categorical
 * colours distinguishable.
 */
export function CostScatterChartClient({
  points,
}: Readonly<CostScatterChartClientProps>) {
  const xAxis = logAxis(points.map((point) => point.tokens));
  const yAxis = logAxis(
    points.map((point) => point.rate),
    1.5,
  );

  return (
    <ResponsiveContainer height={360} width="100%">
      {/* The section provides a text summary and the Explorer is the table
          view, so the SVG stays out of the tab order and the a11y tree. */}
      <ScatterChart
        accessibilityLayer={false}
        margin={{ top: 24, right: 48, bottom: 8, left: 0 }}
      >
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="tokens"
          domain={xAxis.domain}
          name="Tokens"
          scale="log"
          tick={AXIS_TICK}
          tickFormatter={formatTokens}
          tickLine={false}
          tickMargin={8}
          ticks={xAxis.ticks}
          type="number"
        />
        <YAxis
          axisLine={false}
          dataKey="rate"
          domain={yAxis.domain}
          name="Per 1M tokens"
          scale="log"
          tick={AXIS_TICK}
          tickFormatter={(value: number) => rateFormat.format(value)}
          tickLine={false}
          ticks={yAxis.ticks}
          type="number"
          width={64}
        />
        <ZAxis dataKey="messages" range={[64, 480]} type="number" />
        <Tooltip content={CostTooltip} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter
          data={points}
          fill="var(--chart-3)"
          fillOpacity={0.8}
          isAnimationActive={false}
          stroke="var(--background)"
          strokeWidth={2}
        >
          <LabelList content={DirectLabel} dataKey="directLabel" />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
