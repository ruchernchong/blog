"use client";

import { Button } from "@heroui/react";
import { type ReactNode, useState } from "react";

interface UsageModelCharacterRowsProps {
  /** Server-rendered `<thead>`. */
  head: ReactNode;
  /** Server-rendered `<tr>` rows, biggest model first. */
  rows: ReactNode[];
  /** Server-rendered `<li>` phone cards, in the same order as `rows`. */
  cards: ReactNode[];
  /** Rows shown before "Show all". */
  initialCount: number;
}

/**
 * Keeps Model character compact while still reaching every model: it shows
 * the biggest few, and "Show all" reveals the rest along with their profile
 * buttons, the page's only entry point to those models' profiles.
 */
export function UsageModelCharacterRows({
  head,
  rows,
  cards,
  initialCount,
}: Readonly<UsageModelCharacterRowsProps>) {
  const [expanded, setExpanded] = useState(false);
  const hidden = rows.length - initialCount;

  return (
    <div className="flex flex-col gap-4">
      {/* Phones get a card list; the table needs ~640px before it scrolls. */}
      <ul className="flex flex-col divide-y divide-border md:hidden">
        {expanded ? cards : cards.slice(0, initialCount)}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          {head}
          <tbody>{expanded ? rows : rows.slice(0, initialCount)}</tbody>
        </table>
      </div>
      {hidden > 0 ? (
        <Button
          aria-expanded={expanded}
          className="self-start"
          onPress={() => setExpanded((value) => !value)}
          size="sm"
          variant="outline"
        >
          {expanded ? "Show fewer models" : `Show all ${rows.length} models`}
        </Button>
      ) : null}
    </div>
  );
}
