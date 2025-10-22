import { geolocation } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";
import { db, type InsertSession, sessions } from "@/schema";

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
    const { city, country, flag, latitude, longitude } = geolocation(request);

    const session: InsertSession = {
      path,
      referrer,
      city,
      country,
      flag,
      latitude,
      longitude,
      browser,
      os,
      device,
      screen,
      language,
    };

    // Exclude the ID and duration from the returned values
    const [{ id, duration, ...newSession }] = await db
      .insert(sessions)
      .values(session)
      .returning();

    return NextResponse.json(newSession);
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
