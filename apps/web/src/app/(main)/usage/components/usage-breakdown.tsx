"use client";

import { Card } from "@heroui/react";
import {
  AreaChart,
  DataGrid,
  type DataGridColumn,
  NumberValue,
  Segment,
} from "@heroui-pro/react";
import { providerLogoUrl } from "@workspace/usage/providers";
import type { Cost, UsageBreakdownRow } from "@workspace/usage/types";
import Image from "next/image";
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

const COMPACT_NUMBER_FORMAT_OPTIONS = {
  maximumFractionDigits: 2,
  notation: "compact",
} satisfies Intl.NumberFormatOptions;

const CURRENCY_FORMAT_OPTIONS = {
  currency: "USD",
  style: "currency",
} satisfies Intl.NumberFormatOptions;

function CostValue({ cost }: { cost: Cost }) {
  if (cost === null) {
    return "N.A.";
  }

  return (
    <NumberValue
      formatOptions={CURRENCY_FORMAT_OPTIONS}
      locale="en-SG"
      value={cost}
    />
  );
}

function ProviderLogo({ provider }: { provider: string }) {
  return (
    <Image
      alt=""
      aria-hidden
      className="size-4 shrink-0 opacity-80 dark:invert"
      height={16}
      src={providerLogoUrl(provider)}
      unoptimized
      width={16}
    />
  );
}

function ProviderValue({ row }: { row: UsageBreakdownRow }) {
  const providers = row.provider ? [row.provider] : row.providers;

  if (!providers?.length) {
    return "-";
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="flex shrink-0 items-center gap-1">
        {providers.map((provider) => (
          <ProviderLogo key={provider} provider={provider} />
        ))}
      </span>
      <span className="truncate">{providers.join(", ")}</span>
    </span>
  );
}

function RowVisual({
  row,
  viewId,
}: {
  row: UsageBreakdownRow;
  viewId: string;
}) {
  if (viewId === "provider") {
    return <ProviderLogo provider={row.key} />;
  }

  return null;
}

function getColumns(viewId: string): DataGridColumn<UsageBreakdownRow>[] {
  const columns: DataGridColumn<UsageBreakdownRow>[] = [
    {
      id: "key",
      header: "Model",
      accessorKey: "key",
      isRowHeader: true,
      allowsSorting: true,
      cell: (row) => (
        <span className="inline-flex min-w-0 items-center gap-2">
          <RowVisual row={row} viewId={viewId} />
          <span className="truncate font-medium text-xs">{row.key}</span>
        </span>
      ),
      minWidth: 240,
      pinned: "start",
    },
    ...(viewId === "provider"
      ? []
      : [
          {
            id: "provider",
            header: "Provider",
            accessorKey: "provider",
            allowsSorting: true,
            cell: (row) => <ProviderValue row={row} />,
            cellClassName: "text-muted",
            minWidth: 160,
            sortFn: (a, b) =>
              (a.provider ?? a.providers?.join(", ") ?? "").localeCompare(
                b.provider ?? b.providers?.join(", ") ?? "",
              ),
          } satisfies DataGridColumn<UsageBreakdownRow>,
        ]),
    {
      id: "trend",
      header: "Trend",
      align: "end",
      minWidth: 110,
      cell: (row) => (
        <AreaChart
          aria-hidden
          className="w-full"
          data={row.sparkline.map((value) => ({ value }))}
          height={32}
          margin={{ bottom: 0, left: 0, right: 0, top: 2 }}
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
    {
      id: "tokens",
      header: "Tokens",
      align: "end",
      allowsSorting: true,
      cell: (row) => (
        <NumberValue
          formatOptions={COMPACT_NUMBER_FORMAT_OPTIONS}
          locale="en-SG"
          value={row.tokens}
        />
      ),
      cellClassName: "tabular-nums",
      minWidth: 115,
      sortFn: (a, b) => a.tokens - b.tokens,
    },
    {
      id: "cost",
      header: "Cost",
      align: "end",
      allowsSorting: true,
      cell: (row) => <CostValue cost={row.cost} />,
      cellClassName: "tabular-nums",
      minWidth: 125,
      sortFn: (a, b) => sortableCost(a.cost) - sortableCost(b.cost),
    },
    {
      id: "costPerMillionTokens",
      header: "$ / 1M Tokens",
      align: "end",
      allowsSorting: true,
      cell: (row) => <CostValue cost={row.costPerMillionTokens} />,
      cellClassName: "text-muted tabular-nums",
      minWidth: 135,
      sortFn: (a, b) =>
        sortableCost(a.costPerMillionTokens) -
        sortableCost(b.costPerMillionTokens),
    },
    {
      id: "messages",
      header: "Messages",
      align: "end",
      allowsSorting: true,
      cell: (row) => <NumberValue locale="en-SG" value={row.messages} />,
      cellClassName: "tabular-nums",
      minWidth: 105,
      sortFn: (a, b) => a.messages - b.messages,
    },
  ];

  return columns;
}

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
          className="[&_.table__cell]:py-1.5 [&_.table__cell]:text-xs [&_.table__column]:py-1.5 [&_.table__column]:text-[11px]"
          columns={getColumns(active.id)}
          contentClassName="min-w-[760px] md:min-w-[1000px]"
          data={active.rows}
          defaultSortDescriptor={{ column: "tokens", direction: "descending" }}
          getRowId={(row) => row.key}
          variant="primary"
        />
      </Card.Content>
    </Card>
  );
}
