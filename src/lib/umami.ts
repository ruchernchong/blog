import { connection } from "next/server";

const UMAMI_API_URL = process.env.UMAMI_API_URL;
const UMAMI_API_TOKEN = process.env.UMAMI_API_TOKEN;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const VISITS_CHART_DAYS = 90;
const TOP_PAGES_DAYS = 30;

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

interface UmamiMetric {
  x: string;
  y: number;
}

interface UmamiPageview {
  x: string;
  y: number;
}

export type Visit = {
  date: string;
  visits: number;
};

export type PageMetric = {
  path: string;
  count: number;
  percent: number;
};

const fetchUmami = async <T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T | null> => {
  if (!UMAMI_API_URL || !UMAMI_API_TOKEN || !UMAMI_WEBSITE_ID) {
    console.error("Umami environment variables not configured");
    return null;
  }

  const url = new URL(
    `/api/websites/${UMAMI_WEBSITE_ID}${endpoint}`,
    UMAMI_API_URL,
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${UMAMI_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Umami API error: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch from Umami:", error);
    return null;
  }
};

export async function getTotalVisits(): Promise<number> {
  await connection();
  // Generate dates after connection() to ensure we're in request context
  const endAt = Date.now().toString();
  const startAt = "0";
  const stats = await fetchUmami<UmamiStats>("/stats", { startAt, endAt });

  return stats?.pageviews ?? 0;
}

export async function getVisits(): Promise<Visit[]> {
  await connection();
  // Generate dates after connection() to ensure we're in request context
  const endAt = Date.now();
  const startAt = endAt - VISITS_CHART_DAYS * DAY_IN_MS;
  const data = await fetchUmami<{ pageviews: UmamiPageview[] }>("/pageviews", {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    unit: "day",
    timezone: "Asia/Singapore",
  });

  if (!data?.pageviews) {
    return [];
  }

  return data.pageviews.map((item) => ({
    date: item.x.split("T")[0],
    visits: item.y,
  }));
}

export async function getPages(): Promise<PageMetric[]> {
  await connection();
  // Generate dates after connection() to ensure we're in request context
  const endAt = Date.now();
  const startAt = endAt - TOP_PAGES_DAYS * DAY_IN_MS;
  const metrics = await fetchUmami<UmamiMetric[]>("/metrics", {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    type: "path",
  });

  if (!metrics || metrics.length === 0) {
    return [];
  }

  const total = metrics.reduce((sum, m) => sum + m.y, 0);

  return metrics.map((item) => ({
    path: item.x,
    count: item.y,
    percent: Math.round((item.y / total) * 1000) / 10,
  }));
}
