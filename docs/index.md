---
title: ruchern.dev API documentation
description: API and integration reference for ruchern.dev, covering the OAuth provider, the MCP server and the token usage ingestion endpoint.
---

These docs are the integration reference for [ruchern.dev](https://ruchern.dev). They are written for client developers and coding agents that need to authenticate against the site or send data to it.

## Guides

- [OAuth Provider Integration](/oauth-provider) explains how a client application authenticates users with the Authorization Code flow and PKCE, then calls protected routes with the issued access token. It covers discovery, endpoints, scopes, resources and how the server validates a token.
- [ruchern.dev MCP Server](/mcp-server) lists the MCP endpoints, how a client authenticates and the tools for managing posts, media and the model registry.
- [Token Usage Ingestion](/usage-ingestion) describes the `POST /api/usage/ingest` contract for importing local agent token usage. It covers authentication, the request body, the row contracts, idempotency and failure modes.

## API description

The HTTP API is described in OpenAPI 3.1 at [`https://ruchern.dev/openapi.json`](https://ruchern.dev/openapi.json). The source is on GitHub at [ruchernchong/blog](https://github.com/ruchernchong/blog).

## Where to start

Read the OAuth guide first. The ingestion endpoint only accepts a bearer token issued by the OAuth provider to an admin account, so a client needs a working sign-in before it can send usage rows.

## For agents

Every page is available as Markdown by appending `.md` to its URL, and [`/llms.txt`](/llms.txt) lists all pages with their descriptions.
