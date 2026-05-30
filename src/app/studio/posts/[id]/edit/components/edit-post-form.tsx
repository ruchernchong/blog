"use client";

import {
  Button,
  Card,
  Description,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { ContentEditor } from "@/components/studio/content-editor";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";
import { SaveStatusIndicator } from "@/components/studio/save-status-indicator";
import { useAutoSave, useBeforeUnload } from "@/hooks/use-auto-save";

const NO_SERIES = "__none__";

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "draft" | "published";
  tags: string[];
  seriesId: string | null;
  coverImage: string | null;
  deletedAt: Date | null;
  updatedAt: string;
}

interface SeriesOption {
  id: string;
  title: string;
}

interface EditPostFormProps {
  postId: string;
  seriesOptions: SeriesOption[];
}

interface FormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "draft" | "published";
  tags: string;
  seriesId: string;
  coverImage: string;
}

function isDirty(current: FormData, initial: FormData): boolean {
  return (
    current.title !== initial.title ||
    current.slug !== initial.slug ||
    current.summary !== initial.summary ||
    current.content !== initial.content ||
    current.status !== initial.status ||
    current.tags !== initial.tags ||
    current.seriesId !== initial.seriesId ||
    current.coverImage !== initial.coverImage
  );
}

function buildPatchData(formData: FormData) {
  return {
    title: formData.title,
    slug: formData.slug,
    summary: formData.summary,
    content: formData.content,
    status: formData.status,
    tags: formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    seriesId: formData.seriesId || null,
    coverImage: formData.coverImage || null,
  };
}

