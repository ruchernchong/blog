"use client";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

export function ResumeDownloadButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="print:hidden"
      size="sm"
    >
      <HugeiconsIcon icon={Download01Icon} size={16} />
      Download PDF
    </Button>
  );
}
