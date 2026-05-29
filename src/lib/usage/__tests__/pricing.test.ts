import { buildPricing, type ModelsDevApi } from "../pricing";

/**
 * Fixture mirroring the models.dev payload shape. Note `gpt-5.5` is priced
 * differently under `openai` vs `fireworks-ai` to prove provider selection.
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
});
