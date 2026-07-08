"use client";

import { Typography } from "@heroui/react";
import { formatDistance } from "date-fns";
import { enGB } from "date-fns/locale";

interface LastUpdatedClientProps {
  date: string;
}

export function LastUpdatedClient({ date }: LastUpdatedClientProps) {
  const relative = formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    includeSeconds: true,
    locale: enGB,
  });

  return (
    <Typography color="muted" type="body-sm">
      Last updated {relative}
    </Typography>
  );
}
