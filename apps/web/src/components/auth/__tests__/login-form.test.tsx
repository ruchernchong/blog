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
          "/api/auth/oauth2/authorize?client_id=client-123&scope=openid+mcp&state=signed",
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

  it("should show the sign-in error message", async () => {
    socialSignIn.mockRejectedValue(new Error("Popup closed"));
    const screen = await render(<LoginForm isOAuthRequest={false} />);

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await expect.element(screen.getByText("Popup closed")).toBeVisible();
  });

  it("should show a default message for unknown errors", async () => {
    socialSignIn.mockRejectedValue("nope");
    const screen = await render(<LoginForm isOAuthRequest={false} />);

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await expect
      .element(screen.getByText("Failed to sign in with Google"))
      .toBeVisible();
  });

  it("should show the OAuth authorisation error from the query", async () => {
    const screen = await render(
      <LoginForm
        isOAuthRequest={false}
        oauthError="invalid_client"
        oauthErrorDescription="client_id is required"
      />,
    );

    await expect
      .element(screen.getByText("Authorisation failed"))
      .toBeVisible();
    await expect
      .element(screen.getByText("client_id is required"))
      .toBeVisible();
  });

  it("should fall back to the error code when no description is provided", async () => {
    const screen = await render(
      <LoginForm isOAuthRequest={false} oauthError="invalid_client" />,
    );

    await expect
      .element(screen.getByText("Authorisation failed"))
      .toBeVisible();
    await expect.element(screen.getByText("invalid_client")).toBeVisible();
  });

  it("should not resume OAuth when only error query params are present", async () => {
    window.history.replaceState(
      {},
      "",
      "/login?error=invalid_client&error_description=client_id+is+required",
    );
    const screen = await render(
      <LoginForm
        isOAuthRequest={false}
        oauthError="invalid_client"
        oauthErrorDescription="client_id is required"
      />,
    );

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await vi.waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/studio/posts",
      });
    });
  });

  it("should resume authorise without a query when only error params remain", async () => {
    window.history.replaceState(
      {},
      "",
      "/login?error=invalid_client&error_description=client_id+is+required",
    );
    const screen = await render(
      <LoginForm
        isOAuthRequest
        oauthError="invalid_client"
        oauthErrorDescription="client_id is required"
      />,
    );

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await vi.waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/api/auth/oauth2/authorize",
      });
    });
  });

  it("should omit error query params from the Google authorisation resume", async () => {
    window.history.replaceState(
      {},
      "",
      "/login?client_id=client-123&scope=openid%20mcp&error=invalid_client&error_description=client_id+is+required",
    );
    const screen = await render(
      <LoginForm
        isOAuthRequest
        oauthError="invalid_client"
        oauthErrorDescription="client_id is required"
      />,
    );

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await vi.waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL:
          "/api/auth/oauth2/authorize?client_id=client-123&scope=openid+mcp",
      });
    });
  });
});
