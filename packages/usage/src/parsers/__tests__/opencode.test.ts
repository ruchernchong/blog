import { mapMessage } from "../opencode";

describe("opencode mapMessage", () => {
  // Real-shaped assistant blob (cf. the live opencode.db `message.data`).
  const assistant = {
    role: "assistant",
    time: { created: 1771952413521 },
    modelID: "gpt-5.3-codex",
    providerID: "openai",
    tokens: {
      total: 25534,
      input: 25316,
      output: 218,
      reasoning: 107,
      cache: { read: 0, write: 0 },
    },
  };

  it("should map an assistant message to a usage event", () => {
    const event = mapMessage(assistant);
    expect(event).not.toBeNull();
    expect(event?.agent).toBe("opencode");
    expect(event?.provider).toBe("openai");
    expect(event?.model).toBe("gpt-5.3-codex");
    expect(event?.ts).toBe(new Date(1771952413521).toISOString());
  });

  it("should split buckets so they sum to the true total", () => {
    const { tokens } = mapMessage(assistant) ?? { tokens: null };
    expect(tokens).not.toBeNull();
    if (!tokens) return;
    // output excludes reasoning; the five buckets sum to tokens.total.
    expect(tokens.output).toBe(218 - 107);
    expect(tokens.reasoning).toBe(107);
    const sum =
      tokens.input +
      tokens.output +
      tokens.cacheRead +
      tokens.cacheWrite +
      tokens.reasoning;
    expect(sum).toBe(assistant.tokens.total);
  });

  it("should fall back to 'unknown' for a missing model/provider", () => {
    const event = mapMessage({
      role: "assistant",
      time: { created: 1 },
      tokens: { input: 1, output: 1 },
    });
    expect(event?.model).toBe("unknown");
    expect(event?.provider).toBe("unknown");
  });

  it("should skip non-assistant, token-less, or timeless messages", () => {
    expect(mapMessage({ role: "user", tokens: { input: 1 } })).toBeNull();
    expect(mapMessage({ role: "assistant", time: { created: 1 } })).toBeNull();
    expect(mapMessage({ role: "assistant", tokens: { input: 1 } })).toBeNull();
  });
});
