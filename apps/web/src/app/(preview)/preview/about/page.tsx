import { buttonVariants } from "@heroui/styles";
import Employment from "@/app/(main)/about/components/employment";
import ExternalLink from "@/components/external-link";
import * as Icons from "@/components/icons";
import companies from "@/data/companies";
import socials from "@/data/socials";
import { AppleStat } from "../../components/apple-stat";

export default async function PreviewAboutPage() {
  const sortedCompanies = companies.toSorted(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-border/50 border-b py-16 md:py-24">
        <h1 className="font-semibold text-[clamp(3rem,8vw,6rem)] leading-none tracking-tighter">
          About.
        </h1>
        <p className="mt-6 max-w-xl text-muted text-xl leading-relaxed">
          Software engineer from Singapore. Building web applications and
          writing about the details that matter.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {socials.map(({ name, link }) => (
            <ExternalLink
              aria-label={name}
              className={`${buttonVariants({ variant: "outline" })} size-10 p-0`}
              href={link}
              key={name}
            >
              <Icons.Social name={name} className="size-5" />
            </ExternalLink>
          ))}
        </div>

        {/* Inline stats */}
        <div className="mt-12 flex flex-wrap items-end gap-8 md:gap-12">
          <AppleStat value="8+" label="Years Experience" />
          <span className="select-none pb-5 text-2xl text-border" aria-hidden>
            ·
          </span>
          <AppleStat value={sortedCompanies.length} label="Companies" />
          <span className="select-none pb-5 text-2xl text-border" aria-hidden>
            ·
          </span>
          <AppleStat value="DBS" label="Current Role" large={false} />
        </div>
      </div>

      {/* Employment timeline */}
      <div className="py-12">
        <Employment companies={sortedCompanies} />
      </div>
    </div>
  );
}
