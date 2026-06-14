"use client";

import { Alert, Button, Card, Chip, Spinner, Typography } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { AUTH_ERROR } from "@/constants/auth-error-ids";
import { authClient } from "@/lib/auth-client";
import { logError } from "@/lib/logger";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Verify your identity",
  profile: "Read your basic profile information",
  email: "Read your email address",
  offline_access: "Stay signed in when you are away",
  mcp: "Manage your blog posts and media",
};

export function ConsentForm({ clientName }: { clientName?: string }) {
  const params = useSearchParams();
  const scopes = params.get("scope")?.split(" ").filter(Boolean) ?? [];
  const oauthQuery = params.toString();

  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"accept" | "deny" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const submit = (accept: boolean) => {
    setError(null);
    setPendingAction(accept ? "accept" : "deny");

    startTransition(async () => {
      const { data, error: consentError } = await authClient.oauth2.consent({
        accept,
        // Forward the signed query from the consent URL so the provider can
        // rebuild the pending authorization request. Calling the endpoint over
        // HTTP (rather than a server action) gives it the request context it
        // needs to issue the authorization code on the first attempt.
        oauth_query: oauthQuery,
      });

      if (consentError) {
        logError(AUTH_ERROR.OAUTH_CONSENT_FAILED, consentError);
        setError(
          consentError.message ??
            "This authorisation request has expired. Please start again.",
        );
        setPendingAction(null);
        return;
      }

      if (data?.redirect && data.url) {
        window.location.href = data.url;
        return;
      }

      setError("Unable to complete authorisation. Please try again.");
      setPendingAction(null);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header className="text-center">
          <Card.Title>Authorise access</Card.Title>
          <Card.Description>
            {clientName
              ? `${clientName} wants to access your account`
              : "An application wants to access your account"}
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-6">
          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Authorisation failed</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          {scopes.length > 0 && (
            <div className="flex flex-col gap-3">
              <Typography type="body-sm" color="muted">
                This will allow it to:
              </Typography>
              <div className="flex flex-col gap-3">
                {scopes.map((scopeName) => (
                  <div key={scopeName} className="flex items-center gap-3">
                    <Chip color="accent" variant="soft" size="sm">
                      <Chip.Label>{scopeName}</Chip.Label>
                    </Chip>
                    <Typography type="body-sm">
                      {SCOPE_DESCRIPTIONS[scopeName] ?? scopeName}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <Button
              variant="outline"
              fullWidth
              onPress={() => submit(false)}
              isPending={pendingAction === "deny"}
              isDisabled={isPending}
            >
              {({ isPending: isButtonPending }) => (
                <>
                  {isButtonPending && (
                    <Spinner color="current" size="sm" className="mr-2" />
                  )}
                  {isButtonPending ? "Denying..." : "Deny"}
                </>
              )}
            </Button>
            <Button
              variant="primary"
              fullWidth
              onPress={() => submit(true)}
              isPending={pendingAction === "accept"}
              isDisabled={isPending}
            >
              {({ isPending: isButtonPending }) => (
                <>
                  {isButtonPending && (
                    <Spinner color="current" size="sm" className="mr-2" />
                  )}
                  {isButtonPending ? "Authorising..." : "Allow"}
                </>
              )}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
