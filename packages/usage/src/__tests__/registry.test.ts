import {
  bareSlug,
  type ModelEntry,
  matchSlug,
  mergeRegistry,
  normaliseLiteLLM,
  normaliseModelsDev,
  normaliseOpenRouter,
} from "../registry";

describe("normaliseModelsDev", () => {
  it("should keep cost as USD/1M and pull name/release/limit", () => {
    const [entry] = normaliseModelsDev({
      anthropic: {
        models: {
          "claude-sonnet-5": {
            name: "Claude Sonnet 5",
            release_date: "2026-06-30",
            limit: { context: 1_000_000, output: 64_000 },
            cost: { input: 3, output: 15, cache_read: 0.3, cache_write: 3.75 },
          },
        },
      },
    });
    expect(entry).toMatchObject({
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      releaseDate: "2026-06-30",
      contextLimit: 1_000_000,
      rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
      source: "models.dev",
    });
  });
});

describe("bareSlug", () => {
  it("should strip routing and vendor prefixes but keep dotted model names", () => {
    expect(bareSlug("bedrock/anthropic.claude-sonnet-5")).toBe(
      "claude-sonnet-5",
    );
    expect(bareSlug("anthropic.claude-sonnet-5")).toBe("claude-sonnet-5");
    expect(bareSlug("openai/gpt-5.6")).toBe("gpt-5.6");
    // A dot inside the model name (not a vendor prefix) must survive.
    expect(bareSlug("gpt-5.6")).toBe("gpt-5.6");
    expect(bareSlug("claude-3.5-sonnet")).toBe("claude-3.5-sonnet");
  });
});

describe("normaliseLiteLLM", () => {
  it("should convert per-token cost to USD/1M and infer the vendor from the slug", () => {
    const entries = normaliseLiteLLM({
      sample_spec: { input_cost_per_token: 0 },
      "claude-sonnet-5": {
        input_cost_per_token: 0.000_003,
        output_cost_per_token: 0.000_015,
        cache_read_input_token_cost: 0.000_000_3,
        cache_creation_input_token_cost: 0.000_003_75,
        max_input_tokens: 1_000_000,
        litellm_provider: "anthropic",
      },
    });
    expect(entries).toEqual([
      {
        provider: "anthropic",
        id: "claude-sonnet-5",
        rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextLimit: 1_000_000,
        source: "litellm",
      },
    ]);
  });

  it("should dedupe a model across bedrock/vertex duplicates, first priced wins", () => {
    const entries = normaliseLiteLLM({
      "claude-sonnet-5": {
        input_cost_per_token: 0.000_003,
        output_cost_per_token: 0.000_015,
        litellm_provider: "anthropic",
      },
      "bedrock/anthropic.claude-sonnet-5": {
        input_cost_per_token: 0.000_009,
        output_cost_per_token: 0.000_045,
        litellm_provider: "bedrock_converse",
      },
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      provider: "anthropic",
      id: "claude-sonnet-5",
      rate: { input: 3, output: 15 },
    });
  });

  it("should skip entries missing input or output cost", () => {
    expect(
      normaliseLiteLLM({
        "embedding-model": {
          input_cost_per_token: 0.000_001,
          litellm_provider: "openai",
          mode: "embedding",
        },
      }),
    ).toEqual([]);
  });
});

