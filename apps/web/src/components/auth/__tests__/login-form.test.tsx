import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { authClient } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

const socialSignIn = vi.mocked(authClient.signIn.social);

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialSignIn.mockResolvedValue({} as never);
    window.history.replaceState({}, "", "/login");
  });

  it("should resume the OAuth authorisation request after sign-in", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      "/login?client_id=client-123&scope=openid%20mcp&state=signed",
    );
    render(<LoginForm isOAuthRequest />);

    await user.click(screen.getByRole("button", { name: /Login with Google/ }));

    await waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL:
          "/api/auth/oauth2/authorize?client_id=client-123&scope=openid%20mcp&state=signed",
      });
    });
  });

  it("should open Studio after a regular sign-in", async () => {
    const user = userEvent.setup();
    render(<LoginForm isOAuthRequest={false} />);

    await user.click(screen.getByRole("button", { name: /Login with Google/ }));

    await waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/studio/posts",
      });
    });
  });
});
