"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
    <div className="sticky top-0 right-0 left-0 z-40 mb-8 bg-gradient-to-r from-blue-600 to-pink-600 px-4 py-2">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2">
        <InformationCircleIcon className="size-4 text-white" />
        <Badge className="border-white/20 bg-white/10 text-white backdrop-blur-sm">
          {message}
        </Badge>
      </div>
    </div>
  );
};
