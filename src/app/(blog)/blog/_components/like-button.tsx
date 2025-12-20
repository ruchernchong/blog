import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useOptimistic } from "react";
import { incrementLikes } from "@/app/(blog)/_actions/stats";
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
        optimisticLikes.likesByUser > 0
          ? "text-primary"
          : "text-muted-foreground hover:text-primary/60"
      }`}
    >
      <HugeiconsIcon
        icon={FavouriteIcon}
        size={24}
        strokeWidth={2}
        className={optimisticLikes.likesByUser > 0 ? "fill-current" : ""}
      />
    </button>
  );
};

export default LikeButton;
