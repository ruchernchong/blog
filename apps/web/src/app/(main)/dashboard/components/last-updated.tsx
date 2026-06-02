import { Typography } from "@/components/typography";
import { getLastUpdated } from "@/lib/queries/posthog";

export async function LastUpdated() {
  const raw = await getLastUpdated();
  if (!raw) return null;

  const formatted = new Date(raw).toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
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
