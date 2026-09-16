"use client";

import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  SearchField,
  Typography,
} from "@heroui/react";
import {
  AreaChart,
  DataGrid,
  type DataGridColumn,
  type DataGridSelection,
  type DataGridSortDescriptor,
  NumberValue,
  Segment,
} from "@heroui-pro/react";
import {
  Cancel01Icon,
  FilterHorizontalIcon,
  LayoutTable02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { providerLogoUrl } from "@workspace/usage/providers";
import type { Cost, UsageBreakdownRow } from "@workspace/usage/types";
import Image from "next/image";
import { useQueryStates } from "nuqs";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  USAGE_SORT_COLUMNS,
  type UsageBreakdownView,
  type UsageSortColumn,
  usageParsers,
} from "../searchParams";
import { FreeModelChip } from "./free-model-chip";

export interface BreakdownView {
  id: UsageBreakdownView;
  label: string;
  description: string;
  rows: UsageBreakdownRow[];
}

interface UsageBreakdownProps {
  className?: string;
  providerDisplayNames: Record<string, string>;
  modelDisplayNames: Record<string, string>;
  title: string;
  views: BreakdownView[];
}

const HIDEABLE_COLUMNS = [
  { id: "provider", label: "Provider" },
  { id: "trend", label: "Trend" },
  { id: "tokens", label: "Tokens" },
  { id: "cost", label: "API Equivalent" },
  { id: "costPerMillionTokens", label: "$ / 1M Tokens" },
  { id: "messages", label: "Messages" },
];

/** Fixed metrics required by DataGrid `virtualized` (RAC TableLayout). */
const GRID_ROW_HEIGHT = 52;
const GRID_HEADING_HEIGHT = 36;
const GRID_SCROLL_CLASS = "max-h-[400px] overflow-auto";

/** Breakdown state that lives in the URL. Defaults are kept out of the query string. */
const breakdownParsers = {
  view: usageParsers.view,
  q: usageParsers.q.withOptions({
    limitUrlUpdates: { method: "debounce", timeMs: 300 },
  }),
  provider: usageParsers.provider,
  free: usageParsers.free,
  sort: usageParsers.sort,
  dir: usageParsers.dir,
};

function isSortColumn(column: unknown): column is UsageSortColumn {
  return USAGE_SORT_COLUMNS.includes(column as UsageSortColumn);
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

function rowProviders(row: UsageBreakdownRow): string[] {
  return row.providers ?? (row.provider ? [row.provider] : []);
}

function rowDisplayName(
  row: UsageBreakdownRow,
  viewId: string,
  providerDisplayNames: Record<string, string>,
  modelDisplayNames: Record<string, string>,
): string {
  if (viewId === "provider") {
    return providerDisplayNames[row.key] ?? row.key;
  }
  if (viewId === "model") {
    return modelDisplayNames[row.key] ?? row.key;
  }
  return row.key;
}

function compareRows(
  a: UsageBreakdownRow,
  b: UsageBreakdownRow,
  descriptor: DataGridSortDescriptor,
  viewId: string,
  providerDisplayNames: Record<string, string>,
  modelDisplayNames: Record<string, string>,
): number {
  const result = (() => {
    switch (descriptor.column) {
      case "key":
        return rowDisplayName(
          a,
          viewId,
          providerDisplayNames,
          modelDisplayNames,
        ).localeCompare(
          rowDisplayName(b, viewId, providerDisplayNames, modelDisplayNames),
        );
      case "provider":
        return (a.provider ?? a.providers?.join(", ") ?? "").localeCompare(
          b.provider ?? b.providers?.join(", ") ?? "",
        );
      case "tokens":
        return a.tokens - b.tokens;
      case "messages":
        return a.messages - b.messages;
      case "cost":
        return sortableCost(a.cost) - sortableCost(b.cost);
      case "costPerMillionTokens":
        return (
          sortableCost(a.costPerMillionTokens) -
          sortableCost(b.costPerMillionTokens)
        );
      default:
        return 0;
    }
  })();

  return descriptor.direction === "descending" ? -result : result;
}

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
      className="size-6 shrink-0 opacity-80 dark:invert"
      height={24}
      src={providerLogoUrl(provider)}
      unoptimized
      width={24}
    />
  );
}

