import { routeNotFoundResponse } from "@/lib/api";

/**
 * Any `/api/*` path no other route handles. Without it Next.js answers with the
 * HTML 404 page, which an API client cannot parse.
 */
export {
  routeNotFoundResponse as DELETE,
  routeNotFoundResponse as GET,
  routeNotFoundResponse as HEAD,
  routeNotFoundResponse as OPTIONS,
  routeNotFoundResponse as PATCH,
  routeNotFoundResponse as POST,
  routeNotFoundResponse as PUT,
};
