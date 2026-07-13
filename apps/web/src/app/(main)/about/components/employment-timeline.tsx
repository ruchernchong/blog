import { cn } from "@heroui/react";
import type { Company } from "@/types";

interface EmploymentTimelineProps {
  companies: Company[];
}

const formatPeriod = ({
  dateStart,
  dateEnd,
}: {
  dateStart: string;
  dateEnd?: string;
}) => `${dateStart} — ${dateEnd ?? "Present"}`;

export function EmploymentTimeline({ companies }: EmploymentTimelineProps) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-semibold text-xl tracking-tight">Employment</h2>
      <div className="flex flex-col">
        {companies.map((company, index) => {
          const isCurrent = !company.dateEnd;
          const isLast = index === companies.length - 1;

          return (
            <div key={company.name} className="flex gap-5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1.5 size-3 shrink-0 rounded-full",
                    isCurrent ? "bg-accent ring-2 ring-accent/30" : "bg-muted",
                  )}
                />
                {!isLast && <span className="w-0.5 grow bg-(--separator)" />}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1.5",
                  isLast ? "pb-0" : "pb-8",
                )}
              >
                <span className="font-mono text-muted text-sm">
                  {formatPeriod(company)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{company.title}</span>
                  <span className="rounded-full bg-default px-3 py-1 font-semibold text-xs">
                    {company.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
