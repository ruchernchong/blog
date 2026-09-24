"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { USAGE_SORT_COLUMNS, type UsageSortColumn } from "../searchParams";

function isSortColumn(column: unknown): column is UsageSortColumn {
  return USAGE_SORT_COLUMNS.includes(column as UsageSortColumn);
}

/** Sort choices for the phone card list, which has no sortable headers. */
const MOBILE_SORT_OPTIONS: { id: UsageSortColumn; label: string }[] = [
  { id: "tokens", label: "Tokens" },
  { id: "cost", label: "API equivalent" },
  { id: "costPerMillionTokens", label: "$ / 1M tokens" },
  { id: "messages", label: "Messages" },
  { id: "key", label: "Name" },
  { id: "provider", label: "Provider" },
];

/**
 * Sort menu plus direction toggle for the phone card list. Drives the same
 * `?sort=` / `?dir=` state as the desktop grid's column headers.
 */
export function UsageSortControl({
  sort,
  dir,
  onChange,
}: {
  sort: UsageSortColumn;
  dir: "asc" | "desc";
  onChange: (sort: UsageSortColumn, dir: "asc" | "desc") => void;
}) {
  const current =
    MOBILE_SORT_OPTIONS.find((option) => option.id === sort) ??
    MOBILE_SORT_OPTIONS[0];

  return (
    <div className="flex items-center gap-2">
      <Dropdown>
        <Button size="sm" variant="outline">
          Sort: {current.label}
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            aria-label="Sort rows by"
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const next = keys === "all" ? undefined : [...keys][0];
              if (isSortColumn(next)) onChange(next, dir);
            }}
            selectedKeys={new Set([current.id])}
            selectionMode="single"
          >
            {MOBILE_SORT_OPTIONS.map((option) => (
              <Dropdown.Item
                id={option.id}
                key={option.id}
                textValue={option.label}
              >
                <Label>{option.label}</Label>
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <Button
        aria-label={dir === "asc" ? "Sort descending" : "Sort ascending"}
        isIconOnly
        onPress={() => onChange(current.id, dir === "asc" ? "desc" : "asc")}
        size="sm"
        variant="outline"
      >
        <HugeiconsIcon
          icon={dir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
          size={16}
          strokeWidth={1.5}
        />
      </Button>
    </div>
  );
}
