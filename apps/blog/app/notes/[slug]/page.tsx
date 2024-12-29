import { Mdx } from "@/components/Mdx";
import { StructuredData } from "@/components/StructuredData";
import { Typography } from "@/components/Typography";
import { BASE_URL } from "@/config";
import { allNotes } from "contentlayer/generated";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Params = Promise<{ slug: string }>;

export const generateMetadata = async (props: {
  params: Params;
}): Promise<Metadata> => {
  const params = await props.params;
  const note = allNotes.find((note) => note.slug === params.slug);

  if (!note) {
    return notFound();
  }

  const { canonical } = note;
  const title = note.title;
  const description = `Notes on ${note.title}`;
  const publishedTime = note.publishedAt;
  const images = `${BASE_URL}/og?title=${title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    alternates: {
      canonical,
    },
  };
};

export const generateStaticParams = () =>
  allNotes.map(({ slug }) => ({ slug }));

const NotePage = async (props: { params: Params }) => {
  const params = await props.params;
  const note = allNotes.find((note) => note.slug === params.slug);

  if (!note) {
    return notFound();
  }

  return (
    <>
      <StructuredData data={note.structuredData} />
      <article
        className="prose prose-invert mx-auto mb-16 max-w-4xl prose-a:text-pink-500 prose-img:rounded-2xl"
        data-umami-event="note-view"
        data-umami-event-title={note.title}
        data-umami-event-slug={note.slug}
        data-umami-event-url={note.canonical}
      >
        <Typography
          variant="h1"
          className="text-center"
          data-umami-event="note-title-view"
          data-umami-event-title={note.title}
        >
          {note.title}
        </Typography>
        <div
          data-umami-event="note-content-view"
          data-umami-event-title={note.title}
        >
          <Mdx code={note.body.code} />
        </div>
      </article>
    </>
  );
};

export default NotePage;
