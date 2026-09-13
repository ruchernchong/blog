import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/queries/series", () => ({
  getSeriesById: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

import { getSeriesById } from "@/lib/queries/series";
import type { SelectSeries } from "@/schema";
import { validateSeriesExists } from "../series";

describe("validateSeriesExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the series when the id is valid and it exists", async () => {
    const id = crypto.randomUUID();
    const series = { id, slug: "my-series" } as SelectSeries;
    vi.mocked(getSeriesById).mockResolvedValue(series);

    const result = await validateSeriesExists(Promise.resolve({ id }));

    expect(result).toEqual({ success: true, data: { seriesId: id, series } });
    expect(getSeriesById).toHaveBeenCalledWith(id);
  });

  it("should return a 400 without querying when the id is malformed", async () => {
    const result = await validateSeriesExists(
      Promise.resolve({ id: "not-a-uuid" }),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(400);
    expect(getSeriesById).not.toHaveBeenCalled();
  });

  it("should return a 404 when the series does not exist", async () => {
    vi.mocked(getSeriesById).mockResolvedValue(undefined);

    const result = await validateSeriesExists(
      Promise.resolve({ id: crypto.randomUUID() }),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(404);
  });
});
