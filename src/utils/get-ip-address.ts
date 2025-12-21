import { headers } from "next/headers";

export const getIpAddress = async (): Promise<string> => {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0];
  }
  const realIp = headersList.get("x-real-ip");
  return realIp ?? "127.0.0.1";
};
