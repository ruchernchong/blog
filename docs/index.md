---
title: Introduction
description: Integration reference for ruchern.dev, covering the OAuth provider and the token usage ingestion endpoint.
---

These docs are the integration reference for [ruchern.dev](https://ruchern.dev). They are written for client developers and coding agents that need to authenticate against the site or send data to it.

## Guides

- [OAuth Provider Integration](/oauth-provider) explains how a client application authenticates users with the Authorization Code flow and PKCE, then calls protected routes with the issued access token. It covers discovery, endpoints, scopes, resources and how the server validates a token.
- [Token Usage Ingestion](/usage-ingestion) describes the `POST /api/usage/ingest` contract for importing local agent token usage. It covers authentication, the request body, the row contracts, idempotency and failure modes.

## Where to start

Read the OAuth guide first. The ingestion endpoint only accepts a bearer token issued by the OAuth provider to an admin account, so a client needs a working sign-in before it can send usage rows.

## For agents

Every page is available as Markdown by appending `.md` to its URL, and [`/llms.txt`](/llms.txt) lists all pages with their descriptions.
