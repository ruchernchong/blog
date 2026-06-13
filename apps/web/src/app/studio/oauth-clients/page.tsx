import { connection } from "next/server";
import { OAuthClientsTable } from "@/app/studio/oauth-clients/components/oauth-clients-table";

export default async function OAuthClientsPage() {
  await connection();
  return <OAuthClientsTable />;
}