function ProviderValue({
  providerDisplayNames,
  row,
}: {
  providerDisplayNames: Record<string, string>;
  row: UsageBreakdownRow;
}) {
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
      <span className="truncate">
        {providers
          .map((provider) => providerDisplayNames[provider] ?? provider)
          .join(", ")}
      </span>
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

function getColumns({
  modelDisplayNames,
  providerDisplayNames,
  viewId,
}: {
  modelDisplayNames: Record<string, string>;
  providerDisplayNames: Record<string, string>;
  viewId: string;
}): DataGridColumn<UsageBreakdownRow>[] {
  const columns: DataGridColumn<UsageBreakdownRow>[] = [
    {
      id: "key",
      header: "Model",
      accessorKey: "key",
      isRowHeader: true,
      allowsSorting: true,
      cell: (row) => (
        <span className="inline-flex w-full min-w-0 items-center gap-2 pe-8 sm:pe-0">
          <RowVisual row={row} viewId={viewId} />
          <span
            className="truncate font-medium text-xs"
            title={viewId === "model" ? row.key : undefined}
          >
            {rowDisplayName(
              row,
              viewId,
              providerDisplayNames,
              modelDisplayNames,
            )}
          </span>
          <FreeModelChip cost={row.cost} viewId={viewId} />
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
            cell: (row) => (
              <ProviderValue
                providerDisplayNames={providerDisplayNames}
                row={row}
              />
            ),
            cellClassName: "text-muted",
            minWidth: 160,
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
    },
    {
      id: "cost",
      header: "API Equivalent",
      align: "end",
      allowsSorting: true,
      cell: (row) => <CostValue cost={row.cost} />,
      cellClassName: "tabular-nums",
      minWidth: 150,
      pinned: "end",
    },
    {
      id: "costPerMillionTokens",
      header: "$ / 1M Tokens",
      align: "end",
      allowsSorting: true,
      cell: (row) => <CostValue cost={row.costPerMillionTokens} />,
      cellClassName: "text-muted tabular-nums",
      minWidth: 135,
    },
    {
      id: "messages",
      header: "Messages",
      align: "end",
      allowsSorting: true,
      cell: (row) => <NumberValue locale="en-SG" value={row.messages} />,
      cellClassName: "tabular-nums",
      minWidth: 105,
    },
  ];

  return columns;
}

function FilterChip({
  clearLabel,
  label,
  onClear,
}: {
  clearLabel: string;
  label: string;
  onClear: () => void;
}) {
  return (
    <Chip className="gap-1 pe-1" size="sm" variant="soft">
      <Chip.Label>{label}</Chip.Label>
      <Button
        aria-label={clearLabel}
        className="size-4 min-w-0 p-0"
        isIconOnly
        onPress={onClear}
        size="sm"
        variant="ghost"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
      </Button>
    </Chip>
  );
}

interface ProviderOption {
  key: string;
  label: string;
}

function BreakdownToolbar({
  columnOptions,
  onFreeFilterChange,
  onProviderFilterChange,
  onSearchChange,
  onVisibleColumnsChange,
  freeFilter,
  providerFilter,
  providerOptions,
  search,
  visibleColumns,
}: {
  columnOptions: { id: string; label: string }[];
  onFreeFilterChange: (value: string) => void;
  onProviderFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onVisibleColumnsChange: (keys: DataGridSelection) => void;
  freeFilter: string;
  providerFilter: string;
  providerOptions: ProviderOption[];
  search: string;
  visibleColumns: DataGridSelection;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchField
        aria-label="Search breakdown rows"
        className="w-full sm:max-w-60"
        onChange={onSearchChange}
        value={search}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search..." />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <Button
        size="sm"
        variant={freeFilter === "free" ? "primary" : "outline"}
        onPress={() =>
          onFreeFilterChange(freeFilter === "free" ? "all" : "free")
        }
        aria-pressed={freeFilter === "free"}
      >
        Free
      </Button>
      {providerOptions.length > 0 && (
        <Dropdown>
          <Button size="sm" variant="outline">
            <HugeiconsIcon
              icon={FilterHorizontalIcon}
              size={16}
              strokeWidth={1.5}
            />
            Provider
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu
              disallowEmptySelection
              onSelectionChange={(keys) =>
                onProviderFilterChange(
                  String(keys === "all" ? "all" : ([...keys][0] ?? "all")),
                )
              }
              selectedKeys={new Set([providerFilter])}
              selectionMode="single"
            >
              <Dropdown.Item id="all" textValue="All providers">
                <Label>All providers</Label>
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
              {providerOptions.map((option) => (
                <Dropdown.Item
                  id={option.key}
                  key={option.key}
                  textValue={option.label}
                >
                  <Label>{option.label}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )}
      <div className="ms-auto">
        <Dropdown>
          <Button size="sm" variant="outline">
            <HugeiconsIcon
              icon={LayoutTable02Icon}
              size={16}
              strokeWidth={1.5}
            />
            Columns
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu
              disallowEmptySelection
              onSelectionChange={onVisibleColumnsChange}
              selectedKeys={visibleColumns}
              selectionMode="multiple"
            >
              {columnOptions.map((column) => (
                <Dropdown.Item
                  id={column.id}
                  key={column.id}
                  textValue={column.label}
                >
                  <Label>{column.label}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}

function getTableScrollContainer(root: HTMLElement | null) {
  return (
    root?.querySelector<HTMLElement>('[data-slot="table-scroll-container"]') ??
    null
  );
}

/**
 * A single breakdown card whose dataset is toggled with a segmented control.
 * Rows can be searched, filtered by provider, and sorted; column visibility is
 * user-toggleable. This component owns all of that state.
 */
export function UsageBreakdown({
  className,
  providerDisplayNames,
  modelDisplayNames,
  title,
  views,
}: UsageBreakdownProps) {
  // The URL is the source of truth for view, filters, and sort, so a filtered
  // breakdown is shareable. Column visibility is a display preference and stays local.
  const [
    {
      view: selectedKey,
      q: search,
      provider: providerFilter,
      free: isFreeOnly,
      sort,
      dir,
    },
    setBreakdown,
  ] = useQueryStates(breakdownParsers, { history: "replace" });
  const freeFilter = isFreeOnly ? "free" : "all";
  const sortDescriptor = useMemo<DataGridSortDescriptor>(
    () => ({
      column: sort,
      direction: dir === "asc" ? "ascending" : "descending",
    }),
    [sort, dir],
  );
  const [visibleColumns, setVisibleColumns] = useState<DataGridSelection>(
    new Set(HIDEABLE_COLUMNS.map((column) => column.id)),
  );
  const gridRef = useRef<HTMLDivElement>(null);

  const active = views.find((view) => view.id === selectedKey) ?? views[0];

  const setSearch = (q: string) => setBreakdown({ q });
  const setProviderFilter = (provider: string) => setBreakdown({ provider });
  const setFreeFilter = (value: string) =>
    setBreakdown({ free: value === "free" });
  const setSortDescriptor = (descriptor: DataGridSortDescriptor) => {
    if (!isSortColumn(descriptor.column)) {
      return;
    }
    setBreakdown({
      sort: descriptor.column,
      dir: descriptor.direction === "ascending" ? "asc" : "desc",
    });
  };

  const handleViewChange = (key: string | number) => {
    const next = views.find((view) => view.id === String(key));
    if (!next) {
      return;
    }
    // `null` resets each key to its default and drops it from the URL.
    setBreakdown({
      view: next.id,
      q: null,
      provider: null,
      free: null,
      sort: null,
      dir: null,
    });
  };

  const handleClearFilters = () => {
    setBreakdown({ q: null, provider: null, free: null });
  };

  const providerOptions = useMemo<ProviderOption[]>(() => {
    if (active.id === "provider") {
      return [];
    }

    const keys = new Set<string>();
    for (const row of active.rows) {
      for (const provider of rowProviders(row)) {
        keys.add(provider);
      }
    }

    return [...keys]
      .map((key) => ({ key, label: providerDisplayNames[key] ?? key }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [active, providerDisplayNames]);

  const filteredRows = useMemo(() => {
    let rows = active.rows;

    if (search) {
      const query = search.toLowerCase();
      rows = rows.filter((row) => {
        if (
          rowDisplayName(
            row,
            active.id,
            providerDisplayNames,
            modelDisplayNames,
          )
            .toLowerCase()
            .includes(query)
        ) {
          return true;
        }

        return rowProviders(row).some((provider) =>
          (providerDisplayNames[provider] ?? provider)
            .toLowerCase()
            .includes(query),
        );
      });
    }

    if (providerFilter !== "all") {
      rows = rows.filter((row) => rowProviders(row).includes(providerFilter));
    }

    if (freeFilter !== "all") {
      rows = rows.filter((row) => {
        if (freeFilter === "free") {
          return row.cost === 0 || row.cost === null;
        }
        return row.cost !== 0 && row.cost !== null;
      });
    }

    return rows;
  }, [
    active,
    modelDisplayNames,
    providerDisplayNames,
    providerFilter,
    search,
    freeFilter,
  ]);

  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) =>
        compareRows(
          a,
          b,
          sortDescriptor,
          active.id,
          providerDisplayNames,
          modelDisplayNames,
        ),
      ),
    [
      active.id,
      filteredRows,
      modelDisplayNames,
      providerDisplayNames,
      sortDescriptor,
    ],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset scroll when the visible row set changes; the array is the trigger, not a value we read
  useLayoutEffect(() => {
    getTableScrollContainer(gridRef.current)?.scrollTo(0, 0);
  }, [sortedRows]);

  const columns = useMemo(
    () =>
      getColumns({
        modelDisplayNames,
        providerDisplayNames,
        viewId: active.id,
      }).filter(
        (column) =>
          column.id === "key" ||
          visibleColumns === "all" ||
          visibleColumns.has(column.id),
      ),
    [active.id, modelDisplayNames, providerDisplayNames, visibleColumns],
  );

  const columnOptions =
    active.id === "provider"
      ? HIDEABLE_COLUMNS.filter((column) => column.id !== "provider")
      : HIDEABLE_COLUMNS;

  const hasActiveFilters =
    search !== "" || providerFilter !== "all" || freeFilter !== "all";

  return (
    <Card className={className}>
      <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Card.Title>{title}</Card.Title>
            <Chip color="accent" size="sm" variant="soft">
              {sortedRows.length}
            </Chip>
          </div>
          <Card.Description>{active.description}</Card.Description>
        </div>
        <Segment
          selectedKey={selectedKey}
          onSelectionChange={handleViewChange}
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
      <Card.Content className="flex flex-col gap-4">
        <BreakdownToolbar
          columnOptions={columnOptions}
          onFreeFilterChange={setFreeFilter}
          onProviderFilterChange={setProviderFilter}
          onSearchChange={setSearch}
          onVisibleColumnsChange={setVisibleColumns}
          freeFilter={freeFilter}
          providerFilter={providerFilter}
          providerOptions={providerOptions}
          search={search}
          visibleColumns={visibleColumns}
        />
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {search !== "" && (
              <FilterChip
                clearLabel="Clear search"
                label={`Search: ${search}`}
                onClear={() => setSearch("")}
              />
            )}
            {freeFilter !== "all" && (
              <FilterChip
                clearLabel="Clear free filter"
                label="Free"
                onClear={() => setFreeFilter("all")}
              />
            )}
            {providerFilter !== "all" && (
              <FilterChip
                clearLabel="Clear provider filter"
                label={`Provider: ${providerDisplayNames[providerFilter] ?? providerFilter}`}
                onClear={() => setProviderFilter("all")}
              />
            )}
            <Button onPress={handleClearFilters} size="sm" variant="ghost">
              Clear all
            </Button>
          </div>
        )}
        <div ref={gridRef}>
          <DataGrid
            allowsColumnResize
            virtualized
            aria-label="Usage breakdown"
            className="[&_.table__cell]:overflow-hidden [&_.table__cell]:whitespace-nowrap [&_.table__cell]:py-1.5 [&_.table__cell]:text-xs [&_.table__column]:py-1.5 [&_.table__column]:text-[11px]"
            columns={columns}
            contentClassName="min-w-[760px] md:min-w-[1000px]"
            data={sortedRows}
            getRowId={(row) => row.key}
            headingHeight={GRID_HEADING_HEIGHT}
            onSortChange={setSortDescriptor}
            renderEmptyState={() => (
              <div className="py-8 text-center text-muted text-sm">
                No results match your filters.
              </div>
            )}
            rowHeight={GRID_ROW_HEIGHT}
            scrollContainerClassName={GRID_SCROLL_CLASS}
            sortDescriptor={sortDescriptor}
            variant="primary"
          />
        </div>
        <Typography.Paragraph color="muted" size="xs">
          Token usage from Anthropic excludes Claude Design at this moment.
        </Typography.Paragraph>
      </Card.Content>
    </Card>
  );
}
