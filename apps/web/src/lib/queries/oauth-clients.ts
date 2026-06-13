import { and, count, desc, eq, gt } from "drizzle-orm";
import {
  db,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  user,
} from "@/schema";

export interface OAuthClientListItem {
  id: string;
  clientId: string;
  name: string | null;
  disabled: boolean;
  public: boolean | null;
  type: string | null;
  scopes: string[] | null;
  redirectUris: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
  activeTokenCount: number;
  consentCount: number;
}

/**
 * List all registered OAuth clients with aggregated active access-token and
 * consent counts. "Active" tokens are those that have not yet expired.
 */
export const listOAuthClients = async (): Promise<OAuthClientListItem[]> => {
  const now = new Date();

  const [clients, tokenCounts, consentCounts] = await Promise.all([
    db.select().from(oauthClient).orderBy(desc(oauthClient.createdAt)),
    db
      .select({
        clientId: oauthAccessToken.clientId,
        total: count(),
      })
      .from(oauthAccessToken)
      .where(gt(oauthAccessToken.expiresAt, now))
      .groupBy(oauthAccessToken.clientId),
    db
      .select({
        clientId: oauthConsent.clientId,
        total: count(),
      })
      .from(oauthConsent)
      .groupBy(oauthConsent.clientId),
  ]);

  const tokenCountByClient = new Map(
    tokenCounts.map((row) => [row.clientId, row.total]),
  );
  const consentCountByClient = new Map(
    consentCounts.map((row) => [row.clientId, row.total]),
  );

  return clients.map((client) => ({
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    disabled: client.disabled ?? false,
    public: client.public,
    type: client.type,
    scopes: client.scopes,
    redirectUris: client.redirectUris,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    activeTokenCount: tokenCountByClient.get(client.clientId) ?? 0,
    consentCount: consentCountByClient.get(client.clientId) ?? 0,
  }));
};

export interface OAuthClientDetail {
  client: typeof oauthClient.$inferSelect;
  activeTokens: {
    id: string;
    scopes: string[];
    expiresAt: Date;
    createdAt: Date;
    userName: string | null;
    userEmail: string | null;
  }[];
  consents: {
    id: string;
    scopes: string[];
    createdAt: Date;
    userName: string | null;
    userEmail: string | null;
  }[];
}

/**
 * Fetch a single OAuth client by its public `clientId`, along with its active
 * (unexpired) access tokens and the users who have consented. Returns null when
 * the client does not exist.
 */
export const getOAuthClientDetail = async (
  clientId: string,
): Promise<OAuthClientDetail | null> => {
  const [client] = await db
    .select()
    .from(oauthClient)
    .where(eq(oauthClient.clientId, clientId))
    .limit(1);

  if (!client) return null;

  const now = new Date();

  const [activeTokens, consents] = await Promise.all([
    db
      .select({
        id: oauthAccessToken.id,
        scopes: oauthAccessToken.scopes,
        expiresAt: oauthAccessToken.expiresAt,
        createdAt: oauthAccessToken.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(oauthAccessToken)
      .leftJoin(user, eq(oauthAccessToken.userId, user.id))
      .where(
        and(
          eq(oauthAccessToken.clientId, clientId),
          gt(oauthAccessToken.expiresAt, now),
        ),
      )
      .orderBy(desc(oauthAccessToken.createdAt)),
    db
      .select({
        id: oauthConsent.id,
        scopes: oauthConsent.scopes,
        createdAt: oauthConsent.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(oauthConsent)
      .leftJoin(user, eq(oauthConsent.userId, user.id))
      .where(eq(oauthConsent.clientId, clientId))
      .orderBy(desc(oauthConsent.createdAt)),
  ]);

  return { client, activeTokens, consents };
};

/**
 * Toggle a client's `disabled` flag. Returns the updated client row, or
 * undefined when no client matched.
 */
export const setOAuthClientDisabled = async (
  clientId: string,
  disabled: boolean,
) => {
  const [updated] = await db
    .update(oauthClient)
    .set({ disabled, updatedAt: new Date() })
    .where(eq(oauthClient.clientId, clientId))
    .returning();

  return updated;
};

/**
 * Hard-delete a client by its public `clientId`. Cascades to its access tokens,
 * refresh tokens, and consents via the schema's foreign-key constraints.
 * Returns the deleted client row, or undefined when no client matched.
 */
export const deleteOAuthClient = async (clientId: string) => {
  const [deleted] = await db
    .delete(oauthClient)
    .where(eq(oauthClient.clientId, clientId))
    .returning();

  return deleted;
};
