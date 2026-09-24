import type { Cost, UsageBreakdownRow } from "@workspace/usage/types";

/**
 * Pure row logic for the usage Explorer, shared by the desktop DataGrid and
 * the phone card list. Kept free of UI imports so it is unit-testable.
 */

/** Structurally compatible with the DataGrid's sort descriptor. */
export interface BreakdownSort {
  column: string | number;
  direction: "ascending" | "descending";
}

export interface BreakdownNames {
  providerDisplayNames: Record<string, string>;
  modelDisplayNames: Record<string, string>;
}

export interface BreakdownFilters {
  search: string;
  /** Provider slug, or "all". */
  providerFilter: string;
  /** Only free (zero or unpriced) rows. */
  freeOnly: boolean;
}

export interface ProviderOption {
  key: string;
  label: string;
}

export function rowProviders(row: UsageBreakdownRow): string[] {
  return row.providers ?? (row.provider ? [row.provider] : []);
}

export function rowDisplayName(
  row: UsageBreakdownRow,
  viewId: string,
  { providerDisplayNames, modelDisplayNames }: BreakdownNames,
): string {
  if (viewId === "provider") {
    return providerDisplayNames[row.key] ?? row.key;
  }
  if (viewId === "model") {
    return modelDisplayNames[row.key] ?? row.key;
  }
  return row.key;
}

/** Sort N.A. costs below every priced value (when sorted descending). */
const sortableCost = (cost: Cost): number => cost ?? Number.NEGATIVE_INFINITY;

export function compareRows(
  a: UsageBreakdownRow,
  b: UsageBreakdownRow,
  sort: BreakdownSort,
  viewId: string,
  names: BreakdownNames,
): number {
  const result = (() => {
    switch (sort.column) {
      case "key":
        return rowDisplayName(a, viewId, names).localeCompare(
          rowDisplayName(b, viewId, names),
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

  return sort.direction === "descending" ? -result : result;
}

/** Search (name or provider), provider and free filters, in that order. */
export function filterRows(
  rows: UsageBreakdownRow[],
  viewId: string,
  { search, providerFilter, freeOnly }: BreakdownFilters,
  names: BreakdownNames,
): UsageBreakdownRow[] {
  let filtered = rows;

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (row) =>
        rowDisplayName(row, viewId, names).toLowerCase().includes(query) ||
        rowProviders(row).some((provider) =>
          (names.providerDisplayNames[provider] ?? provider)
            .toLowerCase()
            .includes(query),
        ),
    );
  }

  if (providerFilter !== "all") {
    filtered = filtered.filter((row) =>
      rowProviders(row).includes(providerFilter),
    );
  }

  if (freeOnly) {
    filtered = filtered.filter((row) => row.cost === 0 || row.cost === null);
  }

  return filtered;
}

/** Providers present in a non-provider view, sorted by display name. */
export function providerOptionsFor(
  rows: UsageBreakdownRow[],
  viewId: string,
  providerDisplayNames: Record<string, string>,
): ProviderOption[] {
  if (viewId === "provider") {
    return [];
  }

  const keys = new Set<string>();
  for (const row of rows) {
    for (const provider of rowProviders(row)) {
      keys.add(provider);
    }
  }

  return [...keys]
    .map((key) => ({ key, label: providerDisplayNames[key] ?? key }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** A column visibility selection, as the DataGrid and menu report it. */
export type ColumnSelection = "all" | Set<string | number>;

/**
 * The visibility preference to store after a Columns-menu change. The sorted
 * column is shown (and locked) in the menu whatever the preference is, so it
 * arrives in every selection; keep it only if the visitor had chosen to show
 * it, so sorting by a hidden column never turns it on for good.
 */
export function columnPreferenceAfterChange(
  next: ColumnSelection,
  previous: ColumnSelection,
  lockedColumn: string,
): ColumnSelection {
  if (next === "all" || previous === "all" || previous.has(lockedColumn)) {
    return next;
  }
  const preference = new Set(next);
  preference.delete(lockedColumn);
  return preference;
}
