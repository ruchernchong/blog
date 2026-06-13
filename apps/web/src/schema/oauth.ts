import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Database schema for the Better Auth `oidcProvider` plugin, which turns this
 * app into an OAuth 2.1 / OpenID Connect provider.
 *
 * The model names (and therefore the exported variable names) must match the
 * plugin's expected models exactly — the Drizzle adapter resolves each model
 * by its schema key. See the plugin schema in
 * `better-auth/plugins/oidc-provider`.
 */

export const oauthApplication = pgTable(
  "oauthApplication",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon"),
    metadata: text("metadata"),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    redirectUrls: text("redirect_urls").notNull(),
    type: text("type").notNull(),
    disabled: boolean("disabled").default(false),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("oauthApplication_userId_idx").on(table.userId)],
);

export const oauthAccessToken = pgTable(
  "oauthAccessToken",
  {
    id: text("id").primaryKey(),
    accessToken: text("access_token").notNull().unique(),
    refreshToken: text("refresh_token").notNull().unique(),
    accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthApplication.clientId, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    scopes: text("scopes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("oauthAccessToken_clientId_idx").on(table.clientId),
    index("oauthAccessToken_userId_idx").on(table.userId),
  ],
);

export const oauthConsent = pgTable(
  "oauthConsent",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthApplication.clientId, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scopes: text("scopes").notNull(),
    consentGiven: boolean("consent_given").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("oauthConsent_clientId_idx").on(table.clientId),
    index("oauthConsent_userId_idx").on(table.userId),
  ],
);

export const oauthApplicationRelations = relations(
  oauthApplication,
  ({ one, many }) => ({
    user: one(user, {
      fields: [oauthApplication.userId],
      references: [user.id],
    }),
    accessTokens: many(oauthAccessToken),
    consents: many(oauthConsent),
  }),
);

export const oauthAccessTokenRelations = relations(
  oauthAccessToken,
  ({ one }) => ({
    user: one(user, {
      fields: [oauthAccessToken.userId],
      references: [user.id],
    }),
    application: one(oauthApplication, {
      fields: [oauthAccessToken.clientId],
      references: [oauthApplication.clientId],
    }),
  }),
);

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
  user: one(user, {
    fields: [oauthConsent.userId],
    references: [user.id],
  }),
  application: one(oauthApplication, {
    fields: [oauthConsent.clientId],
    references: [oauthApplication.clientId],
  }),
}));
