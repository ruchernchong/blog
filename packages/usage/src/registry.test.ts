import {
  canonicalSlug,
  type ModelEntry,
  mergeRegistry,
  normaliseAIGateway,
  normaliseModelsDev,
  normaliseOpenRouter,
} from "./registry";

describe("normaliseModelsDev", () => {
  it("should keep cost as USD/1M and pull name/release/limit", () => {
    const [entry] = normaliseModelsDev({
      anthropic: {
        models: {
          "claude-sonnet-5": {
            name: "Claude Sonnet 5",
            release_date: "2026-06-30",
            open_weights: false,
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
      openWeights: false,
      rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
      source: "models.dev",
    });
  });
});

describe("canonicalSlug", () => {
  it("should collapse the punctuation differences between sources", () => {
    // AI Gateway documents dots for versions; the Anthropic API and our logs
    // use dashes, and logs additionally carry a dated variant.
    expect(canonicalSlug("claude-opus-4.8")).toBe(
      canonicalSlug("claude-opus-4-8"),
    );
    expect(canonicalSlug("claude-haiku-4-5-20251001")).toBe(
      canonicalSlug("claude-haiku-4.5"),
    );
  });

  it("should keep genuinely different models apart", () => {
    expect(canonicalSlug("gpt-5.6-sol")).not.toBe(
      canonicalSlug("gpt-5.6-sol-fast"),
    );
    expect(canonicalSlug("grok-4.6")).toBe(canonicalSlug("grok-4-6"));
    expect(canonicalSlug("grok-4.6")).not.toBe(canonicalSlug("grok-4.6-fast"));
    expect(canonicalSlug("claude-opus-4-8")).not.toBe(
      canonicalSlug("claude-opus-5"),
    );
  });
});

describe("normaliseAIGateway", () => {
  it("should split owner/model, convert per-token pricing, and derive the release date", () => {
    const [entry] = normaliseAIGateway({
      data: [
        {
          id: "anthropic/claude-opus-4.8",
          name: "Claude Opus 4.8",
          released: 1_764_547_200,
          context_window: 200_000,
          pricing: {
            input: "0.000005",
            output: "0.000025",
            input_cache_read: "0.0000005",
            input_cache_write: "0.00000625",
          },
        },
      ],
    });
    expect(entry).toMatchObject({
      provider: "anthropic",
      id: "claude-opus-4.8",
      displayName: "Claude Opus 4.8",
      contextLimit: 200_000,
      rate: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
      source: "gateway",
    });
    expect(entry.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should keep an unpriced model as a metadata-only entry", () => {
    const [entry] = normaliseAIGateway({
      data: [{ id: "openai/text-embedding-3", name: "Embedding" }],
    });
    expect(entry.displayName).toBe("Embedding");
    expect(entry.rate).toBeUndefined();
  });

  it("should skip entries with no owner prefix", () => {
    expect(normaliseAIGateway({ data: [{ id: "bare-model" }] })).toEqual([]);
  });

  it("should drop malformed prices rather than storing NaN", () => {
    // Postgres `numeric` accepts 'NaN', so an unguarded NaN would persist and
    // silently poison every cost computed from it.
    const [entry] = normaliseAIGateway({
      data: [
        {
          id: "openai/broken",
          pricing: { input: "n/a", output: "0.00001" },
        },
      ],
    });
    expect(entry.rate).toBeUndefined();
  });

  it("should treat an empty price string as unknown, not free", () => {
    const [entry] = normaliseAIGateway({
      data: [{ id: "openai/blank", pricing: { input: "", output: "" } }],
    });
    expect(entry.rate).toBeUndefined();
  });

  it("should keep a genuine zero price", () => {
    const [entry] = normaliseAIGateway({
      data: [{ id: "openai/free", pricing: { input: "0", output: "0" } }],
    });
    expect(entry.rate).toMatchObject({ input: 0, output: 0 });
  });

  it("should survive an out-of-range release timestamp", () => {
    // `toISOString()` throws a RangeError on an invalid date; letting it escape
    // would take the whole source down, not just this entry.
    const entries = normaliseAIGateway({
      data: [
        {
          id: "openai/bad-date",
          released: Number.MAX_SAFE_INTEGER,
          pricing: { input: "0.000001", output: "0.000002" },
        },
      ],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].releaseDate).toBeUndefined();
    expect(entries[0].rate).toMatchObject({ input: 1, output: 2 });
  });

  it("should accept a price encoded as a number rather than a string", () => {
    // These payloads are `as`-cast from response.json(), so nothing enforces
    // the string encoding at runtime, and number is the more natural JSON
    // encoding for a price — models.dev already sends its costs that way.
    const [entry] = normaliseAIGateway({
      data: [
        { id: "openai/numeric", pricing: { input: 0.000005, output: 0.00001 } },
      ],
    });
    expect(entry.rate).toMatchObject({ input: 5, output: 10 });
  });

  it("should confine a malformed entry to itself, not drop the source", () => {
    // A throw escaping the normaliser is caught by the caller's outer handler,
    // which discards every entry from that source. Losing AI Gateway costs
    // pricing on every Codex model, since it is their only source.
    const entries = normaliseAIGateway({
      data: [
        {
          id: "openai/good-1",
          pricing: { input: "0.000001", output: "0.000002" },
        },
        { id: "openai/hostile", pricing: { input: {}, output: [] } as never },
        {
          id: "openai/good-2",
          pricing: { input: "0.000003", output: "0.000004" },
        },
      ],
    });
    expect(entries).toHaveLength(3);
    expect(entries[0].rate).toMatchObject({ input: 1, output: 2 });
    expect(entries[1].rate).toBeUndefined();
    expect(entries[2].rate).toMatchObject({ input: 3, output: 4 });
  });
});

describe("normaliseOpenRouter", () => {
  it("should split the id and convert per-token pricing", () => {
    const [entry] = normaliseOpenRouter({
      data: [
        {
          id: "openai/gpt-5.6-terra-pro",
          name: "GPT-5.6 Terra Pro",
          created: 1_782_843_083,
          context_length: 400_000,
          pricing: {
            prompt: "0.0000025",
            completion: "0.000015",
            input_cache_read: "0.00000025",
          },
        },
      ],
    });
    expect(entry).toMatchObject({
      provider: "openai",
      id: "gpt-5.6-terra-pro",
      displayName: "GPT-5.6 Terra Pro",
      contextLimit: 400_000,
      rate: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 },
      source: "openrouter",
    });
  });
});

describe("mergeRegistry", () => {
  const gateway: ModelEntry[] = [
    {
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      rate: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
      source: "gateway",
    },
  ];
  const openrouter: ModelEntry[] = [
    {
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Anthropic: Claude Sonnet 5",
      rate: { input: 50, output: 50 },
      source: "openrouter",
    },
  ];
  const modelsDev: ModelEntry[] = [
    {
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Claude Sonnet 5 (models.dev)",
      releaseDate: "2026-06-30",
      rate: { input: 99, output: 99 },
      source: "models.dev",
    },
  ];

  it("should take the rate from Gateway ahead of OpenRouter and models.dev", () => {
    const [entry] = mergeRegistry({
      overrides: [],
      gateway,
      openrouter,
      modelsDev,
    });
    expect(entry).toMatchObject({
      provider: "anthropic",
      id: "claude-sonnet-5",
      displayName: "Claude Sonnet 5",
      releaseDate: "2026-06-30",
      rate: { input: 3, output: 15 },
      source: "gateway",
      isOverride: false,
    });
  });

  it("should fall back to OpenRouter when Gateway lacks the model", () => {
    const [entry] = mergeRegistry({
      overrides: [],
      gateway: [],
      openrouter,
      modelsDev,
    });
    expect(entry.rate).toMatchObject({ input: 50, output: 50 });
    expect(entry.source).toBe("openrouter");
  });

  it("should let a rate-only override win while keeping the Gateway name", () => {
    const overrides: ModelEntry[] = [
      {
        provider: "anthropic",
        id: "claude-sonnet-5",
        rate: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
        source: "override",
        isOverride: true,
      },
    ];
    const [entry] = mergeRegistry({
      overrides,
      gateway,
      openrouter,
      modelsDev,
    });
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

  it("should let a name-only override keep the Gateway rate", () => {
    const overrides: ModelEntry[] = [
      {
        provider: "anthropic",
        id: "claude-sonnet-5",
        displayName: "My Sonnet",
        source: "override",
        isOverride: true,
      },
    ];
    const [entry] = mergeRegistry({
      overrides,
      gateway,
      openrouter,
      modelsDev,
    });
    expect(entry.displayName).toBe("My Sonnet");
    expect(entry.rate).toEqual({
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75,
    });
  });

  it("should union models unique to any single source", () => {
    const merged = mergeRegistry({
      overrides: [],
      gateway: [
        {
          provider: "openai",
          id: "gpt-gw",
          rate: { input: 1, output: 2 },
          source: "gateway",
        },
      ],
      openrouter: [
        {
          provider: "openai",
          id: "gpt-or",
          rate: { input: 3, output: 4 },
          source: "openrouter",
        },
      ],
      modelsDev: [
        {
          provider: "opencode-go",
          id: "glm-5.2",
          displayName: "GLM-5.2",
          rate: { input: 1.4, output: 4.4 },
          source: "models.dev",
        },
      ],
    });
    expect(merged).toHaveLength(3);
    // models.dev is the only source carrying reseller-routed providers.
    expect(merged.find((e) => e.provider === "opencode-go")?.rate).toEqual({
      input: 1.4,
      output: 4.4,
    });
    expect(merged.find((e) => e.id === "gpt-or")?.rate).toEqual({
      input: 3,
      output: 4,
    });
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
      gateway: [],
      openrouter: [],
      modelsDev: [],
    });
    expect(merged[0]).toMatchObject({
      id: "codex-auto-review",
      aliasTarget: "gpt-5-codex",
      isOverride: true,
    });
    expect(merged[0].rate).toBeUndefined();
  });

  it("should take open weights from models.dev unless an override sets it", () => {
    const openModel: ModelEntry = {
      provider: "deepseek",
      id: "deepseek-v4",
      openWeights: true,
      source: "models.dev",
    };
    const fromModelsDev = mergeRegistry({
      overrides: [],
      gateway: [{ provider: "deepseek", id: "deepseek-v4", source: "gateway" }],
      openrouter: [],
      modelsDev: [openModel],
    });
    expect(fromModelsDev[0].openWeights).toBe(true);

    const overridden = mergeRegistry({
      overrides: [
        {
          provider: "deepseek",
          id: "deepseek-v4",
          openWeights: false,
          source: "override",
          isOverride: true,
        },
      ],
      gateway: [],
      openrouter: [],
      modelsDev: [openModel],
    });
    expect(overridden[0].openWeights).toBe(false);
  });
});
