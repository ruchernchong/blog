"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useOptimistic } from "react";
import { incrementLikes } from "@/app/(blog)/actions/stats";
import { MAX_LIKES_PER_USER } from "@/config";
import type { Likes } from "@/types";

interface Props extends Likes {
  slug: string;
  onLikeUpdateAction: (likes: Likes) => void;
}

const LikeButton = ({
  slug,
  totalLikes,
  likesByUser,
  onLikeUpdateAction,
}: Props) => {
  const initialState: Likes = { totalLikes, likesByUser };

  const updateLikesState = (state: Likes) => ({
    totalLikes: state.totalLikes + 1,
    likesByUser: state.likesByUser + 1,
  });

  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialState,
    updateLikesState,
  );

  const handleClick = async () => {
    if (optimisticLikes.likesByUser >= MAX_LIKES_PER_USER) {
      return;
    }

    addOptimisticLike(optimisticLikes);
    const stats = await incrementLikes(slug);
    onLikeUpdateAction(stats);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`transform transition-all duration-300 hover:scale-110 ${
        optimisticLikes.likesByUser > 0 ? "text-pink-500" : "text-zinc-400"
      }`}
    >
      {optimisticLikes.likesByUser > 0 ? (
        <HeartSolidIcon className="h-6 w-6" />
      ) : (
        <HeartIcon className="h-6 w-6" />
      )}
    </button>
  );
};

export default LikeButton;
