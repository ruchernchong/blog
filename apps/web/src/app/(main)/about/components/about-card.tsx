import { buttonVariants } from "@heroui/styles";
import Link from "next/link";
import { ExperienceCard } from "@/app/(main)/about/components/experience-card";
import { LocationCard } from "@/app/(main)/about/components/location-card";
import { Typography } from "@/components/typography";

export function AboutCard() {
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
        <Link className={buttonVariants({ variant: "ghost" })} href="/about">
          More About Me
        </Link>
      </div>
    </div>
  );
}
