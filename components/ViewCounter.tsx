"use client";

import useSWR from "swr";
import { useEffect } from "react";

type ViewCounterProps = {
  slug: string;
};

const ViewCounter = ({ slug }: ViewCounterProps) => {
  // @ts-ignore
  const fetcher = (...args) => fetch(...args).then((res) => res.json());

  const { data } = useSWR("/api/views", fetcher);
  const viewCountFromSlug = data?.find((view) => view.slug === slug);
  const viewCount = Number(viewCountFromSlug?.count || 0);

  useEffect(() => {
    fetch(`/api/views/${slug}`, {
      method: "POST",
    });
  }, [slug]);

  return <div className="">{viewCount} views</div>;
};

export default ViewCounter;
