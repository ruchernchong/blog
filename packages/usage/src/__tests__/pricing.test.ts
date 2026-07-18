import { buildPricingFromRegistry } from "../pricing";
import {
  type ModelsDevApi,
  mergeRegistry,
  normaliseModelsDev,
  SEED_OVERRIDES,
} from "../registry";

/**
 * Fixture mirroring the models.dev payload shape. `gpt-5.5` is priced under both
 * `openai` and `fireworks-ai` to prove provider selection. The GPT-5.6 entries
 * deliberately carry incorrect rates so the tests prove the seeded overrides
 * take precedence. `gpt-5.5-fast` and `claude-sonnet-5` are absent from
 * models.dev, so they resolve only via the seeded override entries — exactly
 * as they do in production once merged from `SEED_OVERRIDES`.
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
      "gpt-5.6": { cost: { input: 91, output: 91 } },
      "gpt-5.6-sol": { cost: { input: 92, output: 92 } },
      "gpt-5.6-terra": { cost: { input: 93, output: 93 } },
      "gpt-5.6-luna": { cost: { input: 94, output: 94 } },
    },
  },
  "fireworks-ai": {
    models: {
      "gpt-5.5": { cost: { input: 99, output: 99 } },
      "gpt-5.6-sol": { cost: { input: 98, output: 98 } },
    },
  },
};

// Mirrors production: overrides > LiteLLM > models.dev, built into the registry.
const registry = mergeRegistry({
  overrides: SEED_OVERRIDES,
  litellm: [],
  modelsDev: normaliseModelsDev(api),
});

describe("buildPricingFromRegistry", () => {
  const pricing = buildPricingFromRegistry(registry);

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

  it("should pin exact GPT-5.6 rates ahead of models.dev", () => {
    expect(pricing.priceFor("gpt-5.6", { provider: "openai" })).toEqual({
      input: 5,
      output: 30,
      cacheRead: 0.5,
      cacheWrite: 6.25,
    });
    expect(pricing.priceFor("gpt-5.6-sol", { provider: "openai" })).toEqual({
      input: 5,
      output: 30,
      cacheRead: 0.5,
      cacheWrite: 6.25,
    });
    expect(pricing.priceFor("gpt-5.6-terra", { provider: "openai" })).toEqual({
      input: 2.5,
      output: 15,
      cacheRead: 0.25,
      cacheWrite: 3.125,
    });
    expect(pricing.priceFor("gpt-5.6-luna", { provider: "openai" })).toEqual({
      input: 1,
      output: 6,
      cacheRead: 0.1,
      cacheWrite: 1.25,
    });
  });

  it("should price the generic GPT-5.6 alias identically to Sol", () => {
    expect(pricing.priceFor("gpt-5.6", { provider: "openai" })).toEqual(
      pricing.priceFor("gpt-5.6-sol", { provider: "openai" }),
    );
  });

  it("should scope GPT-5.6 overrides to the OpenAI provider", () => {
    expect(
      pricing.priceFor("gpt-5.6-sol", { provider: "fireworks-ai" }),
    ).toEqual({ input: 98, output: 98, cacheRead: 0, cacheWrite: 0 });
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

  it("should price every GPT-5.6 token bucket at its pinned rate", () => {
    const cost = pricing.costOf(
      {
        input: 1_000_000,
        output: 1_000_000,
        cacheRead: 1_000_000,
        cacheWrite: 1_000_000,
        reasoning: 1_000_000,
      },
      "gpt-5.6-terra",
      { provider: "openai" },
    );

    // $2.50 input + $15 output + $0.25 cache read + $3.125 cache write
    // + $15 reasoning (billed as output) = $35.875.
    expect(cost).toBeCloseTo(35.875, 6);
  });
});
