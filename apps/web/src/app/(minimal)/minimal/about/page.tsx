import Employment from "@/app/(main)/about/components/employment";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import companies from "@/data/companies";
import socials from "@/data/socials";

export default function MinimalAboutPage() {
  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );
  const currentCompany = sortedCompanies.find(({ dateEnd }) => !dateEnd);

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8 py-8">
        <h1 className="font-bold text-4xl text-foreground tracking-tight md:text-5xl">
          About.
        </h1>

        <p className="max-w-2xl text-lg text-muted leading-relaxed">
          Software engineer from Singapore. Building web applications and
          writing about the details that matter. Currently{" "}
          {currentCompany ? (
            <ExternalLink
              href={currentCompany.url}
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {currentCompany.title} @ {currentCompany.name}
            </ExternalLink>
          ) : (
            "looking for the next adventure"
          )}
          .
        </p>

        <div className="flex gap-2">
          {socials.map(({ name, link }) => (
            <ExternalLink
              key={name}
              href={link}
              aria-label={name}
              className="flex size-10 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-default hover:text-foreground"
            >
              <Icons.Social name={name} className="size-4" />
            </ExternalLink>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-2xl text-foreground">8</span>
            <span className="text-muted text-sm">years of experience</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-2xl text-foreground">
              {sortedCompanies.length}
            </span>
            <span className="text-muted text-sm">companies</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-2xl text-foreground">
              {currentCompany?.name ?? "—"}
            </span>
            <span className="text-muted text-sm">current employer</span>
          </div>
        </div>
      </section>

      <Employment companies={sortedCompanies} />
    </div>
  );
}
