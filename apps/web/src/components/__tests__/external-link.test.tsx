import { render } from "vitest-browser-react";
import ExternalLink from "@/components/external-link";

describe("ExternalLink", () => {
  it("should render link with href", async () => {
    const screen = await render(
      <ExternalLink href="https://example.com">Example Link</ExternalLink>,
    );
    await expect
      .element(screen.getByRole("link"))
      .toHaveAttribute("href", "https://example.com");
    await expect.element(screen.getByText("Example Link")).toBeInTheDocument();
  });

  it("should open link in new tab with security attributes", async () => {
    const screen = await render(
      <ExternalLink href="https://example.com">Example Link</ExternalLink>,
    );
    const link = screen.getByRole("link");
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noreferrer nofollow me");
  });

  it("should apply custom className", async () => {
    const screen = await render(
      <ExternalLink href="https://example.com" className="custom-class">
        Example Link
      </ExternalLink>,
    );
    await expect.element(screen.getByRole("link")).toHaveClass("custom-class");
  });

  it("should render children content", async () => {
    const screen = await render(
      <ExternalLink href="https://example.com">
        <span>Custom Content</span>
      </ExternalLink>,
    );
    await expect
      .element(screen.getByText("Custom Content"))
      .toBeInTheDocument();
  });

  it("should have an accessible aria-label", async () => {
    const screen = await render(
      <ExternalLink href="https://example.com">Example Link</ExternalLink>,
    );
    await expect
      .element(screen.getByRole("link"))
      .toHaveAttribute("aria-label", "Link to social media");
  });
});
