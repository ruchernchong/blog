"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";
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

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "draft" | "published";
  tags: string[];
  coverImage: string | null;
}

interface EditPostFormProps {
  postId: string;
}

export const EditPostForm = ({ postId }: EditPostFormProps) => {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    status: "draft" as "draft" | "published",
    tags: "",
    coverImage: "",
  });

  // Generate unique IDs for form fields
  const titleId = useId();
  const slugId = useId();
  const summaryId = useId();
  const contentId = useId();
  const statusId = useId();
  const tagsId = useId();
  const coverImageId = useId();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/studio/posts/${postId}`);
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
          coverImage: data.coverImage || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
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
      setIsDeleting(false);
    }
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
            <Button variant="outline" asChild>
              <Link href="/studio/posts">Back to Posts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Edit Post</h1>
          <p className="mt-1 text-muted-foreground">
            Update your blog post details
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/studio/posts">Back to Posts</Link>
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
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

              <div className="space-y-2">
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

            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor={statusId}>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published") =>
                    setFormData({ ...formData, status: value })
                  }
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

              <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor={coverImageId}>Cover Image URL</Label>
              <Input
                id={coverImageId}
                type="url"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
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
            <div className="space-y-2">
              <Label htmlFor={contentId}>
                MDX Content <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={contentId}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="# Your MDX content here..."
                rows={20}
                className="font-mono text-sm"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Post"}
          </Button>

          <div className="flex gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/studio/posts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
