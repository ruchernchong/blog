import { buildPricingFromRegistry } from "./pricing";
import {
  type ModelsDevApi,
  mergeRegistry,
  normaliseModelsDev,
  SEED_OVERRIDES,
} from "./registry";

/**
 * Fixture mirroring the models.dev payload shape. `gpt-5.5` is priced under both
 * `openai` and `fireworks-ai` to prove provider selection. The GPT-5.6 entries
 * carry OpenAI's list rates, which resolve with no override. The Grok 4.6 entry
 * deliberately carries an incorrect rate so the tests prove the seeded override
 * takes precedence. `gpt-5.5-fast`, `claude-sonnet-5`, and
 * `grok-4.6-fast` are absent from models.dev, so they resolve only via the
 * seeded override entries — exactly as they do in production once merged from
 * `SEED_OVERRIDES`.
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
      "gpt-5.6": {
        cost: { input: 4, output: 20, cache_read: 0.4, cache_write: 5 },
      },
      "gpt-5.6-sol": {
        cost: { input: 4, output: 20, cache_read: 0.4, cache_write: 5 },
      },
      "gpt-5.6-terra": {
        cost: { input: 2, output: 12, cache_read: 0.2, cache_write: 2.5 },
      },
      "gpt-5.6-luna": {
        cost: { input: 0.2, output: 1.2, cache_read: 0.02, cache_write: 0.25 },
      },
    },
  },
  "fireworks-ai": {
    models: {
      "gpt-5.5": { cost: { input: 99, output: 99 } },
    },
  },
  xai: {
    models: {
      "grok-4.6": { cost: { input: 91, output: 91 } },
    },
  },
};

// Mirrors production: overrides > Gateway > models.dev > OpenRouter.
const registry = mergeRegistry({
  overrides: SEED_OVERRIDES,
  gateway: [],
  openrouter: [],
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

  it("should canonicalise to the registry id pricing resolved", () => {
    // Alias → target.
    expect(
      pricing.canonicalModel("codex-auto-review", { agent: "codex" }),
    ).toBe("gpt-5-codex");
    // Exact id → itself.
    expect(pricing.canonicalModel("gpt-5.5", { agent: "codex" })).toBe(
      "gpt-5.5",
    );
    // Punctuation/date variant → the registry's spelling.
    expect(
      pricing.canonicalModel("claude-sonnet-20260101", { agent: "claude" }),
    ).toBe("claude-sonnet");
    // Agent mode tag → the base model, under any provider.
    expect(pricing.canonicalModel("grok-4.6-build", { provider: "xai" })).toBe(
      "grok-4.6",
    );
    expect(
      pricing.canonicalModel("gpt-5.5-build", { provider: "openai" }),
    ).toBe("gpt-5.5");
    // Unknown id, or no provider, stays its own key.
    expect(pricing.canonicalModel("mystery", { agent: "claude" })).toBe(
      "mystery",
    );
    expect(pricing.canonicalModel("codex-auto-review")).toBe(
      "codex-auto-review",
    );
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

  it("should price GPT-5.6 from the live source with no override", () => {
    expect(pricing.priceFor("gpt-5.6-sol", { provider: "openai" })).toEqual({
      input: 4,
      output: 20,
      cacheRead: 0.4,
      cacheWrite: 5,
    });
    expect(pricing.priceFor("gpt-5.6-terra", { provider: "openai" })).toEqual({
      input: 2,
      output: 12,
      cacheRead: 0.2,
      cacheWrite: 2.5,
    });
    expect(pricing.priceFor("gpt-5.6-luna", { provider: "openai" })).toEqual({
      input: 0.2,
      output: 1.2,
      cacheRead: 0.02,
      cacheWrite: 0.25,
    });
  });

  it("should price the generic GPT-5.6 alias identically to Sol", () => {
    expect(pricing.priceFor("gpt-5.6", { provider: "openai" })).toEqual(
      pricing.priceFor("gpt-5.6-sol", { provider: "openai" }),
    );
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

  it("should not borrow another provider's rate for the same model id", () => {
    // gpt-5-codex is priced under openai only. Lookups are provider-scoped, so
    // it must not resolve under a provider that does not list it — the same
    // slug is routinely a different price from a different vendor.
    expect(pricing.priceFor("gpt-5-codex", { provider: "openai" })?.input).toBe(
      1.25,
    );
    expect(
      pricing.priceFor("gpt-5-codex", { provider: "fireworks-ai" }),
    ).toBeNull();
  });

  it("should return null when the provider cannot be resolved", () => {
    expect(pricing.priceFor("gpt-5-codex")).toBeNull();
    expect(
      pricing.priceFor("gpt-5-codex", { agent: "unknown-agent" }),
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

  it("should pin exact Grok 4.6 rates ahead of models.dev", () => {
    expect(pricing.priceFor("grok-4.6", { provider: "xai" })).toEqual({
      input: 2,
      output: 6,
      cacheRead: 0.5,
      cacheWrite: 0,
    });
    expect(pricing.priceFor("grok-4.6-fast", { provider: "xai" })).toEqual({
      input: 4,
      output: 12,
      cacheRead: 1,
      cacheWrite: 0,
    });
  });

  it("should scope Grok 4.6 overrides to the xAI provider", () => {
    expect(pricing.priceFor("grok-4.6", { provider: "openai" })).toBeNull();
    expect(
      pricing.priceFor("grok-4.6-fast", { provider: "cursor" }),
    ).toBeNull();
  });

  it("should price the Grok 4.6 dash slug identically to the dotted id", () => {
    expect(pricing.priceFor("grok-4-6", { provider: "xai" })).toEqual(
      pricing.priceFor("grok-4.6", { provider: "xai" }),
    );
  });

  it("should price every Grok 4.6 token bucket at its pinned rate", () => {
    const cost = pricing.costOf(
      {
        input: 1_000_000,
        output: 1_000_000,
        cacheRead: 1_000_000,
        cacheWrite: 0,
        reasoning: 1_000_000,
      },
      "grok-4.6",
      { provider: "xai" },
    );

    // $2 input + $6 output + $0.50 cache read + $6 reasoning (billed as output)
    // = $14.50.
    expect(cost).toBeCloseTo(14.5, 6);
  });

  it("should price every GPT-5.6 token bucket at its list rate", () => {
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

    // $2 input + $12 output + $0.20 cache read + $2.50 cache write
    // + $12 reasoning (billed as output) = $28.70.
    expect(cost).toBeCloseTo(28.7, 6);
  });
});
