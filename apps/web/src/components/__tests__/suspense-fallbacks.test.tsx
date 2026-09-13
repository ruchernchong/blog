import { render } from "vitest-browser-react";
import { StatsGridFallback } from "@/app/(main)/dashboard/components/stats-grid";
import { UsageLastUpdatedFallback } from "@/app/(main)/usage/components/usage-last-updated";
import { AuthPanelFallback } from "@/components/auth/auth-panel-fallback";
import { StudioAccessFallback } from "@/components/studio/studio-access-fallback";
import { StudioFormFallback } from "@/components/studio/studio-form-fallback";

// stats-grid.tsx also exports server-only data loaders; keep them out of the browser bundle
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/github", () => ({
  getGitHubContributions: vi.fn(),
  getGitHubFollowers: vi.fn(),
  getGitHubStars: vi.fn(),
}));
vi.mock("@/lib/queries/posthog", () => ({ getTotalVisits: vi.fn() }));

describe("Suspense fallbacks", () => {
  it.each([
    {
      name: "auth panel",
      label: "Loading authentication",
      component: <AuthPanelFallback label="Loading authentication" />,
    },
    {
      name: "dashboard statistics",
      label: "Loading dashboard statistics",
      component: <StatsGridFallback />,
    },
    {
      name: "usage update time",
      label: "Loading usage update time",
      component: <UsageLastUpdatedFallback />,
    },
    {
      name: "Studio access",
      label: "Loading Content Studio",
      component: <StudioAccessFallback />,
    },
    {
      name: "Studio form",
      label: "Loading editor",
      component: <StudioFormFallback label="Loading editor" />,
    },
  ])("should expose an accessible status for the $name fallback", async ({
    component,
    label,
  }) => {
    const screen = await render(component);

    await expect
      .element(screen.getByRole("status", { name: label }))
      .toBeVisible();
  });
});
