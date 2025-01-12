"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { parseUserAgent } from "@/lib/userAgent";

const Analytics = () => {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const userAgent = navigator.userAgent;
      const parsedUA = parseUserAgent(userAgent);

      fetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer,
          ...parsedUA,
        }),
      });
    } catch (error) {
      console.error("Failed to record analytics:", error);
    }
  }, [pathname]);

  return null;
};

export default Analytics;
