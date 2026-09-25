import type { UsageBreakdownRow } from "@workspace/usage/types";
import {
  type OnUrlUpdateFunction,
  withNuqsTestingAdapter,
} from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { UsageModelDrawer } from "./usage-model-drawer";

const row: UsageBreakdownRow = {
  key: "claude-opus",
  provider: "anthropic",
  providers: ["anthropic"],
  tokens: 540,
  cost: 2,
  costPerMillionTokens: 3703.7,
  messages: 4,
  sparkline: [0, 3, 1, 5],
  firstUsed: "2026-01-05",
  lastUsed: "2026-02-10",
  activeDays: 12,
  agents: ["claude", "opencode"],
  tokenBreakdown: {
    input: 100,
    output: 30,
    cacheRead: 300,
    cacheWrite: 100,
    reasoning: 10,
  },
};

const props = {
  byModel: [row],
  modelDisplayNames: { "claude-opus": "Claude Opus" },
  providerDisplayNames: { anthropic: "Anthropic" },
};

describe("UsageModelDrawer", () => {
  it("should open the profile for the model in the URL", async () => {
    await render(<UsageModelDrawer {...props} />, {
      wrapper: withNuqsTestingAdapter({ searchParams: "?model=claude-opus" }),
    });

    const dialog = page.getByRole("dialog");
    await expect
      .element(dialog.getByRole("heading", { name: "Claude Opus" }))
      .toBeInTheDocument();
    await expect
      .element(
        dialog.getByText(
          "Used 5 Jan 2026 – 10 Feb 2026 via Claude Code, OpenCode on Anthropic.",
        ),
      )
      .toBeInTheDocument();
    await expect.element(dialog.getByText("12")).toBeInTheDocument();
    await expect.element(dialog.getByText("60%")).toBeInTheDocument();
    await expect.element(dialog.getByText("Last 90 days")).toBeInTheDocument();
  });

  it("should clear the URL when dismissed", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    await render(<UsageModelDrawer {...props} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?model=claude-opus",
        onUrlUpdate,
      }),
    });

    await expect.element(page.getByRole("dialog")).toBeInTheDocument();
    await userEventEscape();

    await expect.poll(() => onUrlUpdate.mock.calls.length).toBeGreaterThan(0);
    expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.has("model")).toBe(
      false,
    );
  });

  it("should stay closed for an unknown model", async () => {
    await render(<UsageModelDrawer {...props} />, {
      wrapper: withNuqsTestingAdapter({ searchParams: "?model=nope" }),
    });

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });
});

async function userEventEscape() {
  const { userEvent } = await import("vitest/browser");
  await userEvent.keyboard("{Escape}");
}
