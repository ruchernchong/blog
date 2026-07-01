import { buildPricing, type ModelsDevApi } from "../pricing";

/**
 * Fixture mirroring the models.dev payload shape. `gpt-5.5` is priced under both
 * `openai` and `fireworks-ai` to prove provider selection. Note `gpt-5.5-fast`
 * is deliberately absent: it is the fast-tier model id that models.dev does not
 * list, so it resolves only via the hardcoded `PRIORITY_RATES` override (and
 * stays null under any other provider, proving the override is provider-scoped).
 * `claude-sonnet-5` is likewise deliberately absent: models.dev doesn't list it
 * yet, so it resolves only via the `PRIORITY_RATES` override.
 */
const api: ModelsDevApi = {
  anthropic: {
    models: {
      "claude-sonnet": {
        cost: { input: 3, output: 15, cache_read: 0.3, cache_write: 3.75 },
      },
    },
  },
  openai: {
    models: {
      "gpt-5.5": { cost: { input: 1, output: 2 } },
      "gpt-5-codex": { cost: { input: 1.25, output: 10 } },
    },
  },
  "fireworks-ai": {
    models: {
      "gpt-5.5": { cost: { input: 99, output: 99 } },
    },
  },
};

describe("buildPricing", () => {
  const pricing = buildPricing(api);

  it("should resolve a model under the agent's derived provider", () => {
    expect(pricing.priceFor("claude-sonnet", { agent: "claude" })?.input).toBe(
      3,
    );
    expect(pricing.priceFor("gpt-5.5", { agent: "codex" })?.input).toBe(1);
  });

  it("should apply codex model aliases (codex-auto-review → gpt-5-codex)", () => {
    expect(
      pricing.priceFor("codex-auto-review", { agent: "codex" })?.input,
    ).toBe(1.25);
  });

  it("should select rate by explicit provider for multi-provider agents", () => {
    expect(pricing.priceFor("gpt-5.5", { provider: "openai" })?.input).toBe(1);
    expect(
      pricing.priceFor("gpt-5.5", { provider: "fireworks-ai" })?.input,
    ).toBe(99);
  });

  it("should override the fast-tier model id with the priority rate (openai-scoped)", () => {
    // gpt-5.5-fast is OpenCode's priority-tier model id; models.dev lacks it.
    expect(
      pricing.priceFor("gpt-5.5-fast", { provider: "openai" })?.input,
    ).toBe(12.5);
    expect(
      pricing.priceFor("gpt-5.5-fast", { provider: "openai" })?.output,
    ).toBe(75);
    // Plain gpt-5.5 is the standard tier and keeps its models.dev rate.
    expect(pricing.priceFor("gpt-5.5", { provider: "openai" })?.input).toBe(1);
    // The override is provider-scoped: no rate under a different provider.
    expect(
      pricing.priceFor("gpt-5.5-fast", { provider: "fireworks-ai" }),
    ).toBeNull();
  });

  it("should override claude-sonnet-5 with the priority rate (anthropic-scoped)", () => {
    // claude-sonnet-5 is priced at Sonnet 4.5's standard rate; models.dev lacks it.
    const rate = pricing.priceFor("claude-sonnet-5", { agent: "claude" });
    expect(rate?.input).toBe(3);
    expect(rate?.output).toBe(15);
    expect(rate?.cacheRead).toBe(0.3);
    expect(rate?.cacheWrite).toBe(3.75);
    // The override is provider-scoped: no rate under a different provider.
    expect(
      pricing.priceFor("claude-sonnet-5", { provider: "openai" }),
    ).toBeNull();
  });

  it("should return null for an unpriceable model", () => {
    expect(pricing.priceFor("ghost-model", { provider: "openai" })).toBeNull();
    expect(
      pricing.costOf(
        { input: 100, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 },
        "ghost-model",
        { provider: "openai" },
      ),
    ).toBeNull();
  });

  it("should compute cost across all token buckets", () => {
    // 1M input @ $1/M + 1M output @ $2/M = $3.
    const cost = pricing.costOf(
      {
        input: 1_000_000,
        output: 1_000_000,
        cacheRead: 0,
        cacheWrite: 0,
        reasoning: 0,
      },
      "gpt-5.5",
      { provider: "openai" },
    );
    expect(cost).toBeCloseTo(3, 6);
  });

  it("should price the fast-tier model at the priority override rate", () => {
    // 1M input @ $12.50 + 1M output @ $75 + 1M cache-read @ $1.25 = $88.75.
    const cost = pricing.costOf(
      {
        input: 1_000_000,
        output: 1_000_000,
        cacheRead: 1_000_000,
        cacheWrite: 0,
        reasoning: 0,
      },
      "gpt-5.5-fast",
      { provider: "openai" },
    );
    expect(cost).toBeCloseTo(88.75, 6);
  });
});
