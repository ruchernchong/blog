"use client";

import { Card } from "@heroui/react";
import {
  AreaChart,
  DataGrid,
  type DataGridColumn,
  Segment,
} from "@heroui-pro/react";
import {
  formatCost,
  formatNumber,
  formatTokens,
} from "@workspace/usage/format";
import type { Cost, UsageBreakdownRow } from "@workspace/usage/types";
import { useState } from "react";

interface BreakdownView {
  id: string;
  label: string;
  description: string;
  rows: UsageBreakdownRow[];
}

interface UsageBreakdownProps {
  title: string;
  views: BreakdownView[];
}

/** Sort N.A. costs below every priced value (when sorted descending). */
const sortableCost = (cost: Cost): number => cost ?? Number.NEGATIVE_INFINITY;

const columns: DataGridColumn<UsageBreakdownRow>[] = [
  {
    id: "key",
    header: "Name",
    accessorKey: "key",
    isRowHeader: true,
    allowsSorting: true,
  },
  {
    id: "tokens",
    header: "Tokens",
    align: "end",
    allowsSorting: true,
    cell: (row) => formatTokens(row.tokens),
    sortFn: (a, b) => a.tokens - b.tokens,
  },
  {
    id: "cost",
    header: "Cost",
    align: "end",
    allowsSorting: true,
    cell: (row) => formatCost(row.cost),
    sortFn: (a, b) => sortableCost(a.cost) - sortableCost(b.cost),
  },
  {
    id: "costPerMillionTokens",
    header: "$ / 1M Tokens",
    align: "end",
    allowsSorting: true,
    cell: (row) => formatCost(row.costPerMillionTokens),
    sortFn: (a, b) =>
      sortableCost(a.costPerMillionTokens) -
      sortableCost(b.costPerMillionTokens),
  },
  {
    id: "messages",
    header: "Messages",
    align: "end",
    allowsSorting: true,
    cell: (row) => formatNumber(row.messages),
    sortFn: (a, b) => a.messages - b.messages,
  },
  {
    id: "trend",
    header: "Trend",
    align: "end",
    cell: (row) => (
      <AreaChart
        aria-hidden
        data={row.sparkline.map((value) => ({ value }))}
        height={32}
        margin={{ bottom: 0, left: 0, right: 0, top: 2 }}
        width={120}
      >
        <AreaChart.Area
          dataKey="value"
          dot={false}
          fill="var(--color-accent)"
          fillOpacity={0.1}
          isAnimationActive={false}
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          type="monotone"
        />
      </AreaChart>
    ),
  },
];

/**
 * A single breakdown card whose dataset is toggled with a segmented control.
 * Rows render in a sortable grid; this component owns the active-view state.
 */
export function UsageBreakdown({ title, views }: UsageBreakdownProps) {
  const [selectedKey, setSelectedKey] = useState<string>(views[0]?.id);
  const active = views.find((view) => view.id === selectedKey) ?? views[0];

  return (
    <Card>
      <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Card.Title>{title}</Card.Title>
          <Card.Description>{active.description}</Card.Description>
        </div>
        <Segment
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(String(key))}
          size="sm"
        >
          {views.map((view) => (
            <Segment.Item key={view.id} id={view.id}>
              <Segment.Separator />
              {view.label}
            </Segment.Item>
          ))}
        </Segment>
      </Card.Header>
      <Card.Content>
        <DataGrid
          aria-label="Usage breakdown"
          columns={columns}
          data={active.rows}
          defaultSortDescriptor={{ column: "tokens", direction: "descending" }}
          getRowId={(row) => row.key}
        />
      </Card.Content>
    </Card>
  );
}
