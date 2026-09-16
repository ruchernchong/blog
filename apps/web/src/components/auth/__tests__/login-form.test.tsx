import type { ComponentProps } from "react";
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

type LoginFormProps = ComponentProps<typeof LoginForm>;

const INVALID_CLIENT = {
  oauthError: "invalid_client",
  oauthErrorDescription: "client_id is required",
} as const;

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialSignIn.mockResolvedValue({} as never);
    window.history.replaceState({}, "", "/login");
  });

  it.each([
    {
      name: "should resume the OAuth authorisation request after sign-in",
      href: "/login?client_id=client-123&scope=openid%20mcp&state=signed",
      props: { isOAuthRequest: true } satisfies LoginFormProps,
      callbackURL:
        "/api/auth/oauth2/authorize?client_id=client-123&scope=openid+mcp&state=signed",
    },
    {
      name: "should open Studio after a regular sign-in",
      href: "/login",
      props: { isOAuthRequest: false } satisfies LoginFormProps,
      callbackURL: "/studio/posts",
    },
    {
      name: "should not resume OAuth when only error query params are present",
      href: "/login?error=invalid_client&error_description=client_id+is+required",
      props: {
        isOAuthRequest: false,
        ...INVALID_CLIENT,
      } satisfies LoginFormProps,
      callbackURL: "/studio/posts",
    },
    {
      name: "should resume authorise without a query when only error params remain",
      href: "/login?error=invalid_client&error_description=client_id+is+required",
      props: {
        isOAuthRequest: true,
        ...INVALID_CLIENT,
      } satisfies LoginFormProps,
      callbackURL: "/api/auth/oauth2/authorize",
    },
    {
      name: "should omit error query params from the Google authorisation resume",
      href: "/login?client_id=client-123&scope=openid%20mcp&error=invalid_client&error_description=client_id+is+required",
      props: {
        isOAuthRequest: true,
        ...INVALID_CLIENT,
      } satisfies LoginFormProps,
      callbackURL:
        "/api/auth/oauth2/authorize?client_id=client-123&scope=openid+mcp",
    },
  ])("$name", async ({ href, props, callbackURL }) => {
    window.history.replaceState({}, "", href);
    const screen = await render(<LoginForm {...props} />);

    await screen.getByRole("button", { name: /Login with Google/ }).click();

    await vi.waitFor(() => {
      expect(socialSignIn).toHaveBeenCalledWith({
        provider: "google",
        callbackURL,
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

  it.each([
    {
      name: "should show the OAuth authorisation error from the query",
      props: {
        isOAuthRequest: false,
        ...INVALID_CLIENT,
      } satisfies LoginFormProps,
      description: "client_id is required",
    },
    {
      name: "should fall back to the error code when no description is provided",
      props: {
        isOAuthRequest: false,
        oauthError: "invalid_client",
      } satisfies LoginFormProps,
      description: "invalid_client",
    },
  ])("$name", async ({ props, description }) => {
    const screen = await render(<LoginForm {...props} />);

    await expect
      .element(screen.getByText("Authorisation failed"))
      .toBeVisible();
    await expect.element(screen.getByText(description)).toBeVisible();
  });
});
