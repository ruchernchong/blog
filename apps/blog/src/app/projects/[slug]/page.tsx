import { notFound } from "next/navigation";
import type { Metadata } from "next";
import globalMetadata from "@/app/metadata";
import { openGraphImage, twitterImage } from "@/app/shared-metadata";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { BASE_URL } from "@/config";
import { ProjectDetail } from "@/components/project-detail";
import type { WebPage, WithContext } from "schema-dts";
import { getProjectBySlug } from "@/utils/getProjectBySlug";

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return notFound();
  }

  const title = project.name;
  const description = project.description ?? `Details about ${project.name}`;
  const canonical = `/projects/${slug}`;

  return {
    title,
    description,
    openGraph: {
      ...globalMetadata.openGraph,
      title,
      description,
      url: canonical,
      ...openGraphImage,
    },
    twitter: {
      ...globalMetadata.twitter,
      title,
      description,
      ...twitterImage,
    },
    alternates: {
      canonical,
    },
  };
};

const ProjectPage = async ({ params }: Props) => {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const structuredData: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: project.name,
    description: project.description ?? `Details about ${project.name}`,
    url: `${BASE_URL}/projects/${slug}`,
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <section className="space-y-8">
        <Typography variant="h1">{project.name}</Typography>
        <ProjectDetail project={project} />
      </section>
    </>
  );
};

export default ProjectPage;
