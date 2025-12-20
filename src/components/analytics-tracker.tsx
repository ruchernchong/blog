"use client";

import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent } from "react";
import parseUserAgent from "@/utils/parse-user-agent";

const Analytics = () => {
  const pathname = usePathname();

  const sendAnalytics = useEffectEvent((path: string) => {
    try {
      const userAgent = navigator.userAgent;
      const parsedUA = parseUserAgent(userAgent);

      const url = "/api/analytics";
      const body = JSON.stringify({
        path,
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
  });

  useEffect(() => {
    sendAnalytics(pathname);
  }, [pathname]);

  return null;
};

export default Analytics;
