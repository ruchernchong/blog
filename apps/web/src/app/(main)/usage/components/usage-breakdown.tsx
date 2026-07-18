"use client";

import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  ListBox,
  Pagination,
  SearchField,
  Typography,
} from "@heroui/react";
import {
  AreaChart,
  DataGrid,
  type DataGridColumn,
  type DataGridSelection,
  type DataGridSortDescriptor,
  InlineSelect,
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
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FreeModelChip } from "./free-model-chip";

interface BreakdownView {
  id: string;
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
  { id: "cost", label: "Cost" },
  { id: "costPerMillionTokens", label: "$ / 1M Tokens" },
  { id: "messages", label: "Messages" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const DEFAULT_SORT_DESCRIPTOR: DataGridSortDescriptor = {
  column: "tokens",
  direction: "descending",
};

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
      header: "Cost",
      align: "end",
      allowsSorting: true,
      cell: (row) => <CostValue cost={row.cost} />,
      cellClassName: "tabular-nums",
      minWidth: 125,
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
  onProviderFilterChange,
  onSearchChange,
  onVisibleColumnsChange,
  providerFilter,
  providerOptions,
  search,
  visibleColumns,
}: {
  columnOptions: { id: string; label: string }[];
  onProviderFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onVisibleColumnsChange: (keys: DataGridSelection) => void;
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

/** Collapse long page lists to "1 … n-1 n n+1 … last", as in the DataGrid docs. */
function paginationPages(
  pageCount: number,
  currentPage: number,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [1];
  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);
  for (let pageNumber = start; pageNumber <= end; pageNumber++) {
    pages.push(pageNumber);
  }
  if (currentPage < pageCount - 2) {
    pages.push("ellipsis-end");
  }
  pages.push(pageCount);

  return pages;
}

function BreakdownPagination({
  currentPage,
  onPageChange,
  onRowsPerPageChange,
  pageCount,
  rowsPerPage,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  pageCount: number;
  rowsPerPage: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 whitespace-nowrap text-xs">
      <Pagination size="sm">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={currentPage === 1}
              onPress={() => onPageChange(currentPage - 1)}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          {paginationPages(pageCount, currentPage).map((pageNumber) =>
            typeof pageNumber === "string" ? (
              <Pagination.Item key={pageNumber}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={pageNumber}>
                <Pagination.Link
                  isActive={pageNumber === currentPage}
                  onPress={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            <Pagination.Next
              isDisabled={currentPage === pageCount}
              onPress={() => onPageChange(currentPage + 1)}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
      <InlineSelect
        aria-label="Rows per page"
        onChange={(value) => {
          if (value) {
            onRowsPerPageChange(Number(value));
          }
        }}
        value={String(rowsPerPage)}
      >
        <InlineSelect.Trigger>
          <span className="text-muted">Rows per page</span>
          <InlineSelect.Value />
          <InlineSelect.Indicator />
        </InlineSelect.Trigger>
        <InlineSelect.Popover className="w-20">
          <ListBox>
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <ListBox.Item
                id={String(option)}
                key={option}
                textValue={String(option)}
              >
                {option}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </InlineSelect.Popover>
      </InlineSelect>
    </div>
  );
}

/**
 * A single breakdown card whose dataset is toggled with a segmented control.
 * Rows can be searched, filtered by provider, sorted, and paginated; column
 * visibility is user-toggleable. This component owns all of that state.
 */
export function UsageBreakdown({
  className,
  providerDisplayNames,
  modelDisplayNames,
  title,
  views,
}: UsageBreakdownProps) {
  const [selectedKey, setSelectedKey] = useState<string>(views[0]?.id);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<DataGridSelection>(
    new Set(HIDEABLE_COLUMNS.map((column) => column.id)),
  );
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>(
    DEFAULT_SORT_DESCRIPTOR,
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridMinHeight, setGridMinHeight] = useState<number>();

  const active = views.find((view) => view.id === selectedKey) ?? views[0];

  const handleViewChange = (key: string) => {
    setSelectedKey(key);
    setSearch("");
    setProviderFilter("all");
    setSortDescriptor(DEFAULT_SORT_DESCRIPTOR);
    setPage(1);
    setGridMinHeight(undefined);
  };

  const handleVisibleColumnsChange = (keys: DataGridSelection) => {
    setVisibleColumns(keys);
    setGridMinHeight(undefined);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleProviderFilterChange = (value: string) => {
    setProviderFilter(value);
    setPage(1);
  };

  const handleSortChange = (descriptor: DataGridSortDescriptor) => {
    setSortDescriptor(descriptor);
    setPage(1);
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setPage(1);
    setGridMinHeight(undefined);
  };

  const handleClearFilters = () => {
    setSearch("");
    setProviderFilter("all");
    setPage(1);
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

    return rows;
  }, [active, modelDisplayNames, providerDisplayNames, providerFilter, search]);

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

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);

  const pagedRows = useMemo(
    () =>
      sortedRows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
      ),
    [currentPage, rowsPerPage, sortedRows],
  );

  // Lock the height of a full page so shorter last pages don't shift layout.
  useLayoutEffect(() => {
    if (pagedRows.length === rowsPerPage && gridRef.current) {
      setGridMinHeight(gridRef.current.offsetHeight);
    }
  }, [pagedRows.length, rowsPerPage]);

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

  const hasActiveFilters = search !== "" || providerFilter !== "all";

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
          onSelectionChange={(key) => handleViewChange(String(key))}
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
          onProviderFilterChange={handleProviderFilterChange}
          onSearchChange={handleSearchChange}
          onVisibleColumnsChange={handleVisibleColumnsChange}
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
                onClear={() => handleSearchChange("")}
              />
            )}
            {providerFilter !== "all" && (
              <FilterChip
                clearLabel="Clear provider filter"
                label={`Provider: ${providerDisplayNames[providerFilter] ?? providerFilter}`}
                onClear={() => handleProviderFilterChange("all")}
              />
            )}
            <Button onPress={handleClearFilters} size="sm" variant="ghost">
              Clear all
            </Button>
          </div>
        )}
        <div ref={gridRef} style={{ minHeight: gridMinHeight }}>
          <DataGrid
            allowsColumnResize
            aria-label="Usage breakdown"
            className="[&_.table__cell]:py-1.5 [&_.table__cell]:text-xs [&_.table__column]:py-1.5 [&_.table__column]:text-[11px]"
            columns={columns}
            contentClassName="min-w-[760px] md:min-w-[1000px]"
            data={pagedRows}
            getRowId={(row) => row.key}
            onSortChange={handleSortChange}
            renderEmptyState={() => (
              <div className="py-8 text-center text-muted text-sm">
                No results match your filters.
              </div>
            )}
            sortDescriptor={sortDescriptor}
            variant="primary"
          />
        </div>
        {sortedRows.length > ROWS_PER_PAGE_OPTIONS[0] && (
          <BreakdownPagination
            currentPage={currentPage}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            pageCount={pageCount}
            rowsPerPage={rowsPerPage}
          />
        )}
        <Typography.Paragraph color="muted" size="xs">
          Token usage from Anthropic excludes Claude Design at this moment.
        </Typography.Paragraph>
      </Card.Content>
    </Card>
  );
}
