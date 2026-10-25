import { beforeEach, describe, expect, it, vi } from "vitest";

const { select } = vi.hoisted(() => ({ select: vi.fn() }));

vi.mock("@/schema", () => ({
  db: { select },
  model: { table: "model" },
  tokenUsage: { costUsd: "cost_usd" },
}));

import { repriceUsage } from "./usage-reprice";

describe("repriceUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should revalidate the usage tags after repricing", async () => {
    // Empty registry, then no unpriced token_usage rows.
    select.mockReturnValue({
      from: (table: { table?: string }) =>
        table.table === "model"
          ? Promise.resolve([])
          : { where: async () => [] },
    });
    const revalidateTags = vi.fn();

    await repriceUsage(revalidateTags);

    expect(revalidateTags).toHaveBeenCalledExactlyOnceWith([
      "usage",
      "models:providers",
    ]);
  });

  it("should swallow a repricing failure without revalidating", async () => {
    select.mockImplementation(() => {
      throw new Error("db down");
    });
    const revalidateTags = vi.fn();

    await expect(repriceUsage(revalidateTags)).resolves.toBeUndefined();
    expect(revalidateTags).not.toHaveBeenCalled();
  });
});
