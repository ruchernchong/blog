---
title: ruchern.dev MCP Server
description: Connect an MCP client to the ruchern.dev MCP server to manage blog posts, media and the model pricing registry.
---

The ruchern.dev MCP server exposes the site's content management as [Model Context Protocol](https://modelcontextprotocol.io) tools. It is a private server: every call needs an OAuth access token that belongs to the site's admin account.

## Endpoints

Both endpoints serve the same tools and data over Streamable HTTP, in stateless mode.

| Endpoint | Host |
| --- | --- |
| `https://ruchern.dev/api/mcp` | The Next.js app on Vercel |
| `https://mcp.ruchern.dev/mcp` | A Cloudflare Worker |

Health checks need no token: `GET https://ruchern.dev/api/mcp/health` and `GET https://mcp.ruchern.dev/health`.

## Authentication

The server accepts OAuth only. No static token or session cookie is accepted.

1. The client reads the protected-resource metadata on the endpoint's own origin: `/.well-known/oauth-protected-resource/api/mcp` on `ruchern.dev`, or `/.well-known/oauth-protected-resource/mcp` on `mcp.ruchern.dev`.
2. It registers itself with the provider and signs the user in. See [OAuth Provider Integration](/oauth-provider).
3. It requests the `mcp` scope and passes the endpoint URL as the `resource`, so the access token's audience is that endpoint.

A missing or invalid token returns `401` with a `WWW-Authenticate` challenge that names the metadata document. A token without the `mcp` scope returns `403 insufficient_scope`. A token for a user who is not an admin returns `403`.

## Connecting a client

Add the URL as a remote MCP server with no headers, then sign in when the client prompts.

```json
{
  "mcpServers": {
    "blog": {
      "type": "http",
      "url": "https://ruchern.dev/api/mcp"
    }
  }
}
```

## Tools

Use the MCP `tools/list` method for the current list and each tool's input schema.

### Posts

| Tool | Purpose |
| --- | --- |
| `list_posts` | List posts, with optional status, limit and offset filters |
| `get_post` | Get one post by ID or slug |
| `create_post` | Create a post with generated metadata |
| `update_post` | Update a post |
| `delete_post` | Soft delete a post |
| `restore_post` | Restore a soft-deleted post |
| `publish_post` | Publish a draft |

### Media

| Tool | Purpose |
| --- | --- |
| `list_media` | List uploaded media, with search |
| `get_media` | Get one media item |
| `request_upload` | Get a presigned upload URL |
| `confirm_upload` | Confirm an upload and record it |
| `upload_from_url` | Upload an image from a public URL |
| `delete_media` | Soft delete a media item |

### Model registry

| Tool | Purpose |
| --- | --- |
| `list_model_overrides` | List curated pricing overrides, with an optional provider filter |
| `get_model` | Get one model's merged pricing and metadata |
| `upsert_model_override` | Create or update a pricing override, in USD per 1M tokens |
| `delete_model_override` | Delete a curated override |
