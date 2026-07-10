import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
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

  it("should render the server-parsed client and scopes", () => {
    render(
      <ConsentForm clientName="Codex" scopes={["openid", "profile", "mcp"]} />,
    );

    expect(
      screen.getByText("Codex wants to access your account"),
    ).toBeVisible();
    expect(screen.getByText("Verify your identity")).toBeVisible();
    expect(
      screen.getByText("Read your basic profile information"),
    ).toBeVisible();
    expect(screen.getByText("Manage your blog posts and media")).toBeVisible();
  });

  it("should let the OAuth provider client attach the signed query", async () => {
    const user = userEvent.setup();
    render(<ConsentForm clientName="Codex" scopes={["openid"]} />);

    await user.click(screen.getByRole("button", { name: "Allow" }));

    await waitFor(() => {
      expect(submitConsent).toHaveBeenCalledWith({ accept: true });
    });
  });
});
