"use client";

import { PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ResumeSaveButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 font-medium text-muted text-sm transition-colors hover:bg-default hover:text-foreground print:hidden"
    >
      <HugeiconsIcon icon={PrinterIcon} size={15} strokeWidth={2} />
      Save as PDF
    </button>
  );
}
