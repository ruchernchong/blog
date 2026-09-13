import { vi } from "vitest";
import { render } from "vitest-browser-react";
import { ConsentForm } from "@/components/auth/consent-form";
import { authClient } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    oauth2: {
      consent: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

const submitConsent = vi.mocked(authClient.oauth2.consent);

describe("ConsentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitConsent.mockResolvedValue({
      data: null,
      error: { message: "Expected test response" },
    } as never);
  });

  it("should render the server-parsed client and scopes", async () => {
    const screen = await render(
      <ConsentForm clientName="Codex" scopes={["openid", "profile", "mcp"]} />,
    );

    await expect
      .element(screen.getByText("Codex wants to access your account"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Verify your identity"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Read your basic profile information"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Manage your blog posts and media"))
      .toBeVisible();
  });

  it("should let the OAuth provider client attach the signed query", async () => {
    const screen = await render(
      <ConsentForm clientName="Codex" scopes={["openid"]} />,
    );

    await screen.getByRole("button", { name: "Allow" }).click();

    await vi.waitFor(() => {
      expect(submitConsent).toHaveBeenCalledWith({ accept: true });
    });
  });

  it("should fall back to a generic client name", async () => {
    const screen = await render(<ConsentForm scopes={[]} />);

    await expect
      .element(screen.getByText("An application wants to access your account"))
      .toBeVisible();
  });

  it("should send a denial", async () => {
    const screen = await render(<ConsentForm scopes={["openid"]} />);

    await screen.getByRole("button", { name: "Deny" }).click();

    await vi.waitFor(() => {
      expect(submitConsent).toHaveBeenCalledWith({ accept: false });
    });
  });

  it("should show the consent error message", async () => {
    const screen = await render(<ConsentForm scopes={["openid"]} />);

    await screen.getByRole("button", { name: "Allow" }).click();

    await expect
      .element(screen.getByText("Expected test response"))
      .toBeVisible();
  });

  it("should show a default message when the error has none", async () => {
    submitConsent.mockResolvedValue({ data: null, error: {} } as never);
    const screen = await render(<ConsentForm scopes={["openid"]} />);

    await screen.getByRole("button", { name: "Allow" }).click();

    await expect
      .element(
        screen.getByText(
          "This authorisation request has expired. Please start again.",
        ),
      )
      .toBeVisible();
  });

  it("should redirect when consent succeeds", async () => {
    submitConsent.mockResolvedValue({
      data: { redirect: true, url: "#consented" },
      error: null,
    } as never);
    const screen = await render(<ConsentForm scopes={["openid"]} />);

    await screen.getByRole("button", { name: "Allow" }).click();

    await vi.waitFor(() => {
      expect(window.location.hash).toBe("#consented");
    });
  });

  it("should show an error when there is no redirect", async () => {
    submitConsent.mockResolvedValue({ data: {}, error: null } as never);
    const screen = await render(<ConsentForm scopes={["custom"]} />);

    await screen.getByRole("button", { name: "Allow" }).click();

    await expect
      .element(
        screen.getByText("Unable to complete authorisation. Please try again."),
      )
      .toBeVisible();
  });
});
