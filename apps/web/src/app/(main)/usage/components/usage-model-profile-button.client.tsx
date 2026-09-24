"use client";

import { Button } from "@heroui/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryState } from "nuqs";
import { usageParsers } from "../searchParams";

interface UsageModelProfileButtonProps {
  model: string;
  label: string;
}

/**
 * Explicit "View profile" affordance for a model. Sets `?model=`, which the
 * page-level `UsageModelDrawer` reads, so a profile is also linkable.
 */
export function UsageModelProfileButton({
  model,
  label,
}: UsageModelProfileButtonProps) {
  const [, setModel] = useQueryState(
    "model",
    usageParsers.model.withOptions({ history: "replace" }),
  );

  return (
    <Button
      aria-label={`View profile for ${label}`}
      className="h-auto min-w-0 gap-2 self-start px-0 text-accent"
      onPress={() => void setModel(model)}
      size="sm"
      variant="ghost"
    >
      View profile
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
    </Button>
  );
}

/** Same footprint as the button, for the Suspense fallback. */
export function UsageModelProfileButtonFallback() {
  return (
    <span aria-hidden="true" className="h-5 text-muted text-sm">
      View profile
    </span>
  );
}
