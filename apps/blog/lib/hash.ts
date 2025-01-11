import { createHash } from "crypto";

export function generateUserHash(ip: string): string {
  const salt = process.env.IP_SALT;
  return createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .slice(0, 8);
}
