import { providerForAgent, resolveProvider } from "../providers";

describe("providerForAgent", () => {
  it("should map known single-provider agents", () => {
    expect(providerForAgent("claude")).toBe("anthropic");
    expect(providerForAgent("codex")).toBe("openai");
  });

  it("should fall back to the agent key for an unmapped agent", () => {
    expect(providerForAgent("opencode")).toBe("opencode");
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
