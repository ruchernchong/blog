"use client";

import { Chip } from "@heroui/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

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
        <Chip
          variant="flat"
          color={variant === "default" ? "primary" : variant}
          className="bg-white/10 text-white"
        >
          {message}
        </Chip>
      </div>
    </div>
  );
};
