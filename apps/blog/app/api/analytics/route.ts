import { geolocation } from "@vercel/functions";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { pageViews, type NewPageView } from "@/db/schema";

interface RequestData {
  path: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
  screen: string;
  language: string;
  isBot: boolean;
}

export const config = {
  runtime: "edge",
};

export const POST = async (request: NextRequest) => {
  try {
    const {
      path,
      referrer,
      browser,
      os,
      device,
      screen,
      language,
    }: RequestData = await request.json();
    const { city, country, region, latitude, longitude } = geolocation(request);

    const pageView: NewPageView = {
      path,
      browser,
      os,
      device,
      screen,
      language,
      referrer,
      city,
      country,
      region,
      latitude,
      longitude,
    };

    // Exclude the ID and duration from the returned values
    const [{ id, duration, ...newPageView }] = await db
      .insert(pageViews)
      .values(pageView)
      .returning();

    return NextResponse.json(newPageView);
  } catch (error) {
    console.error("Analytics recording failed:", error);
    return NextResponse.json(
      {
        message: "Failed to record analytics",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
};
