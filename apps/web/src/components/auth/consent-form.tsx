"use client";

import { Alert, Button, Card, Chip, Typography } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useState, useTransition } from "react";
import { submitConsent } from "@/app/consent/actions";
import { consentSearchParams } from "@/app/consent/search-params";
import { ERROR_IDS } from "@/constants/error-ids";
import { logError } from "@/lib/logger";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Verify your identity",
  profile: "Read your basic profile information",
  email: "Read your email address",
  offline_access: "Stay signed in when you are away",
};

export const ConsentForm = () => {
  const [{ client_id: clientId, scope }] = useQueryStates(consentSearchParams);
  const scopes = scope?.split(" ").filter(Boolean) ?? [];
  const oauthQuery = useSearchParams().toString();

  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"accept" | "deny" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const submit = (accept: boolean) => {
    setError(null);
    setPendingAction(accept ? "accept" : "deny");

    startTransition(async () => {
      try {
        await submitConsent(oauthQuery, accept);
      } catch (err) {
        logError(ERROR_IDS.OAUTH_CONSENT_FAILED, err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete authorisation",
        );
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header className="text-center">
          <Card.Title>Authorise access</Card.Title>
          <Card.Description>
            {clientId
              ? `${clientId} wants to access your account`
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
              className="w-full"
              onPress={() => submit(false)}
              isDisabled={isPending}
            >
              {pendingAction === "deny" ? "Denying..." : "Deny"}
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onPress={() => submit(true)}
              isDisabled={isPending}
            >
              {pendingAction === "accept" ? "Authorising..." : "Allow"}
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};
