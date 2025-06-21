import { render, screen } from "@testing-library/react";
import ExternalLink from "../external-link";

describe("ExternalLink", () => {
  it("renders link with href", () => {
    render(
      <ExternalLink href="https://example.com">Example Link</ExternalLink>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("Example Link")).toBeInTheDocument();
  });

  it("opens link in new tab with security attributes", () => {
    render(
      <ExternalLink href="https://example.com">Example Link</ExternalLink>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer nofollow me");
  });

  it("applies custom className", () => {
    render(
      <ExternalLink href="https://example.com" className="custom-class">
        Example Link
      </ExternalLink>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("custom-class");
  });

  it("renders children content", () => {
    render(
      <ExternalLink href="https://example.com">
        <span>Custom Content</span>
      </ExternalLink>,
    );
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });

  it("has accessible aria-label", () => {
    render(
      <ExternalLink href="https://example.com">Example Link</ExternalLink>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "Link to social media");
  });
});
