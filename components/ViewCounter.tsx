"use client";
import { useEffect } from "react";
import useSWR from "swr";
import type { Views } from "@prisma/client";

interface ViewCounterProps {
  slug: string;
}

const fetcher = (...args: [RequestInfo, RequestInit?]) =>
  fetch(...args).then((res) => res.json());

const ViewCounter = ({ slug }: ViewCounterProps) => {
  const { data, error } = useSWR<Views>(`/api/views/${slug}`, fetcher);

  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: "POST" });
  }, [slug]);

  const viewCount = data?.count || 0;

  return <div>{viewCount} views</div>;
};

export default ViewCounter;
