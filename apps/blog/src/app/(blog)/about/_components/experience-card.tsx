"use client";

import { BriefcaseIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import companies from "@/data/companies";

export const ExperienceCard = () => {
  const recentCompanies = companies
    .toSorted(
      (a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
    )
    .slice(0, 3);

  return (
    <Card className="border border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-medium text-base">
          <BriefcaseIcon className="size-4" />
          <span>Experience</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          {recentCompanies.map((company) => (
            <div key={company.name}>
              <div className="flex items-center gap-2">
                <div className="flex size-16 items-center rounded-full bg-neutral-50 p-2">
                  <Image
                    src={company.logo}
                    width={72}
                    height={72}
                    alt={`${company.name} logo`}
                    sizes="100vw"
                    className="rounded-lg"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <div className="font-semibold">{company.name}</div>
                  <div className="text-neutral-400">{company.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
