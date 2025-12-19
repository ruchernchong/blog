"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";

interface AnnouncementProps {
  message: string;
  variant?: "default" | "warning" | "success" | "danger";
  isClosable?: boolean;
}

export const Announcement = ({
  message,
  variant = "default",
  isClosable = false,
}: AnnouncementProps) => {
  return (
    <div className="sticky top-0 right-0 left-0 z-40 mb-8 bg-primary px-4 py-2">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={16}
          strokeWidth={2}
          className="text-white"
        />
        <Badge className="border-white/30 bg-white/20 text-white">
          {message}
        </Badge>
      </div>
    </div>
  );
};
