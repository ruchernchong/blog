"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useOptimistic } from "react";
import { addLike } from "@/app/actions/stats";
import { MAX_LIKES_PER_USER } from "@/config";
import type { Likes } from "@/types";

interface Props extends Likes {
  slug: string;
  onLikeUpdateAction: (likes: Likes) => void;
}

export const LikeButton = ({
  slug,
  totalLikes,
  totalLikesByUser,
  onLikeUpdateAction,
}: Props) => {
  const initialState: Likes = { totalLikes, totalLikesByUser };

  console.log("Props received:", { totalLikes, totalLikesByUser });

  const updateLikesState = (state: Likes) => {
    const newState = {
      totalLikes: state.totalLikes + 1,
      totalLikesByUser: state.totalLikesByUser + 1,
    };

    console.log("Optimistic update:", newState);

    return newState;
  };

  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialState,
    updateLikesState,
  );

  const handleClick = async () => {
    if (optimisticLikes.totalLikesByUser >= MAX_LIKES_PER_USER) {
      return;
    }

    addOptimisticLike(optimisticLikes); // Pass the current state
    const response = await addLike(slug);
    console.log("Server response:", response);
    onLikeUpdateAction(response);
  };

  return (
    <button
      onClick={handleClick}
      className={`transform transition-all duration-300 hover:scale-110 ${
        optimisticLikes.totalLikesByUser > 0 ? "text-pink-500" : "text-gray-400"
      }`}
      data-umami-event="like-button-click"
      data-umami-event-slug={slug}
      data-umami-event-action="like"
    >
      {optimisticLikes.totalLikesByUser > 0 ? (
        <HeartSolidIcon className="h-8 w-8" />
      ) : (
        <HeartIcon className="h-8 w-8" />
      )}
    </button>
  );
};
