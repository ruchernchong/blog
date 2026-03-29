"use client";

import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Reorder, useDragControls } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CardHeader>
          <CardTitle>Posts in Series</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading posts...</p>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posts in Series</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No posts in this series yet. Assign posts to this series from the
            post editor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Posts in Series ({posts.length})</CardTitle>
        {hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Order"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
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
      </CardContent>
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
      className="flex items-center gap-4 rounded-lg border bg-card p-4"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={20} />
      </button>

      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{post.title}</span>
          <span className="text-muted-foreground text-xs">{post.slug}</span>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              post.status === "published"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {post.status}
          </span>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/studio/posts/${post.id}/edit` as Route} />}
          >
            Edit
          </Button>
        </div>
      </div>
    </Reorder.Item>
  );
}
