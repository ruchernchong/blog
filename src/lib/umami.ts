import { connection } from "next/server";

const UMAMI_API_URL = process.env.UMAMI_API_URL;
const UMAMI_API_TOKEN = process.env.UMAMI_API_TOKEN;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

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

async function getDateRange(days: number) {
  await connection();

  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  return { startAt: startAt.toString(), endAt: endAt.toString() };
}

async function getAllTimeRange() {
  await connection();

  return { startAt: "0", endAt: Date.now().toString() };
}

export async function getTotalVisits(): Promise<number> {
  const { startAt, endAt } = await getAllTimeRange();
  const stats = await fetchUmami<UmamiStats>("/stats", { startAt, endAt });

  return stats?.pageviews ?? 0;
}

export async function getVisits(): Promise<Visit[]> {
  const { startAt, endAt } = await getDateRange(30);
  const data = await fetchUmami<{ pageviews: UmamiPageview[] }>("/pageviews", {
    startAt,
    endAt,
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
  const { startAt, endAt } = await getDateRange(30);
  const metrics = await fetchUmami<UmamiMetric[]>("/metrics", {
    startAt,
    endAt,
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
