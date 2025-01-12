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

      const url = "/api/analytics";
      const body = JSON.stringify({
        path: pathname,
        referrer: document.referrer,
        ...parsedUA,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
      } else {
        fetch("/api/analytics", { method: "POST", body, keepalive: true });
      }
    } catch (error) {
      console.error("Failed to record analytics:", error);
    }
  }, [pathname]);

  return null;
};

export default Analytics;
