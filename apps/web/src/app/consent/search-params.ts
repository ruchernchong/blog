import { createLoader, parseAsString } from "nuqs/server";

export const consentSearchParams = {
  client_id: parseAsString,
  scope: parseAsString,
};

export const loadSearchParams = createLoader(consentSearchParams);
