"use client";

import type { Selection } from "@heroui/react";
import {
  AlertDialog,
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Select,
  Separator,
  TextField,
  Tooltip,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
  ActionBar,
  DataGrid,
  type DataGridColumn,
  EmptyState,
} from "@heroui-pro/react";
import {
  Cancel01Icon,
  Delete02Icon,
  TickDouble02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { SelectPost } from "@/schema";

type PostWithAuthor = SelectPost & {
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-SG", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const statusLabel = (post: PostWithAuthor) =>
  post.deletedAt ? "deleted" : post.status;

export const PostsTable = () => {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "deleted"
  >("all");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

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

  // Bulk actions must only touch rows the current filter still shows. Resolve
  // the selection against the visible rows (and the "all" sentinel) so ids that
  // were selected before a filter narrowed the list can never be acted on.
  const visibleSelectedIds = useMemo(() => {
    const visible = new Set(filteredPosts.map((post) => post.id));
    if (selectedKeys === "all") return visible;
    return new Set(
      Array.from(selectedKeys, (key) => String(key)).filter((id) =>
        visible.has(id),
      ),
    );
  }, [selectedKeys, filteredPosts]);

  const selectionCount = visibleSelectedIds.size;

  const clearSelection = () => setSelectedKeys(new Set());

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearSelection();
  };

  const handleStatusChange = (value: string | number | null) => {
    if (!value) return;
    setStatusFilter(String(value) as "all" | "draft" | "published" | "deleted");
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectionCount === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectionCount} post(s)?`)
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(visibleSelectedIds).map((postId) =>
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
        clearSelection();
        router.refresh();
      } catch (error) {
        console.error("Failed to delete posts:", error);
        alert("Failed to delete posts");
      }
    });
  };

  const handleBulkPublish = async () => {
    if (selectionCount === 0) return;

    startTransition(async () => {
      try {
        const updatePromises = Array.from(visibleSelectedIds).map(
          async (postId) => {
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
          },
        );

        const results = await Promise.all(updatePromises);
        const failedUpdates = results.filter((res) => res && !res.ok);

        if (failedUpdates.length > 0) {
          alert(
            `Failed to publish ${failedUpdates.length} post(s). Please try again.`,
          );
        }

        await fetchPosts();
        clearSelection();
        router.refresh();
      } catch (error) {
        console.error("Failed to publish posts:", error);
        alert("Failed to publish posts");
      }
    });
  };

  const columns: DataGridColumn<PostWithAuthor>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      isRowHeader: true,
      allowsSorting: true,
      minWidth: 240,
      cell: (post) => (
        <div className="flex flex-col">
          <span className="font-medium">{post.title}</span>
          <span className="text-muted text-xs">{post.slug}</span>
        </div>
      ),
    },
    {
      id: "author",
      header: "Author",
      allowsSorting: true,
      sortFn: (a, b) =>
        (a.author?.name ?? "").localeCompare(b.author?.name ?? ""),
      cell: (post) => (
        <span className="text-sm">{post.author?.name ?? "Unknown"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      allowsSorting: true,
      sortFn: (a, b) => statusLabel(a).localeCompare(statusLabel(b)),
      cell: (post) =>
        post.deletedAt ? (
          <Chip size="sm" variant="soft" color="danger">
            deleted
          </Chip>
        ) : (
          <Chip
            size="sm"
            variant="soft"
            color={post.status === "published" ? "success" : "warning"}
          >
            {post.status}
          </Chip>
        ),
    },
    {
      id: "tags",
      header: "Tags",
      cell: (post) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(post.tags) && post.tags.length > 0 ? (
            post.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} size="sm" variant="secondary">
                {tag}
              </Chip>
            ))
          ) : (
            <span className="text-muted text-xs">No tags</span>
          )}
          {Array.isArray(post.tags) && post.tags.length > 3 && (
            <span className="text-muted text-xs">+{post.tags.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      accessorKey: "updatedAt",
      allowsSorting: true,
      sortFn: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      cell: (post) => (
        <span className="text-muted text-sm tabular-nums">
          {dateFormatter.format(new Date(post.updatedAt))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      cell: (post) => (
        <div className="flex items-center gap-4">
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
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                href={`/studio/posts/${post.id}/edit`}
              >
                Edit
              </Link>
              <AlertDialog>
                <Button variant="ghost" size="sm" isDisabled={isPending}>
                  Delete
                </Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog>
                      <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>Are you sure?</AlertDialog.Heading>
                      </AlertDialog.Header>
                      <AlertDialog.Body>
                        <p>
                          This will delete the post &ldquo;{post.title}&rdquo;.
                          You can restore it later from the Deleted filter.
                        </p>
                      </AlertDialog.Body>
                      <AlertDialog.Footer>
                        <Button slot="close" variant="tertiary">
                          Cancel
                        </Button>
                        <Button
                          slot="close"
                          variant="danger"
                          onPress={() => handleDelete(post.id)}
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
      ),
    },
  ];

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
          <Card.Content>
            <div className="py-12">
              <p className="text-center text-muted">Loading posts...</p>
            </div>
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
          <Card.Content>
            <div className="py-12">
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
            </div>
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
                onChange={handleSearchChange}
              >
                <div className="max-w-md">
                  <Input placeholder="Search posts by title or slug..." />
                </div>
              </TextField>
            </div>
            <div className="w-45">
              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={handleStatusChange}
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
          </div>

          <Card>
            <Card.Header>
              <Card.Title>
                All Posts ({filteredPosts.length}
                {filteredPosts.length !== allPosts.length &&
                  ` of ${allPosts.length}`}
                )
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <DataGrid
                aria-label="All posts"
                columns={columns}
                contentClassName="min-w-[720px]"
                data={filteredPosts}
                defaultSortDescriptor={{
                  column: "updatedAt",
                  direction: "descending",
                }}
                getRowId={(post) => post.id}
                onSelectionChange={setSelectedKeys}
                renderEmptyState={() => (
                  <div className="py-6">
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
                            clearSelection();
                          }}
                        >
                          Clear Filters
                        </Button>
                      </EmptyState.Content>
                    </EmptyState>
                  </div>
                )}
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                showSelectionCheckboxes
              />
            </Card.Content>
          </Card>

          <ActionBar aria-label="Bulk post actions" isOpen={selectionCount > 0}>
            <ActionBar.Prefix>
              <Chip size="sm" variant="soft">
                {selectionCount}
              </Chip>
            </ActionBar.Prefix>
            <Separator />
            <ActionBar.Content>
              <Button
                size="sm"
                variant="ghost"
                onPress={handleBulkPublish}
                isDisabled={isPending}
              >
                <HugeiconsIcon icon={TickDouble02Icon} />
                <span className="action-bar__label">
                  {isPending ? "Publishing..." : "Publish"}
                </span>
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={handleBulkDelete}
                isDisabled={isPending}
              >
                <HugeiconsIcon icon={Delete02Icon} />
                <span className="action-bar__label">
                  {isPending ? "Deleting..." : "Delete"}
                </span>
              </Button>
            </ActionBar.Content>
            <Separator />
            <ActionBar.Suffix>
              <Tooltip>
                <Button
                  isIconOnly
                  aria-label="Clear selection"
                  size="sm"
                  variant="ghost"
                  onPress={clearSelection}
                >
                  <HugeiconsIcon icon={Cancel01Icon} />
                </Button>
                <Tooltip.Content>Clear selection</Tooltip.Content>
              </Tooltip>
            </ActionBar.Suffix>
          </ActionBar>
        </>
      )}
    </div>
  );
};
