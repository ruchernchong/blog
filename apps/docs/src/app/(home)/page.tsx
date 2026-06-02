import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 font-bold text-2xl">ruchern.dev Docs</h1>
      <p className="text-fd-muted-foreground">
        Open{" "}
        <Link href="/docs" className="font-medium underline">
          the documentation
        </Link>{" "}
        for implementation notes and operational runbooks.
      </p>
    </div>
  );
}
