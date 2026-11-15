import { BASE_URL } from "@/config";

/**
 * Any `/api/*` path no other route handles. Without it Next.js answers with the
 * HTML 404 page, which an API client cannot parse.
 */
function notFound(request: Request): Response {
  return Response.json(
    {
      error: "not_found",
      message: `No API route matches ${request.method} ${new URL(request.url).pathname}`,
      hint: `The available endpoints are listed in the OpenAPI specification at ${BASE_URL}/openapi.json`,
    },
    { status: 404 },
  );
}

export {
  notFound as DELETE,
  notFound as GET,
  notFound as HEAD,
  notFound as OPTIONS,
  notFound as PATCH,
  notFound as POST,
  notFound as PUT,
};
