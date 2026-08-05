import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

/**
 * Regression guard for the Phase 2 Instant Navigations shell on
 * `/blog` → `/blog/[slug]`: layout chrome stays mounted and the
 * content-shaped `PostArticleFallback` paints before the article streams in.
 */
const POST_SLUG = "testing-strategies-react";
const POST_HREF = `/blog/${POST_SLUG}`;

test.describe("Blog post Instant Navigations", () => {
  test("shows layout chrome and post shell on client navigation", async ({
    page,
  }) => {
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { name: "All Posts" }),
    ).toBeVisible();

    const postLink = page.locator(`a[href="${POST_HREF}"]`).first();
    await expect(postLink).toBeVisible();
    // Warm Partial Prefetching's App Shell for the destination.
    await postLink.hover();
    await page.waitForLoadState("networkidle");

    await instant(page, async () => {
      await postLink.click();
      await page.waitForURL((url) => url.pathname === POST_HREF);

      await expect(page.getByRole("banner").getByLabel("Home")).toBeVisible();
      await expect(
        page.getByRole("banner").getByRole("link", { name: "Blog" }),
      ).toBeVisible();
      await expect(
        page.getByRole("status", { name: "Loading post" }),
      ).toBeVisible();
    });

    await expect(
      page.getByRole("status", { name: "Loading post" }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("heading", {
          name: "Testing Strategies for React Applications",
          level: 1,
        })
        .first(),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${POST_HREF}$`));
  });
});
