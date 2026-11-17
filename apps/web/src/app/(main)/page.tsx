import type { Person, WithContext } from "schema-dts";
import { AboutSection } from "@/app/components/home/about-section";
import { HomeCard } from "@/app/components/home/home-card";
import { HomeHero } from "@/app/components/home/home-hero";
import { LatestWriting } from "@/app/components/home/latest-writing";
import { ProjectFan } from "@/app/components/home/project-fan";
import { WorkExperience } from "@/app/components/home/work-experience";
import { StructuredData } from "@/app/components/structured-data";
import { BASE_URL, SITE_DESCRIPTION } from "@/config";

const structuredData: WithContext<Person> = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ru Chern",
  alternateName: "Ru Chern Chong",
  url: BASE_URL,
  description: SITE_DESCRIPTION,
  jobTitle: "Software Engineer",
  // Terms the homepage itself uses, so crawlers can match them to the page.
  knowsAbout: ["React", "Node", "TypeScript"],
  sameAs: [
    "https://github.com/ruchernchong",
    "https://www.linkedin.com/in/ruchernchong",
    "https://twitter.com/ruchernchong",
  ],
};

export const ensureStatic = "navigation";

export default function HomePage() {
  return (
    <>
      <StructuredData data={structuredData} />
      <HomeCard>
        <HomeHero />
        <ProjectFan />
        <AboutSection />
        <WorkExperience />
        <LatestWriting />
      </HomeCard>
    </>
  );
}
