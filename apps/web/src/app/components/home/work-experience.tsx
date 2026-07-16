import Link from "next/link";
import companies from "@/data/companies";

const yearOf = (date?: string) => date?.split(" ").at(-1);

const formatYears = ({
  dateStart,
  dateEnd,
}: {
  dateStart: string;
  dateEnd?: string;
}) => `${yearOf(dateStart)} – ${yearOf(dateEnd) ?? "Present"}`;

export function WorkExperience() {
  return (
    <section className="flex flex-col gap-2">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-semibold text-xl tracking-tight">
          Work Experience
        </h2>
        <Link
          href="/about"
          className="font-medium text-muted text-sm transition-colors hover:text-foreground"
        >
          More →
        </Link>
      </div>
      {companies.slice(0, 3).map((company) => (
        <div
          key={company.name}
          className="grid grid-cols-1 items-center gap-2 py-2 sm:grid-cols-[150px_1fr] sm:gap-4"
        >
          <span className="font-mono text-muted text-sm">
            {formatYears(company)}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-sm">
            {company.title} at{" "}
            <span className="inline-flex items-center rounded-full bg-default px-3 py-1 font-semibold text-xs">
              {company.name}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
