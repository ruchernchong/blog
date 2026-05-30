"use client";

import { Card } from "@heroui/react";
import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import companies from "@/data/companies";

export const ExperienceCard = () => {
  const recentCompanies = companies
    .toSorted(
      (a, b) =>
        new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
    )
    .slice(0, 3);

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2 font-medium text-base">
          <HugeiconsIcon icon={Briefcase01Icon} size={16} strokeWidth={2} />
          <span>Experience</span>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-8">
          {recentCompanies.map((company) => (
            <div key={company.name}>
              <div className="flex items-center gap-2">
                <div className="flex size-16 items-center rounded-full bg-muted p-2">
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
                  <div className="text-muted-foreground">{company.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
};
