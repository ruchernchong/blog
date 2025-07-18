"use client";

import companies from "@/data/companies";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader } from "@heroui/react";
import Image from "next/image";

export const ExperienceCard = () => {
  const recentCompanies = companies
    .toSorted(
      (a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
    )
    .slice(0, 3);

  return (
    <Card className="border border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm">
      <CardHeader className="flex gap-2">
        <BriefcaseIcon className="size-4" />
        <span>Experience</span>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-8 p-4">
          {recentCompanies.map((company) => (
            <div key={company.name}>
              <div className="flex items-center gap-2">
                <div className="flex size-16 items-center rounded-full bg-neutral-50 p-2 ring-4 ring-neutral-600">
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
      </CardBody>
    </Card>
  );
};
