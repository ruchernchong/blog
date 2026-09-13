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
});
