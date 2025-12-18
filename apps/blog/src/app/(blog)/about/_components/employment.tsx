import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import ExternalLink from "@/components/shared/external-link";
import { ItemOverlay } from "@/components/shared/item-overlay";
import { cn } from "@/lib/utils";
import type { Company } from "@/types";

interface EmploymentProps {
  companies: Company[];
}

const Employment = ({ companies }: EmploymentProps) => {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Briefcase01Icon} size={32} strokeWidth={2} className="fill-foreground" />
          <h2 className="font-bold text-4xl">Work</h2>
        </div>
        <p>
          Some cool companies I have worked with. Feel free to connect with me
          on&nbsp;
          <ExternalLink
            href="https://linkedin.com/in/ruchernchong"
            className="text-foreground underline hover:text-muted-foreground"
          >
            LinkedIn
          </ExternalLink>
          .
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {companies.map(
          ({ name, title, logo, dateStart, dateEnd, location, url }) => {
            return (
              <div key={name} className="relative flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-12 items-center rounded-2xl p-2 md:h-18 md:w-18",
                    logo ? "bg-zinc-50" : "bg-transparent",
                  )}
                >
                  {logo && (
                    <Image
                      src={logo}
                      width={72}
                      height={72}
                      sizes="100vw"
                      alt={`${name} logo`}
                      priority
                    />
                  )}
                  {!logo && (
                    <HugeiconsIcon
                      icon={Briefcase01Icon}
                      size={48}
                      strokeWidth={2}
                      className="fill-foreground"
                    />
                  )}
                </div>
                <div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="z-20 no-underline"
                  >
                    <ItemOverlay />
                    <div className="font-bold text-xl">{name}</div>
                  </a>
                  <div>{title}</div>
                  <div className="text-muted-foreground text-sm italic">
                    <div>
                      {dateStart} - {dateEnd ?? "Present"}
                    </div>
                    <div>{location}</div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
};

export default Employment;
