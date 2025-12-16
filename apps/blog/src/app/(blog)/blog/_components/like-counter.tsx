"use client";

import { useQuery } from "convex/react";
import LikeButton from "@/app/(blog)/blog/_components/like-button";
import { api } from "../../../../../convex/_generated/api";

interface Props {
  slug: string;
  userHash: string;
}

export const LikeCounter = ({ slug, userHash }: Props) => {
  const totalLikes = useQuery(api.likes.get, { slug });

  return (
    <div className="flex items-center gap-2 md:flex-col">
      <LikeButton slug={slug} userHash={userHash} />
      <div className="text-neutral-400 text-sm">
        {totalLikes?.toLocaleString() ?? "–"}
      </div>
    </div>
  );
};
