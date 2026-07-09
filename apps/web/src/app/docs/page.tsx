import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-bold text-4xl">Documentation</h1>
      <p className="text-lg text-muted-foreground">
        Technical documentation for the ruchern.dev workspace.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/docs/oauth-provider"
          className="block rounded-lg border p-6 transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 font-semibold text-2xl">
            OAuth Provider Integration
          </h2>
          <p className="text-muted-foreground">
            How a client application authenticates users and calls protected
            ruchern.dev routes using the OAuth 2.1 / OIDC provider.
          </p>
        </Link>

        <Link
          href="/docs/usage-ingestion"
          className="block rounded-lg border p-6 transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 font-semibold text-2xl">Token Usage Ingestion</h2>
          <p className="text-muted-foreground">
            Endpoint contract and operator workflow for importing local agent
            token usage into ruchern.dev.
          </p>
        </Link>
      </div>
    </div>
  );
}
