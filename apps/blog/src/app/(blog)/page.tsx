import type { WebSite, WithContext } from "schema-dts";
import { StructuredData } from "@/app/(blog)/_components/structured-data";
import { AboutCard } from "@/app/(blog)/about/_components/about-card";
import { PopularPosts } from "@/app/(blog)/blog/_components/popular-posts";
import Author from "@/components/shared/author";
import { BASE_URL } from "@/config";

const HomePage = async () => {
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

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col justify-center gap-8">
        <Author title="Chong Ru Chern" />
        <AboutCard />
        <PopularPosts />
      </div>
    </>
  );
};

export default HomePage;
