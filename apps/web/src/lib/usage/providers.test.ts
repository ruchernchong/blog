import {
  providerForAgent,
  providerLogoUrl,
  resolveProvider,
} from "./providers";

describe("providerForAgent", () => {
  it("should map known single-provider agents", () => {
    expect(providerForAgent("claude")).toBe("anthropic");
    expect(providerForAgent("codex")).toBe("openai");
    expect(providerForAgent("grok")).toBe("xai");
  });

  it("should fall back to the agent key for an unmapped agent", () => {
    expect(providerForAgent("opencode")).toBe("opencode");
  });
});

describe("providerLogoUrl", () => {
  it("should use the local Cursor brand mark instead of models.dev", () => {
    expect(providerLogoUrl("cursor")).toBe("/images/cursor-logo.svg");
  });

  it("should remap models.dev logo ids when needed", () => {
    expect(providerLogoUrl("ollama")).toBe(
      "https://models.dev/logos/ollama-cloud.svg",
    );
  });

  it("should default to the models.dev logo path", () => {
    expect(providerLogoUrl("anthropic")).toBe(
      "https://models.dev/logos/anthropic.svg",
    );
    expect(providerLogoUrl("xai")).toBe("https://models.dev/logos/xai.svg");
  });
});

describe("resolveProvider", () => {
  it("should derive the provider from the agent when none is carried", () => {
    expect(resolveProvider({ agent: "claude" })).toBe("anthropic");
  });

  it("should prefer a per-event provider for multi-provider agents", () => {
    expect(
      resolveProvider({ agent: "opencode", provider: "fireworks-ai" }),
    ).toBe("fireworks-ai");
  });

  it("should fall back to the agent key when the provider is empty", () => {
    expect(resolveProvider({ agent: "opencode", provider: "" })).toBe(
      "opencode",
    );
  });
});
