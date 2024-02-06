"use client";
import { Suspense, useEffect } from "react";
import useSWR from "swr";
import type { ViewCount } from "@/types";

interface ViewCounterProps {
  slug: string;
}

const ViewCounter = ({ slug }: ViewCounterProps) => {
  const fetcher = (...args: [RequestInfo, RequestInit?]) =>
    fetch(...args).then((res) => res.json());

  const { data } = useSWR<ViewCount[]>("/api/views", fetcher);
  const viewCountFromSlug = data?.find((view) => view.slug === slug);
  const viewCount = viewCountFromSlug?.count || 0;

  useEffect(() => {
    fetch(`/api/views/${slug}`, {
      method: "POST",
    });
  }, [slug]);

  return <Suspense fallback={null}>{viewCount} views</Suspense>;
};

export default ViewCounter;
