# `@workspace/cli`

The **macOS usage collector**, a Rust binary named `agent-usage` (formerly
`usage-ingest`). It reads local agent logs and POSTs daily rows to the ingest
endpoint. It is not the AgentUsage app, which is a separate client. Commands:
`measure`, `ingest`, `auth login|logout|status`, and `completions`
(`agent-usage --help`). Install, OAuth login, and LaunchAgent:

**[macos/INSTALL.md](./macos/INSTALL.md)**
