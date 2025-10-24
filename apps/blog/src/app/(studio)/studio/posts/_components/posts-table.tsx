"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectPost } from "@/schema";

export const PostsTable = () => {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<SelectPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "deleted"
  >("all");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  const fetchPosts = useEffectEvent(async () => {
    try {
      const response = await fetch("/api/studio/posts");
      if (response.ok) {
        const posts = await response.json();
        setAllPosts(posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent should not be in deps
  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/studio/posts/${postId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchPosts();
          router.refresh();
        } else {
          const error = await response.json();
          console.error("Failed to delete post:", error);
          alert(`Failed to delete post: ${error.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Failed to delete post:", error);
        alert("Failed to delete post");
      }
    });
  };

  const handleRestore = async (postId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/studio/posts/${postId}/restore`, {
          method: "POST",
        });

        if (response.ok) {
          await fetchPosts();
          router.refresh();
        } else {
          const error = await response.json();
          console.error("Failed to restore post:", error);
          alert(`Failed to restore post: ${error.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Failed to restore post:", error);
        alert("Failed to restore post");
      }
    });
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map((post) => post.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectedPosts.size} post(s)?`)
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(selectedPosts).map((postId) =>
          fetch(`/api/studio/posts/${postId}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failedDeletes = results.filter((res) => !res.ok);

        if (failedDeletes.length > 0) {
          alert(
            `Failed to delete ${failedDeletes.length} post(s). Please try again.`,
          );
        }

        await fetchPosts();
        setSelectedPosts(new Set());
        router.refresh();
      } catch (error) {
        console.error("Failed to delete posts:", error);
        alert("Failed to delete posts");
      }
    });
  };

  const handleBulkPublish = async () => {
    if (selectedPosts.size === 0) return;

    startTransition(async () => {
      try {
        const updatePromises = Array.from(selectedPosts).map(async (postId) => {
          const post = allPosts.find((p) => p.id === postId);
          if (!post) return null;

          return fetch(`/api/studio/posts/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...post,
              status: "published",
              tags: post.tags || [],
            }),
          });
        });

        const results = await Promise.all(updatePromises);
        const failedUpdates = results.filter((res) => res && !res.ok);

        if (failedUpdates.length > 0) {
          alert(
            `Failed to publish ${failedUpdates.length} post(s). Please try again.`,
          );
        }

        await fetchPosts();
        setSelectedPosts(new Set());
        router.refresh();
      } catch (error) {
        console.error("Failed to publish posts:", error);
        alert("Failed to publish posts");
      }
    });
  };

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "deleted" && post.deletedAt) ||
      (statusFilter !== "deleted" &&
        !post.deletedAt &&
        post.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Content Studio</h1>
            <p className="mb-2 text-muted-foreground">Manage your blog posts</p>
          </div>
          <Button asChild>
            <Link href="/studio/posts/new">Create Post</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Loading posts...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Content Studio</h1>
          <p className="mb-2 text-muted-foreground">Manage your blog posts</p>
        </div>
        <Button asChild>
          <Link href="/studio/posts/new">Create Post</Link>
        </Button>
      </div>

      {allPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No posts yet</EmptyTitle>
                <EmptyDescription>
                  Get started by creating your first blog post
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/studio/posts/new">Create Post</Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search posts by title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(
                value: "all" | "draft" | "published" | "deleted",
              ) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPosts.size > 0 && (
            <div className="flex items-center gap-4 rounded-lg border bg-muted p-4">
              <span className="text-sm">
                {selectedPosts.size} post(s) selected
              </span>
              <div className="ml-auto flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkPublish}
                  disabled={isPending}
                >
                  {isPending ? "Publishing..." : "Publish Selected"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete Selected"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPosts(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No posts found</EmptyTitle>
                    <EmptyDescription>
                      Try adjusting your search or filter criteria
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  All Posts ({filteredPosts.length}
                  {filteredPosts.length !== allPosts.length &&
                    ` of ${allPosts.length}`}
                  )
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="w-12 px-6 py-3">
                          <Checkbox
                            checked={
                              filteredPosts.length > 0 &&
                              selectedPosts.size === filteredPosts.length
                            }
                            onCheckedChange={toggleAllPosts}
                            aria-label="Select all posts"
                          />
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-sm">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-sm">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-sm">
                          Tags
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-sm">
                          Updated
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPosts.map((post) => (
                        <tr
                          key={post.id}
                          className={`border-b last:border-0 hover:bg-muted/50 ${
                            post.deletedAt ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <Checkbox
                              checked={selectedPosts.has(post.id)}
                              onCheckedChange={() =>
                                togglePostSelection(post.id)
                              }
                              aria-label={`Select ${post.title}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{post.title}</span>
                              <span className="text-muted-foreground text-xs">
                                {post.slug}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {post.deletedAt ? (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800 text-xs">
                                  deleted
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                                    post.status === "published"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {post.status}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(post.tags) &&
                              post.tags.length > 0 ? (
                                post.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-muted-foreground text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  No tags
                                </span>
                              )}
                              {Array.isArray(post.tags) &&
                                post.tags.length > 3 && (
                                  <span className="text-muted-foreground text-xs">
                                    +{post.tags.length - 3}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-sm">
                            {new Date(post.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-4">
                              {post.deletedAt ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestore(post.id)}
                                  disabled={isPending}
                                >
                                  {isPending ? "Restoring..." : "Restore"}
                                </Button>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link
                                      href={`/studio/posts/${post.id}/edit`}
                                    >
                                      Edit
                                    </Link>
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isPending}
                                      >
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will delete the post &ldquo;
                                          {post.title}&rdquo;. You can restore
                                          it later from the Deleted filter.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(post.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
