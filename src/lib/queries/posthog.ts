import { cacheLife, cacheTag } from "next/cache";
import {
  POSTHOG_API_HOST,
  POSTHOG_API_KEY,
  POSTHOG_PRODUCTION_HOST,
  POSTHOG_PROJECT_ID,
  POSTHOG_TIMEZONE,
  TOP_PAGES_DAYS,
  VISITS_CHART_DAYS,
} from "@/config/posthog";

export type Visit = {
  date: string;
  visits: number;
};

export type PageMetric = {
  path: string;
  count: number;
  percent: number;
};

async function queryPostHog<T>(query: string): Promise<T | null> {
  try {
    const response = await fetch(
      `${POSTHOG_API_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
        },
        body: JSON.stringify({
          query: { kind: "HogQLQuery", query },
        }),
      },
    );

    if (!response.ok) {
      console.error(`PostHog Query API error: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch from PostHog Query API:", error);
    return null;
  }
}

export async function getLastUpdated(): Promise<string | null> {
  "use cache";
  cacheTag("posthog:last-updated");
  cacheLife("days");
  const data = await queryPostHog<{ results: [[string]] }>(
    `SELECT max(timestamp) FROM events WHERE event = '$pageview' AND properties.$host = '${POSTHOG_PRODUCTION_HOST}'`,
  );
  return data?.results?.[0]?.[0] ?? null;
}

export async function getTotalVisits(): Promise<number> {
  "use cache";
  cacheTag("posthog:visits:total");
  cacheLife("days");
  const data = await queryPostHog<{ results: [[number]] }>(
    `SELECT count() FROM events WHERE event = '$pageview' AND properties.$host = '${POSTHOG_PRODUCTION_HOST}'`,
  );
  return data?.results?.[0]?.[0] ?? 0;
}

export async function getVisits(): Promise<Visit[]> {
  "use cache";
  cacheTag("posthog:visits");
  cacheLife("days");
  const data = await queryPostHog<{ results: [string, number][] }>(`
      SELECT toDate(toTimezone(timestamp, '${POSTHOG_TIMEZONE}')) AS date, count() AS visits
      FROM events
      WHERE event = '$pageview'
        AND properties.$host = '${POSTHOG_PRODUCTION_HOST}'
        AND timestamp >= now() - INTERVAL ${VISITS_CHART_DAYS} DAY
      GROUP BY date
      ORDER BY date ASC
  `);

  if (!data?.results) return [];
  return data.results.map(([date, visits]) => ({ date, visits }));
}

export async function getPages(): Promise<PageMetric[]> {
  "use cache";
  cacheTag("posthog:pages");
  cacheLife("days");
  const data = await queryPostHog<{ results: [string, number][] }>(`
      SELECT properties.$pathname AS path, count() AS views
      FROM events
      WHERE event = '$pageview'
        AND properties.$host = '${POSTHOG_PRODUCTION_HOST}'
        AND timestamp >= now() - INTERVAL ${TOP_PAGES_DAYS} DAY
      GROUP BY path
      ORDER BY views DESC
          LIMIT 10
  `);

  if (!data?.results || data.results.length === 0) return [];

  const total = data.results.reduce((sum, [, count]) => sum + count, 0);
  return data.results.map(([path, count]) => ({
    path,
    count,
    percent: Math.round((count / total) * 1000) / 10,
  }));
}
