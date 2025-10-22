import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { WebPage, WithContext } from "schema-dts";
import { StructuredData } from "@/app/(blog)/_components/structured-data";
import globalMetadata from "@/app/(blog)/metadata";
import { ProjectDetail } from "@/app/(blog)/projects/_components/project-detail";
import { openGraphImage, twitterImage } from "@/app/(blog)/shared-metadata";
import { PageTitle } from "@/components/shared/page-title";
import { BASE_URL } from "@/config";
import { getProjectBySlug } from "@/utils/get-project-by-slug";

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
      <section className="flex flex-col gap-8">
        <PageTitle title={project.name} />
        <ProjectDetail project={project} />
      </section>
    </>
  );
};

export default ProjectPage;
