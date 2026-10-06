# `@workspace/cli`

The **macOS usage collector**, a Rust binary named `agent-usage` (formerly
`usage-ingest`). It reads local agent logs and POSTs daily rows to the ingest
endpoint. It is not the AgentUsage app, which is a separate client. Commands:
`measure`, `ingest`, `auth login|logout|status`, `update [--check]`, and `completions`
(`agent-usage --help`). Install, OAuth login, and LaunchAgent:

**[macos/INSTALL.md](./macos/INSTALL.md)**

Gemini CLI is collected automatically from `~/.gemini/tmp/<project>/chats/`:
both legacy JSON snapshots and current JSONL recordings, including subagents.
Cached prompt tokens are separated from input; Gemini's output already excludes
thought tokens. Repeated messages in resumed recordings are counted once.
See the [Gemini session documentation](https://geminicli.com/docs/cli/session-management/).

Antigravity **CLI** is collected from
`~/.gemini/antigravity-cli/conversations/*.db`, including live SQLite WAL data.
Only protobuf step metadata is decoded; prompts and tool payloads are not read.
Input counts already exclude cache reads/writes; reasoning is separated from
gross output counts. Cache reads and writes retain their own counters, and
provider request IDs deduplicate calls copied into conversation forks. Providers
are recorded per call (Google, Anthropic, or OpenAI). The database format is
private and version-dependent; unsupported or corrupt records produce warnings
without stopping other agents. Antigravity IDE `.pb` histories are not supported.

When a step includes a model name, it is used directly. Otherwise, the opaque
model enum is preserved as `antigravity-model-<id>`; tokens still count, but costs
remain N.A. until a model registry override supplies a verified alias or rates.
The collector never guesses which public model an opaque enum represents.
