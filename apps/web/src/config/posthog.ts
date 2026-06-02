export const POSTHOG_API_HOST =
  process.env.POSTHOG_API_HOST ?? "https://t.ruchern.dev";
export const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID ?? "171487";
export const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;

export const POSTHOG_PRODUCTION_HOST =
  process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const POSTHOG_TIMEZONE = "Asia/Singapore";

export const VISITS_CHART_DAYS = 90;
export const TOP_PAGES_DAYS = 30;
