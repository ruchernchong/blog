import { render, screen } from "@testing-library/react";
import { LinkWithIcon } from "../link-with-icon";

describe("LinkWithIcon", () => {
  it("renders link with URL", () => {
    render(<LinkWithIcon url="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("renders link with custom title", () => {
    render(<LinkWithIcon url="https://example.com" title="Custom Title" />);
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.queryByText("example.com")).not.toBeInTheDocument();
  });

  it("opens link in new tab", () => {
    render(<LinkWithIcon url="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("strips protocol from displayed URL", () => {
    render(<LinkWithIcon url="http://example.com" />);
    expect(screen.getByText("example.com")).toBeInTheDocument();

    render(<LinkWithIcon url="https://github.com" />);
    expect(screen.getByText("github.com")).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    render(<LinkWithIcon url="https://example.com" />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("z-20", "no-underline");
  });
});
