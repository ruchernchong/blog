"use client";

import { formatDistance } from "date-fns";
import { enGB } from "date-fns/locale";

interface LastUpdatedClientProps {
  date: string;
}

export function LastUpdatedClient({ date }: LastUpdatedClientProps) {
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    includeSeconds: true,
    locale: enGB,
  });
}
