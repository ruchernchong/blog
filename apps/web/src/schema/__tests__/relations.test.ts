import {
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
} from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "../schema";

// Resolving the relational config runs every `relations()` callback.
const { tables } = extractTablesRelationalConfig(
  schema,
  createTableRelationsHelpers,
);

describe("auth schema", () => {
  it("should expose every relation declared on user", () => {
    expect(Object.keys(tables.user.relations).sort()).toEqual([
      "accounts",
      "oauthAccessTokens",
      "oauthClients",
      "oauthConsents",
      "oauthRefreshTokens",
      "sessions",
    ]);
  });

  it("should link auth and OAuth rows to their parent tables", () => {
    expect(tables.session.relations.user.referencedTableName).toBe("user");
    expect(tables.account.relations.user.referencedTableName).toBe("user");
    expect(tables.oauthConsent.relations.oauthClient.referencedTableName).toBe(
      "oauth_client",
    );
    expect(
      tables.oauthAccessToken.relations.oauthRefreshToken.referencedTableName,
    ).toBe("oauth_refresh_token");
    expect(
      tables.oauthClientResource.relations.oauthResource.referencedTableName,
    ).toBe("oauth_resource");
  });

  it("should resolve every foreign key to an existing table", () => {
    for (const table of [
      schema.session,
      schema.account,
      schema.oauthClient,
      schema.oauthClientResource,
      schema.oauthRefreshToken,
      schema.oauthAccessToken,
      schema.oauthConsent,
    ]) {
      for (const fk of getTableConfig(table).foreignKeys) {
        expect(fk.reference().foreignTable).toBeDefined();
      }
    }
  });

  it("should keep tokens when their session is deleted", () => {
    const sessionFk = getTableConfig(schema.oauthAccessToken).foreignKeys.find(
      (fk) => fk.reference().columns[0].name === "session_id",
    );
    expect(sessionFk?.onDelete).toBe("set null");
  });

  it("should stamp updatedAt with a new date on update", () => {
    expect(schema.user.updatedAt.onUpdateFn?.()).toBeInstanceOf(Date);
    expect(schema.session.updatedAt.onUpdateFn?.()).toBeInstanceOf(Date);
    expect(schema.account.updatedAt.onUpdateFn?.()).toBeInstanceOf(Date);
  });
});

describe("posts schema", () => {
  it("should relate posts to their author and series", () => {
    expect(tables.posts.relations.author.referencedTableName).toBe("user");
    expect(tables.posts.relations.series.referencedTableName).toBe("series");
  });

  it("should cascade author deletes but detach posts from a deleted series", () => {
    const [author, series] = getTableConfig(schema.posts).foreignKeys;
    expect(author.reference().foreignTable).toBe(schema.user);
    expect(author.onDelete).toBe("cascade");
    expect(series.reference().foreignTable).toBe(schema.series);
    expect(series.onDelete).toBe("set null");
  });
});
