import { render } from "vitest-browser-react";
import { LinkWithIcon } from "@/components/link-with-icon";

describe("LinkWithIcon", () => {
  it("should render link with URL", async () => {
    const screen = await render(<LinkWithIcon url="https://example.com" />);
    await expect
      .element(screen.getByRole("link"))
      .toHaveAttribute("href", "https://example.com");
    await expect.element(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("should render link with custom title", async () => {
    const screen = await render(
      <LinkWithIcon url="https://example.com" title="Custom Title" />,
    );
    await expect.element(screen.getByText("Custom Title")).toBeInTheDocument();
    await expect
      .element(screen.getByText("example.com"))
      .not.toBeInTheDocument();
  });

  it("should open link in new tab", async () => {
    const screen = await render(<LinkWithIcon url="https://example.com" />);
    const link = screen.getByRole("link");
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noopener");
  });

  it("should strip protocol from displayed URL", async () => {
    const httpScreen = await render(<LinkWithIcon url="http://example.com" />);
    await expect
      .element(httpScreen.getByText("example.com"))
      .toBeInTheDocument();
    await httpScreen.unmount();

    const httpsScreen = await render(<LinkWithIcon url="https://github.com" />);
    await expect
      .element(httpsScreen.getByText("github.com"))
      .toBeInTheDocument();
  });

  it("should apply correct CSS classes", async () => {
    const screen = await render(<LinkWithIcon url="https://example.com" />);
    await expect
      .element(screen.getByRole("link"))
      .toHaveClass("z-20", "no-underline");
  });
});
