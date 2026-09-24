import { vi } from "vitest";
import { render } from "vitest-browser-react";
import { StatCard } from "@/app/(main)/dashboard/components/stat-card";
import {
  StatsGrid,
  StatsGridFallback,
} from "@/app/(main)/dashboard/components/stats-grid";
import {
  getGitHubContributions,
  getGitHubFollowers,
  getGitHubStars,
} from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";

vi.mock("next/server", () => ({
  connection: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  getGitHubContributions: vi.fn(),
  getGitHubFollowers: vi.fn(),
  getGitHubStars: vi.fn(),
}));

vi.mock("@/lib/queries/posthog", () => ({
  getTotalVisits: vi.fn(),
}));

// StatsGrid wraps an async server component in Suspense; await it directly
const renderStatsGridContent = async () => {
  const StatsGridContent = StatsGrid().props.children.type;
  return render(await StatsGridContent());
};

describe("StatsGrid", () => {
  it("should render the fetched stats", async () => {
    vi.mocked(getTotalVisits).mockResolvedValue(48200);
    vi.mocked(getGitHubFollowers).mockResolvedValue(120);
    vi.mocked(getGitHubStars).mockResolvedValue(1842);
    vi.mocked(getGitHubContributions).mockResolvedValue({
      contributionsCollection: { totalCommitContributions: 512 },
    } as never);

    const screen = await renderStatsGridContent();

    await expect.element(screen.getByText("120")).toBeVisible();
    await expect.element(screen.getByText("1,842")).toBeVisible();
    await expect.element(screen.getByText("512")).toBeVisible();
  });

  it("should render zero when stats are unavailable", async () => {
    vi.mocked(getTotalVisits).mockResolvedValue(null as never);
    vi.mocked(getGitHubFollowers).mockResolvedValue(null as never);
    vi.mocked(getGitHubStars).mockResolvedValue(null as never);
    vi.mocked(getGitHubContributions).mockResolvedValue(null as never);

    const screen = await renderStatsGridContent();

    await expect.element(screen.getByText("0").first()).toBeVisible();
  });
});

describe("StatsGridFallback", () => {
  it("should render a loading status", async () => {
    const screen = await render(<StatsGridFallback />);

    await expect
      .element(screen.getByRole("status"))
      .toHaveAccessibleName("Loading dashboard statistics");
  });
});

describe("StatCard", () => {
  it("should render the label, value and note", async () => {
    const screen = await render(
      <StatCard label="GitHub Stars" value={1842} note="across repos" />,
    );

    await expect.element(screen.getByText("GitHub Stars")).toBeVisible();
    await expect.element(screen.getByText("1,842")).toBeVisible();
    await expect.element(screen.getByText("across repos")).toBeVisible();
  });

  it("should render a compact value", async () => {
    const screen = await render(
      <StatCard label="Total Visits" value={48200} compact />,
    );

    await expect.element(screen.getByText("48.2k")).toBeVisible();
  });

  it("should render an animated value", async () => {
    const screen = await render(
      <StatCard label="Total Visits" value={48200} animate compact />,
    );

    await expect
      .element(screen.getByText("48.2k"), { timeout: 3000 })
      .toBeVisible();
  });
});
