"use client";

import Link from "next/link";
import { ExperienceCard } from "@/app/(main)/about/_components/experience-card";
import { LocationCard } from "@/app/(main)/about/_components/location-card";
import { Typography } from "@/components/typography";
import { Button } from "@/components/ui/button";

export const AboutCard = () => {
  return (
    <div className="flex flex-col items-center gap-6">
      <Typography variant="h2">About Me</Typography>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className="grid gap-4">
          <LocationCard />
        </div>
        <div className="grid gap-4">
          <ExperienceCard />
        </div>
      </div>
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/about" />}
        >
          More About Me
        </Button>
      </div>
    </div>
  );
};
