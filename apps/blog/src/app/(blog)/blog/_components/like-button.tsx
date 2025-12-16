"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { MAX_LIKES_PER_USER } from "@/config";

interface Props {
  slug: string;
  userHash: string;
}

const LikeButton = ({ slug, userHash }: Props) => {
  const likesByUser = useQuery(api.likes.getByUser, { slug, userHash });
  const increment = useMutation(api.likes.increment);

  const handleClick = () => {
    if (likesByUser !== undefined && likesByUser >= MAX_LIKES_PER_USER) {
      return;
    }
    increment({ slug, userHash });
  };

  const hasLiked = likesByUser !== undefined && likesByUser > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`transform transition-all duration-300 hover:scale-110 ${
        hasLiked ? "text-pink-500" : "text-zinc-400"
      }`}
    >
      {hasLiked ? (
        <HeartSolidIcon className="h-6 w-6" />
      ) : (
        <HeartIcon className="h-6 w-6" />
      )}
    </button>
  );
};

export default LikeButton;
