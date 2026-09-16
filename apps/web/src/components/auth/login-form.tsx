"use client";

import { Alert, Button, Card, cn, Spinner } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { authClient } from "@/lib/auth-client";
import { logError } from "@/lib/logger";

interface LoginFormProps extends ComponentPropsWithoutRef<"div"> {
  isOAuthRequest: boolean;
  oauthError?: string | null;
  oauthErrorDescription?: string | null;
}

const OAUTH_ERROR_QUERY_KEYS = ["error", "error_description"] as const;

function getOAuthAuthorizeCallbackURL() {
  const params = new URLSearchParams(window.location.search);

  for (const key of OAUTH_ERROR_QUERY_KEYS) {
    params.delete(key);
  }

  const search = params.toString();
  return search
    ? `/api/auth/oauth2/authorize?${search}`
    : "/api/auth/oauth2/authorize";
}

export const LoginForm = ({
  className,
  isOAuthRequest,
  oauthError,
  oauthErrorDescription,
  ...props
}: LoginFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const oauthErrorMessage = oauthErrorDescription ?? oauthError;

  // When the OAuth provider redirects an unauthenticated user here, it appends
  // the signed authorization query. Resume that flow after sign-in instead of
  // dropping the user into Studio. Error query params are display-only and must
  // not be forwarded back into authorize.
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading("google");

    try {
      const callbackURL = isOAuthRequest
        ? getOAuthAuthorizeCallbackURL()
        : "/studio/posts";

      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      logError(AUTH_ERROR.OAUTH_GOOGLE_FAILED, err);
      setError(errorMessage);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <Card.Header className="text-center">
          <Card.Title className="text-xl">Welcome back</Card.Title>
          <Card.Description>Login with your Google account</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {oauthErrorMessage && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Authorisation failed</Alert.Title>
                <Alert.Description>{oauthErrorMessage}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          {error && (
            <div className="rounded-lg border border-danger bg-danger/10 p-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onPress={handleGoogleSignIn}
            isPending={isLoading === "google"}
            isDisabled={isLoading !== null}
          >
            {({ isPending }) => (
              <>
                {isPending && (
                  <Spinner color="current" size="sm" className="mr-2" />
                )}
                {!isPending && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 size-4"
                    role="img"
                    aria-labelledby="google-icon-title"
                  >
                    <title id="google-icon-title">Google</title>
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                )}
                {isPending ? "Signing in..." : "Login with Google"}
              </>
            )}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
};
