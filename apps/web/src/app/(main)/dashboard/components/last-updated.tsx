import { Typography } from "@/components/typography";
import { APP_LOCALE, APP_TIME_ZONE } from "@/constants/date-time";
import { getLastUpdated } from "@/lib/queries/posthog";

export async function LastUpdated() {
  const raw = await getLastUpdated();
  if (!raw) return null;

  const formatted = new Date(raw).toLocaleString(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <Typography variant="caption" className="text-muted">
      Last updated: {formatted}
    </Typography>
  );
}
