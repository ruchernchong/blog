import type { WebSite, WithContext } from "schema-dts";
import { AboutSection } from "@/app/components/home/about-section";
import { HomeCard } from "@/app/components/home/home-card";
import { HomeHero } from "@/app/components/home/home-hero";
import { LatestWriting } from "@/app/components/home/latest-writing";
import { ProjectFan } from "@/app/components/home/project-fan";
import { WorkExperience } from "@/app/components/home/work-experience";
import { StructuredData } from "@/app/components/structured-data";
import { BASE_URL } from "@/config";

const structuredData: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ru Chern",
  url: BASE_URL,
  description:
    "Personal blog and portfolio of Ru Chern, featuring posts on software development, technology and personal projects.",
  image: [
    {
      "@type": "ImageObject",
      url: `${BASE_URL}/cover-image.png`,
      width: "1200",
      height: "630",
    },
  ],
  sameAs: [
    "https://github.com/ruchernchong",
    "https://www.linkedin.com/in/ruchernchong",
    "https://twitter.com/ruchernchong",
  ],
};

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
