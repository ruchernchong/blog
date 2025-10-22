"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { ExperienceCard } from "@/components/experience-card";
import { LocationCard } from "@/components/location-card";

export const AboutCard = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="font-semibold text-3xl">About Me</h2>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className="grid gap-4">
          <LocationCard />
        </div>
        <div className="grid gap-4">
          <ExperienceCard />
        </div>
      </div>
      <div className="flex items-center justify-center">
        <Button as={Link} href="/about" variant="ghost">
          More About Me
        </Button>
      </div>
    </div>
  );
};
