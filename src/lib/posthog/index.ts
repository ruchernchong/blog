import { connection } from "next/server";

const POSTHOG_API_HOST = "https://eu.posthog.com";
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;

const VISITS_CHART_DAYS = 90;
const TOP_PAGES_DAYS = 30;

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
  if (!POSTHOG_PROJECT_ID || !POSTHOG_API_KEY) {
    console.error("PostHog Query API environment variables not configured");
    return null;
  }

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
        next: { revalidate: 3600 },
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

export async function getTotalVisits(): Promise<number> {
  await connection();
  const data = await queryPostHog<{ results: [[number]] }>(
    "SELECT count() FROM events WHERE event = '$pageview'",
  );
  return data?.results?.[0]?.[0] ?? 0;
}

export async function getVisits(): Promise<Visit[]> {
  await connection();
  const data = await queryPostHog<{ results: [string, number][] }>(`
    SELECT toDate(timestamp) AS date, count() AS visits
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= now() - INTERVAL ${VISITS_CHART_DAYS} DAY
    GROUP BY date
    ORDER BY date ASC
  `);

  if (!data?.results) return [];
  return data.results.map(([date, visits]) => ({ date, visits }));
}

export async function getPages(): Promise<PageMetric[]> {
  await connection();
  const data = await queryPostHog<{ results: [string, number][] }>(`
    SELECT properties.$pathname AS path, count() AS views
    FROM events
    WHERE event = '$pageview'
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
