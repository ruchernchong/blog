# Structural patterns

Derived from published posts on ruchern.dev (2022–2026).

## Opening hook

One or two lines. Pick one:

- **Question.** "So what is the `!` in TypeScript?"
- **Situation statement.** "It has been 3 years since Budget 2023, and today, the final CPF income ceiling of S$8,000 takes effect."
- **Personal anchor.** "When starting a new project, I prefer to keep everything inside the terminal."

No preamble. No "In this post, we will...". The hook *is* the thesis.

## Heading flow

### Problem-solving post
```
## Scenario
## Constraints
## Options
## Decision: <name the decision>
## What changed
## Why not <alternative>?
## Caveats
## Real-life example
## Takeaways
```

Used in: `patching-critical-third-party-risks-you-dont-control`.

### How-to post
```
## What are <thing>?
## How to <do the thing>?
## Conclusion
```

Used in: `guide-to-feature-flags`.

### Reference / command post
```
### Introduction
### ⚡ Quick Reference   (table of commands)
### Setup / Installation
### <per-topic sections with code>
### Conclusion
```

Used in: `level-up-your-workflow-with-github-cli`.

## Paragraph rhythm

- 1–3 sentences per paragraph, most often 1–2.
- Mix sentence lengths. Lean short. Use em dashes for the longer ones.
- Break dense reasoning with a bullet list.

## Bullet lists for trade-offs

Parallel, compressed, one idea per line:

```
- Wait for upstream: low effort, high schedule risk; you stay exposed.
- Rewrite now: good long-term, too slow for a blocker.
- Override only the risky dependency: simple, but may fail if versions are fixed.
- Fork-patch-publish: fastest reliable route; behaviour unchanged; easy to review.
```

Notice: trade-off named, cost named, verdict implied. No hedging.

## Code blocks

- Small and purposeful. Never a wall of code.
- **Always** open with triple backticks and a language tag. Never use an unlabelled fence.
- **Add the filename after the language tag whenever the code lives in a known file.** Format: ` ```<lang> <filename>`.
  - ` ```json package.json`
  - ` ```js new-feature.js`
  - ` ```text .env.development`
  - ` ```ts src/mcp/server.ts`
- Only omit the filename when the snippet is genuinely fileless (an inline shell command, a one-off REPL expression, a fragment with no real home).
- Lead in with one sentence, follow with one sentence. No essays before or after.

## Tables

Use for command references and per-option comparisons. Three columns is the sweet spot (Task / Command / Example).

## Conclusion

Reiterates the **why**. One short paragraph or a 2–3 item list. Reads like a handshake:

> "If your team hits a similar blocker, make the smallest safe change to pass checks, ship the release, and keep a clear plan to remove the fork."

Not a summary of sections. Not "In conclusion, we learned that...".

## Signature phrases

- "In short:"
- "Here's how I..."
- "So as you have guessed it,"
- "Given this, most teams should choose..."
- "This lowers risk, meets checks, and keeps the release on time."