describe("normaliseOpenRouter", () => {
  it("should split the id, convert per-token pricing, and derive release date", () => {
    const [entry] = normaliseOpenRouter({
      data: [
        {
          id: "anthropic/claude-sonnet-5",
          name: "Anthropic: Claude Sonnet 5",
          created: 1_782_843_083,
          context_length: 1_000_000,
          pricing: {
            prompt: "0.000003",
            completion: "0.000015",
            input_cache_read: "0.0000003",
          },
        },
      ],
    });
    expect(entry).toMatchObject({
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Anthropic: Claude Sonnet 5",
      contextLimit: 1_000_000,
      rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
      source: "openrouter",
    });
    expect(entry.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("matchSlug", () => {
  it("should match exact, then case-insensitive, then bare slug", () => {
    expect(matchSlug("gpt-5.6", ["gpt-5.6"])).toBe("gpt-5.6");
    expect(matchSlug("gpt-5.6", ["GPT-5.6"])).toBe("GPT-5.6");
    expect(matchSlug("claude-sonnet-5", ["anthropic.claude-sonnet-5"])).toBe(
      "anthropic.claude-sonnet-5",
    );
    expect(matchSlug("missing", ["gpt-5.6"])).toBeUndefined();
  });
});

describe("mergeRegistry", () => {
  const litellm: ModelEntry[] = [
    {
      provider: "anthropic",
      id: "claude-sonnet-5",
      rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
      source: "litellm",
    },
  ];
  const modelsDev: ModelEntry[] = [
    {
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      releaseDate: "2026-06-30",
      rate: { input: 99, output: 99 },
      source: "models.dev",
    },
  ];

  it("should take the rate from LiteLLM over models.dev but the name from models.dev", () => {
    const [entry] = mergeRegistry({ overrides: [], litellm, modelsDev });
    expect(entry).toMatchObject({
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      releaseDate: "2026-06-30",
      rate: { input: 3, output: 15 },
      source: "litellm",
      isOverride: false,
    });
  });

  it("should let a rate-only override win the rate while keeping the models.dev name", () => {
    const overrides: ModelEntry[] = [
      {
        provider: "anthropic",
        id: "claude-sonnet-5",
        rate: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
        source: "override",
        isOverride: true,
      },
    ];
    const [entry] = mergeRegistry({ overrides, litellm, modelsDev });
    expect(entry.rate).toEqual({
      input: 2,
      output: 10,
      cacheRead: 0.2,
      cacheWrite: 2.5,
    });
    expect(entry.displayName).toBe("Claude Sonnet 5");
    expect(entry.isOverride).toBe(true);
    expect(entry.source).toBe("override");
  });

  it("should let a name-only override keep the LiteLLM rate", () => {
    const overrides: ModelEntry[] = [
      {
        provider: "anthropic",
        id: "claude-sonnet-5",
        displayName: "My Sonnet",
        source: "override",
        isOverride: true,
      },
    ];
    const [entry] = mergeRegistry({ overrides, litellm, modelsDev });
    expect(entry.displayName).toBe("My Sonnet");
    expect(entry.rate).toEqual({
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    });
  });

  it("should price a LiteLLM-only model models.dev is missing, and name a models.dev-only model", () => {
    const merged = mergeRegistry({
      overrides: [],
      litellm: [
        {
          provider: "openai",
          id: "gpt-new",
          rate: { input: 1, output: 2 },
          source: "litellm",
        },
      ],
      modelsDev: [
        {
          provider: "openai",
          id: "gpt-old",
          displayName: "GPT Old",
          source: "models.dev",
        },
      ],
    });
    const gptNew = merged.find((e) => e.id === "gpt-new");
    const gptOld = merged.find((e) => e.id === "gpt-old");
    expect(gptNew?.rate).toEqual({ input: 1, output: 2 });
    expect(gptOld?.displayName).toBe("GPT Old");
    expect(gptOld?.rate).toBeUndefined();
  });

  it("should carry an alias-only override with no rate", () => {
    const merged = mergeRegistry({
      overrides: [
        {
          provider: "openai",
          id: "codex-auto-review",
          aliasTarget: "gpt-5-codex",
          source: "override",
          isOverride: true,
        },
      ],
      litellm: [],
      modelsDev: [],
    });
    expect(merged[0]).toMatchObject({
      id: "codex-auto-review",
      aliasTarget: "gpt-5-codex",
      isOverride: true,
    });
    expect(merged[0].rate).toBeUndefined();
  });
});
