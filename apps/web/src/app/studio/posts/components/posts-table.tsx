"use client";

import type { Selection } from "@heroui/react";
import {
  AlertDialog,
  Button,
  Card,
  Checkbox,
  Chip,
  cn,
  Input,
  ListBox,
  Select,
  Table,
  TextField,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { EmptyState } from "@heroui-pro/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import type { SelectPost } from "@/schema";

type PostWithAuthor = SelectPost & {
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

export const PostsTable = () => {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([]);
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
      } else if (response.status === 401) {
        console.error("Unauthorized: Please sign in");
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  });

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

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      setSelectedPosts(new Set(filteredPosts.map((post) => post.id)));
    } else {
      setSelectedPosts(new Set(Array.from(keys, (key) => String(key))));
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Content Studio</h1>
            <p className="mb-2 text-muted">Manage your blog posts</p>
          </div>
          <Link className={buttonVariants()} href="/studio/posts/new">
            Create Post
          </Link>
        </div>
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted">Loading posts...</p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Content Studio</h1>
          <p className="mb-2 text-muted">Manage your blog posts</p>
        </div>
        <Link className={buttonVariants()} href="/studio/posts/new">
          Create Post
        </Link>
      </div>

      {allPosts.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>No posts yet</EmptyState.Title>
                <EmptyState.Description>
                  Get started by creating your first blog post
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Link className={buttonVariants()} href="/studio/posts/new">
                  Create Post
                </Link>
              </EmptyState.Content>
            </EmptyState>
          </Card.Content>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <TextField
                aria-label="Search posts"
                type="search"
                value={searchQuery}
                onChange={setSearchQuery}
              >
                <Input
                  className="max-w-md"
                  placeholder="Search posts by title or slug..."
                />
              </TextField>
            </div>
            <Select
              aria-label="Filter by status"
              className="w-[180px]"
              value={statusFilter}
              onChange={(value) => {
                if (value)
                  setStatusFilter(
                    value as "all" | "draft" | "published" | "deleted",
                  );
              }}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="All Posts">
                    All Posts
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="draft" textValue="Draft">
                    Draft
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="published" textValue="Published">
                    Published
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="deleted" textValue="Deleted">
                    Deleted
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {selectedPosts.size > 0 && (
            <div className="flex items-center gap-4 rounded-lg border bg-default p-4">
              <span className="text-sm">
                {selectedPosts.size} post(s) selected
              </span>
              <div className="ml-auto flex gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleBulkPublish}
                  isDisabled={isPending}
                >
                  {isPending ? "Publishing..." : "Publish Selected"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={handleBulkDelete}
                  isDisabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete Selected"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setSelectedPosts(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <Card>
              <Card.Content className="py-12">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Title>No posts found</EmptyState.Title>
                    <EmptyState.Description>
                      Try adjusting your search or filter criteria
                    </EmptyState.Description>
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <Button
                      variant="outline"
                      onPress={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </EmptyState.Content>
                </EmptyState>
              </Card.Content>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <Card.Title>
                  All Posts ({filteredPosts.length}
                  {filteredPosts.length !== allPosts.length &&
                    ` of ${allPosts.length}`}
                  )
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-0">
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content
                      aria-label="All posts"
                      className="w-full min-w-[720px]"
                      selectionMode="multiple"
                      selectedKeys={selectedPosts}
                      onSelectionChange={handleSelectionChange}
                    >
                      <Table.Header>
                        <Table.Column className="w-12 pr-0">
                          <Checkbox
                            aria-label="Select all posts"
                            slot="selection"
                          >
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Column>
                        <Table.Column
                          isRowHeader
                          className="font-medium text-sm"
                        >
                          Title
                        </Table.Column>
                        <Table.Column className="font-medium text-sm">
                          Author
                        </Table.Column>
                        <Table.Column className="font-medium text-sm">
                          Status
                        </Table.Column>
                        <Table.Column className="font-medium text-sm">
                          Tags
                        </Table.Column>
                        <Table.Column className="font-medium text-sm">
                          Updated
                        </Table.Column>
                        <Table.Column className="text-right font-medium text-sm">
                          Actions
                        </Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {filteredPosts.map((post) => (
                          <Table.Row
                            key={post.id}
                            id={post.id}
                            className={cn(post.deletedAt && "opacity-60")}
                          >
                            <Table.Cell className="pr-0">
                              <Checkbox
                                aria-label={`Select ${post.title}`}
                                slot="selection"
                              >
                                <Checkbox.Content>
                                  <Checkbox.Control>
                                    <Checkbox.Indicator />
                                  </Checkbox.Control>
                                </Checkbox.Content>
                              </Checkbox>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {post.title}
                                </span>
                                <span className="text-muted text-xs">
                                  {post.slug}
                                </span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-sm">
                                {post.author?.name ?? "Unknown"}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-wrap gap-2">
                                {post.deletedAt ? (
                                  <Chip size="sm" variant="soft" color="danger">
                                    deleted
                                  </Chip>
                                ) : (
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    color={
                                      post.status === "published"
                                        ? "success"
                                        : "warning"
                                    }
                                  >
                                    {post.status}
                                  </Chip>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(post.tags) &&
                                post.tags.length > 0 ? (
                                  post.tags.slice(0, 3).map((tag) => (
                                    <Chip
                                      key={tag}
                                      size="sm"
                                      variant="secondary"
                                    >
                                      {tag}
                                    </Chip>
                                  ))
                                ) : (
                                  <span className="text-muted text-xs">
                                    No tags
                                  </span>
                                )}
                                {Array.isArray(post.tags) &&
                                  post.tags.length > 3 && (
                                    <span className="text-muted text-xs">
                                      +{post.tags.length - 3}
                                    </span>
                                  )}
                              </div>
                            </Table.Cell>
                            <Table.Cell className="text-muted text-sm">
                              {new Date(post.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </Table.Cell>
                            <Table.Cell className="text-right">
                              <div className="flex items-center justify-end gap-4">
                                {post.deletedAt ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => handleRestore(post.id)}
                                    isDisabled={isPending}
                                  >
                                    {isPending ? "Restoring..." : "Restore"}
                                  </Button>
                                ) : (
                                  <>
                                    <Link
                                      className={buttonVariants({
                                        variant: "ghost",
                                        size: "sm",
                                      })}
                                      href={`/studio/posts/${post.id}/edit`}
                                    >
                                      Edit
                                    </Link>
                                    <AlertDialog>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        isDisabled={isPending}
                                      >
                                        Delete
                                      </Button>
                                      <AlertDialog.Backdrop>
                                        <AlertDialog.Container>
                                          <AlertDialog.Dialog>
                                            <AlertDialog.Header>
                                              <AlertDialog.Icon status="danger" />
                                              <AlertDialog.Heading>
                                                Are you sure?
                                              </AlertDialog.Heading>
                                            </AlertDialog.Header>
                                            <AlertDialog.Body>
                                              <p>
                                                This will delete the post
                                                &ldquo;
                                                {post.title}&rdquo;. You can
                                                restore it later from the
                                                Deleted filter.
                                              </p>
                                            </AlertDialog.Body>
                                            <AlertDialog.Footer>
                                              <Button
                                                slot="close"
                                                variant="tertiary"
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                slot="close"
                                                variant="danger"
                                                onPress={() =>
                                                  handleDelete(post.id)
                                                }
                                              >
                                                Delete
                                              </Button>
                                            </AlertDialog.Footer>
                                          </AlertDialog.Dialog>
                                        </AlertDialog.Container>
                                      </AlertDialog.Backdrop>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
