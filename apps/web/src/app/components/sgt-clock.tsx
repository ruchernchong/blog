"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Singapore",
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function SgtClock() {
  const [time, setTime] = useState<string>();

  useEffect(() => {
    const tick = () => setTime(formatter.format(new Date()));

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="inline-flex items-center gap-2 font-mono font-semibold text-xl tabular-nums tracking-tight">
        <span className="size-1.5 rounded-full bg-success motion-safe:animate-status-pulse" />
        {time ?? "--:--:--"}
      </span>
      <span className="font-mono text-muted text-xs tracking-widest">
        SGT · SINGAPORE
      </span>
    </div>
  );
}
