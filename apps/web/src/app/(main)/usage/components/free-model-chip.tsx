import { Chip } from "@heroui/react";
import type { Cost } from "@workspace/usage/types";

interface FreeModelChipProps {
  cost: Cost;
  viewId: string;
}

export function FreeModelChip({ cost, viewId }: FreeModelChipProps) {
  if (viewId !== "model" || cost !== 0) {
    return null;
  }

  return (
    <Chip color="success" size="sm" variant="soft">
      Free
    </Chip>
  );
}
