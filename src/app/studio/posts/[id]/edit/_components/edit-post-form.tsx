"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useEffectEvent,
  useId,
  useState,
  useTransition,
} from "react";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ContentEditor = dynamic(
  () => import("@/components/studio/content-editor"),
  { ssr: false },
);

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
}

interface SeriesOption {
  id: string;
  title: string;
}

interface EditPostFormProps {
  postId: string;
  seriesOptions: SeriesOption[];
}

export function EditPostForm({ postId, seriesOptions }: EditPostFormProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    status: "draft" as "draft" | "published",
    tags: "",
    seriesId: "",
    coverImage: "",
  });

  // Generate unique IDs for form fields
  const titleId = useId();
  const slugId = useId();
  const summaryId = useId();
  const statusId = useId();
  const seriesFieldId = useId();
  const tagsId = useId();
  const coverImageId = useId();

  const fetchPost = useEffectEvent(async (id: string) => {
    try {
      const response = await fetch(`/api/studio/posts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch post");
      const data = await response.json();
      setPost(data);
      setFormData({
        title: data.title,
        slug: data.slug,
        summary: data.summary || "",
        content: data.content,
        status: data.status,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
        seriesId: data.seriesId || "",
        coverImage: data.coverImage || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    fetchPost(postId);
  }, [postId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      setError(null);

      const data = {
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

        // Refetch the post to update UI
        await fetchPost(postId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to restore post");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">Post not found</p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/studio/posts" />}
            >
              Back to Posts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Edit Post</h1>
          <p className="mb-2 text-muted-foreground">
            Update your blog post details
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/studio/posts" />}
        >
          Back to Posts
        </Button>
      </div>

      {post.deletedAt && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <p className="font-medium text-red-800 text-sm">
              This post has been deleted. Restore it to make edits or view it on
              the public site.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={titleId}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={titleId}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="My Awesome Post"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={slugId}>
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={slugId}
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="my-awesome-post"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={summaryId}>Summary</Label>
              <Textarea
                id={summaryId}
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="A brief description of your post..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={statusId}>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published" | null) => {
                    if (value) setFormData({ ...formData, status: value });
                  }}
                >
                  <SelectTrigger id={statusId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={seriesFieldId}>Series</Label>
                <Select
                  value={formData.seriesId}
                  onValueChange={(value: string | null) => {
                    setFormData({ ...formData, seriesId: value || "" });
                  }}
                >
                  <SelectTrigger id={seriesFieldId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {seriesOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Assign this post to a series
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={tagsId}>Tags</Label>
              <Input
                id={tagsId}
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="nextjs, react, typescript"
              />
              <p className="text-muted-foreground text-xs">
                Comma-separated tags
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={coverImageId}>Cover Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id={coverImageId}
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
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
              <p className="text-muted-foreground text-xs">
                Optional cover image URL
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <Suspense fallback={null}>
                <ContentEditor
                  markdown={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {post.deletedAt ? (
              <Button
                type="button"
                variant="default"
                onClick={handleRestore}
                disabled={isPending}
              >
                {isPending ? "Restoring..." : "Restore Post"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete Post"}
              </Button>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/studio/posts" />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !!post.deletedAt}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
