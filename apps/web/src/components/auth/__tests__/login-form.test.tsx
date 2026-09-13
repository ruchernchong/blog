import { vi } from "vitest";
import { render } from "vitest-browser-react";
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
    window.history.replaceState(
      {},
      "",
      "/login?client_id=client-123&scope=openid%20mcp&state=signed",
    );
    const screen = await render(<LoginForm isOAuthRequest />);

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await vi.waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL:
          "/api/auth/oauth2/authorize?client_id=client-123&scope=openid%20mcp&state=signed",
      });
    });
  });

  it("should open Studio after a regular sign-in", async () => {
    const screen = await render(<LoginForm isOAuthRequest={false} />);

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await vi.waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/studio/posts",
      });
    });
  });
});
