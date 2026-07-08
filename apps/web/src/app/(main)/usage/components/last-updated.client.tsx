"use client";

import { Typography } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { enGB } from "date-fns/locale";

interface LastUpdatedClientProps {
  date: string;
}

export function LastUpdatedClient({ date }: LastUpdatedClientProps) {
  const relative = formatDistanceToNow(new Date(date), {
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