export function EditPostForm({ postId, seriesOptions }: EditPostFormProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    summary: "",
    content: "",
    status: "draft",
    tags: "",
    seriesId: "",
    coverImage: "",
  });

  const initialFormDataRef = useRef<FormData>(formData);

  const dirty = isDirty(formData, initialFormDataRef.current);

  const fetchPost = useEffectEvent(async (id: string) => {
    try {
      const response = await fetch(`/api/studio/posts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch post");
      const data = await response.json();
      setPost(data);

      const loaded: FormData = {
        title: data.title,
        slug: data.slug,
        summary: data.summary || "",
        content: data.content,
        status: data.status,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
        seriesId: data.seriesId || "",
        coverImage: data.coverImage || "",
      };
      setFormData(loaded);
      initialFormDataRef.current = loaded;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    fetchPost(postId);
  }, [postId]);

  const handleAutoSave = async () => {
    if (!dirty || !post || post.deletedAt) return;

    const data = buildPatchData(formData);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (post.updatedAt) {
      headers["If-Match"] = post.updatedAt;
    }

    const response = await fetch(`/api/studio/posts/${postId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (response.status === 409) {
      throw new Error(
        "This post was edited elsewhere. Refresh to see the latest version.",
      );
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to auto-save");
    }

    const updated = await response.json();
    setPost(updated);

    const saved: FormData = {
      title: updated.title,
      slug: updated.slug,
      summary: updated.summary || "",
      content: updated.content,
      status: updated.status,
      tags: Array.isArray(updated.tags) ? updated.tags.join(", ") : "",
      seriesId: updated.seriesId || "",
      coverImage: updated.coverImage || "",
    };
    initialFormDataRef.current = saved;
  };

  const { saveStatus, lastSavedAt, triggerSave } = useAutoSave({
    saveFn: handleAutoSave,
    data: formData,
    enabled: dirty && !isPending && !!post && !post.deletedAt,
  });

  useBeforeUnload(dirty && saveStatus !== "saved");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      setError(null);

      const data = buildPatchData(formData);

      try {
        const response = await fetch(`/api/studio/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update post");
        }

        router.push("/studio/posts");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update post");
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(`/api/studio/posts/${postId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete post");
        }

        router.push("/studio/posts");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete post");
      }
    });
  };

  const handleRestore = async () => {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(`/api/studio/posts/${postId}/restore`, {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to restore post");
        }

        await fetchPost(postId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to restore post");
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Content className="flex items-center justify-center py-12">
          <p className="text-muted">Loading...</p>
        </Card.Content>
      </Card>
    );
  }

  if (!post) {
    return (
      <Card>
        <Card.Content className="py-12 text-center">
          <p className="mb-4 text-muted">Post not found</p>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/studio/posts"
          >
            Back to Posts
          </Link>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Edit Post</h1>
          <p className="mb-2 text-muted">Update your blog post details</p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/studio/posts"
        >
          Back to Posts
        </Link>
      </div>

      {post.deletedAt && (
        <Card className="border-red-500 bg-red-50">
          <Card.Content className="pt-6">
            <p className="font-medium text-red-800 text-sm">
              This post has been deleted. Restore it to make edits or view it on
              the public site.
            </p>
          </Card.Content>
        </Card>
      )}

      {error && (
        <Card className="border-danger">
          <Card.Content className="pt-6">
            <p className="text-danger text-sm">{error}</p>
          </Card.Content>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Post Details</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                isRequired
                value={formData.title}
                onChange={(value) => setFormData({ ...formData, title: value })}
              >
                <Label>Title</Label>
                <Input placeholder="My Awesome Post" />
              </TextField>

              <TextField
                isRequired
                value={formData.slug}
                onChange={(value) => setFormData({ ...formData, slug: value })}
              >
                <Label>Slug</Label>
                <Input placeholder="my-awesome-post" />
              </TextField>
            </div>

            <TextField
              value={formData.summary}
              onChange={(value) => setFormData({ ...formData, summary: value })}
            >
              <Label>Summary</Label>
              <TextArea
                placeholder="A brief description of your post..."
                rows={3}
              />
            </TextField>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                value={formData.status}
                onChange={(value) => {
                  if (value)
                    setFormData({
                      ...formData,
                      status: value as "draft" | "published",
                    });
                }}
              >
                <Label>Status</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="draft" textValue="Draft">
                      Draft
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="published" textValue="Published">
                      Published
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                value={formData.seriesId || NO_SERIES}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    seriesId: value === NO_SERIES ? "" : String(value),
                  })
                }
              >
                <Label>Series</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={NO_SERIES} textValue="None">
                      None
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {seriesOptions.map((option) => (
                      <ListBox.Item
                        key={option.id}
                        id={option.id}
                        textValue={option.title}
                      >
                        {option.title}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
                <Description>Assign this post to a series</Description>
              </Select>
            </div>

            <TextField
              value={formData.tags}
              onChange={(value) => setFormData({ ...formData, tags: value })}
            >
              <Label>Tags</Label>
              <Input placeholder="nextjs, react, typescript" />
              <Description>Comma-separated tags</Description>
            </TextField>

            <TextField
              type="url"
              value={formData.coverImage}
              onChange={(value) =>
                setFormData({ ...formData, coverImage: value })
              }
            >
              <Label>Cover Image URL</Label>
              <div className="flex gap-2">
                <Input placeholder="https://example.com/image.jpg" />
                <Suspense fallback={null}>
                  <ImagePickerDialog
                    onSelect={(url) =>
                      setFormData({ ...formData, coverImage: url })
                    }
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Browse
                      </Button>
                    }
                  />
                </Suspense>
              </div>
              <Description>Optional cover image URL</Description>
            </TextField>
          </Card.Content>
        </Card>

        <ContentEditor
          markdown={formData.content}
          onChange={(content) => setFormData({ ...formData, content })}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {post.deletedAt ? (
              <Button
                type="button"
                onPress={handleRestore}
                isDisabled={isPending}
              >
                {isPending ? "Restoring..." : "Restore Post"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                onPress={handleDelete}
                isDisabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete Post"}
              </Button>
            )}
            <SaveStatusIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              onRetry={triggerSave}
            />
          </div>

          <div className="flex gap-4">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/studio/posts"
            >
              Cancel
            </Link>
            <Button type="submit" isDisabled={isPending || !!post.deletedAt}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
