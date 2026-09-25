"use client";

import { Button } from "@heroui/react";

interface UsageToggleOption<T extends string | number> {
  value: T;
  label: string;
}

interface UsageToggleProps<T extends string | number> {
  /** Names the group for assistive tech, e.g. "Period". */
  label: string;
  options: UsageToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Small segmented switch for section-level views, styled like the heatmap's
 * year buttons: the active option is primary, the rest ghost.
 */
export function UsageToggle<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: Readonly<UsageToggleProps<T>>) {
  return (
    <fieldset className="flex min-w-0 flex-wrap gap-2">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <Button
          aria-pressed={option.value === value}
          key={option.value}
          onPress={() => onChange(option.value)}
          size="sm"
          variant={option.value === value ? "primary" : "ghost"}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  );
}
