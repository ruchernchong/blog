"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import parseUserAgent from "@/utils/parse-user-agent";

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
        fetch(url, { method: "POST", body, keepalive: true });
      }
    } catch (error) {
      console.error("Failed to record analytics:", error);
    }
  }, [pathname]);

  return null;
};

export default Analytics;
