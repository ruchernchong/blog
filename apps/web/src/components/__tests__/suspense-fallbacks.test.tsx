import { render, screen } from "@testing-library/react";
import { FeaturedPostFallback } from "@/app/(main)/blog/components/featured-post";
import { StatsGridFallback } from "@/app/(main)/dashboard/components/stats-grid";
import { UsageLastUpdatedFallback } from "@/app/(main)/usage/components/usage-last-updated";
import { AuthPanelFallback } from "@/components/auth/auth-panel-fallback";
import { StudioAccessFallback } from "@/components/studio/studio-access-fallback";
import { StudioFormFallback } from "@/components/studio/studio-form-fallback";

describe("Suspense fallbacks", () => {
  it.each([
    {
      name: "auth panel",
      label: "Loading authentication",
      component: <AuthPanelFallback label="Loading authentication" />,
    },
    {
      name: "featured post",
      label: "Loading featured post",
      component: <FeaturedPostFallback />,
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
  ])("should expose an accessible status for the $name fallback", ({
    component,
    label,
  }) => {
    render(component);

    expect(screen.getByRole("status", { name: label })).toBeVisible();
  });
});
