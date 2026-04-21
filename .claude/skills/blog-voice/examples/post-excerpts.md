# Reference excerpts

Short passages from published posts on ruchern.dev. Use these as the ground truth for voice — when in doubt, pattern-match against these, not the abstract rules.

## Openings

**Situation statement** (`8000-the-new-cpf-ceiling`):
> It has been 3 years since Budget 2023, and today, the final CPF income ceiling of S$8,000 takes effect.

**Personal anchor** (`level-up-your-workflow-with-github-cli`):
> When starting a new project, I prefer to keep everything inside the terminal.
> With **GitHub CLI (`gh`)**, I can create repositories, manage issues, and handle pull requests — all without touching the GitHub website.

**Direct question** (`understanding-non-null-assertion-operator`):
> So what is the `!` in TypeScript?
>
> This is actually known as a non-null assertion operator.

**Scenario framing** (`patching-critical-third-party-risks-you-dont-control`):
> Your organisation relies on third-party libraries. Sooner or later, your security tools will flag a critical bug in a dependency of a dependency. The original project still uses the unsafe version, the maintainers are inactive, and your release is close. You need a safe, fast fix that doesn't change product behaviour.

## Trade-off lists

From `patching-critical-third-party-risks-you-dont-control`:
> - Wait for upstream: low effort, high schedule risk; you stay exposed.
> - Rewrite now: good long-term, too slow for a blocker.
> - Override only the risky dependency: simple, but may fail if versions are fixed or the library depends on that exact version.
> - Fork-patch-publish: fastest reliable route; behaviour unchanged; easy to review.
>
> Given this, most teams should choose fork-patch-publish.

Note the cadence: trade-off named, cost named, verdict implied, then one-line decision.

## Code framing

From `guide-to-feature-flags`:
> ```text .env.development
> FEATURE_FLAG_NEW_FEATURE=true
> ```
>
> ```text .env.production
> FEATURE_FLAG_NEW_FEATURE=false
> ```
>
> ```js new-feature.js
> if (process.env.FEATURE_FLAG_NEW_FEATURE === "true") {
>   // Some cool features here
> } else {
>   // Some alternate features here
> }
> ```
>
> From the above example, we used the `process.env` environment variables to control a particular feature.

One-sentence follow-up. No essay after the code.

## Caveats section

From `patching-critical-third-party-risks-you-dont-control`:
> Publishing a forked package to npm isn't always possible. Use it when these hold:
>
> - The issue blocks a release and is critical.
> - Upstream is inactive or unlikely to release soon.
> - Your change is small, safe, and keeps behaviour the same.
> - You have a clear plan to remove the fork later.
> - Legal/licence is compatible and approved.
> - An owner is assigned to maintain and deprecate the fork.

Honest about when the approach fails. Parallel bullet structure.

## Conclusions

**Handshake close** (`patching-critical-third-party-risks-you-dont-control`):
> If your team hits a similar blocker, make the smallest safe change to pass checks, ship the release, and keep a clear plan to remove the fork.

**Why-reiteration** (`guide-to-feature-flags`):
> Feature flags are very powerful to give teams and especially developers more control of the features being released and in turn more control over the UX of a product.

**Terse sign-off** (`understanding-non-null-assertion-operator`):
> And that is all for this post. Just wanted to share something regarding the `!` operator that I discovered while writing code in Swift and now being able to also use it in TypeScript.

**Tool-focused close** (`level-up-your-workflow-with-github-cli`):
> GitHub CLI keeps your workflow smooth and focused.
> From creating new repositories to managing issues and pull requests, it lets you stay entirely within the terminal — no browser required.

## Takeaway list

From `patching-critical-third-party-risks-you-dont-control`:
> - In organisations, simple, safe fixes beat perfect solutions when time is short.
> - Forks are fine if they are small, documented, and temporary.
> - Plan the exit: watch upstream or replace the library with a small, maintainable option.

Each bullet is a standalone lesson. No preamble sentence.
