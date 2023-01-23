import Head from "next/head";

type StructuredData = {
  headline: string;
  description: string;
  author: { "@type": string; name: string }[];
  image: string;
  date: Date;
};

interface Props {
  data: Partial<StructuredData>;
}
const StructuredData = ({ data }: Props) => {
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Head>
  );
};

export default StructuredData;
