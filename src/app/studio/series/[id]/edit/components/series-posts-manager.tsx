"use client";

import { Button, Card, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Reorder, useDragControls } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface SeriesPost {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  seriesOrder: number | null;
}

interface SeriesPostsManagerProps {
  seriesId: string;
}

export function SeriesPostsManager({ seriesId }: SeriesPostsManagerProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<SeriesPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`/api/studio/series/${seriesId}/posts`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [seriesId]);

  const handleReorder = (newOrder: SeriesPost[]) => {
    setPosts(newOrder);
    setHasChanges(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const reorderData = posts.map((post, index) => ({
          id: post.id,
          order: index,
        }));

        const response = await fetch(`/api/studio/series/${seriesId}/posts`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ posts: reorderData }),
        });

        if (response.ok) {
          setHasChanges(false);
          router.refresh();
        } else {
          console.error("Failed to save order");
        }
      } catch (error) {
        console.error("Failed to save order:", error);
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Posts in Series</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-muted">Loading posts...</p>
        </Card.Content>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Posts in Series</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-muted">
            No posts in this series yet. Assign posts to this series from the
            post editor.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between">
        <Card.Title>Posts in Series ({posts.length})</Card.Title>
        {hasChanges && (
          <Button size="sm" onPress={handleSave} isDisabled={isPending}>
            {isPending ? "Saving..." : "Save Order"}
          </Button>
        )}
      </Card.Header>
      <Card.Content>
        <Reorder.Group
          axis="y"
          values={posts}
          onReorder={handleReorder}
          className="flex flex-col gap-2"
        >
          {posts.map((post) => (
            <ReorderItem key={post.id} post={post} />
          ))}
        </Reorder.Group>
      </Card.Content>
    </Card>
  );
}

function ReorderItem({ post }: { post: SeriesPost }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={post}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-4 rounded-lg border bg-surface p-4"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none text-muted hover:text-foreground"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={20} />
      </button>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{post.title}</span>
          <span className="text-muted text-xs">{post.slug}</span>
        </div>

        <div className="flex items-center gap-4">
          <Chip
            size="sm"
            variant="soft"
            color={post.status === "published" ? "success" : "warning"}
          >
            {post.status}
          </Chip>
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href={`/studio/posts/${post.id}/edit` as Route}
          >
            Edit
          </Link>
        </div>
      </div>
    </Reorder.Item>
  );
}
