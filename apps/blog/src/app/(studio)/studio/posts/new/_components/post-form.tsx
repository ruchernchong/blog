"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Suspense,
  useEffect,
  useEffectEvent,
  useId,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";

const ContentEditor = dynamic(
  () => import("@/components/studio/content-editor"),
  { ssr: false }
);

const newPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  summary: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.string().optional(),
  coverImage: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type NewPostFormValues = z.infer<typeof newPostSchema>;

export const PostForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Generate unique IDs for form fields
  const titleId = useId();
  const slugId = useId();
  const summaryId = useId();
  const statusId = useId();
  const tagsId = useId();
  const coverImageId = useId();

  const form = useForm<NewPostFormValues>({
    resolver: zodResolver(newPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      content: "",
      status: "draft",
      tags: "",
      coverImage: "",
    },
  });

  const titleValue = form.watch("title");

  const updateSlugFromTitle = useEffectEvent((title: string) => {
    const generatedSlug = title
      ? slugify(title, { lower: true, strict: true })
      : "";

    if (form.getValues("slug") !== generatedSlug) {
      form.setValue("slug", generatedSlug);
    }
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent should not be in deps
  useEffect(() => {
    updateSlugFromTitle(titleValue);
  }, [titleValue]);

  const handleSubmit = async (values: NewPostFormValues) => {
    startTransition(async () => {
      setError(null);

      const data = {
        title: values.title,
        slug:
          values.slug ||
          slugify(values.title, { lower: true, strict: true }) ||
          values.title.toLowerCase().replace(/\s+/g, "-"),
        summary: values.summary ?? "",
        content: values.content,
        status: values.status,
        tags: (values.tags ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverImage: values.coverImage || null,
      };

      try {
        const response = await fetch("/api/studio/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create post");
        }

        router.push("/studio/posts");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create post");
      }
    });
  };

  return (
    <Form {...form}>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Create New Post</h1>
            <p className="mb-2 text-muted-foreground">
              Write and publish a new blog post
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

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col gap-4"
        >
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 rounded-lg border"
          >
            {/* Editor Panel */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="flex h-full flex-col">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex h-full flex-col">
                      <FormControl>
                        <Suspense fallback={null}>
                          <ContentEditor
                            markdown={field.value}
                            onChange={field.onChange}
                            slug={form.watch("slug")}
                          />
                        </Suspense>
                      </FormControl>
                      <FormMessage className="px-4" />
                    </FormItem>
                  )}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Post Details Sidebar */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
              <div className="flex h-full flex-col">
                <div className="border-b p-4">
                  <h2 className="font-semibold text-lg">Post Details</h2>
                </div>
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-4 p-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              id={titleId}
                              placeholder="My Awesome Post"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input
                              id={slugId}
                              placeholder="auto-generated-from-title"
                              autoComplete="off"
                              readOnly
                              className="cursor-not-allowed bg-muted"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Auto-generated from the post title
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Textarea
                              id={summaryId}
                              placeholder="A brief description..."
                              rows={3}
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger id={statusId}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">
                                Published
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input
                              id={tagsId}
                              placeholder="nextjs, react"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Comma-separated</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Image URL</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                id={coverImageId}
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <Suspense fallback={null}>
                              <ImagePickerDialog
                                onSelect={(url) => form.setValue("coverImage", url)}
                                trigger={
                                  <Button type="button" variant="outline" size="sm">
                                    Browse
                                  </Button>
                                }
                              />
                            </Suspense>
                          </div>
                          <FormDescription>
                            Optional cover image URL
                          </FormDescription>
                          <FormMessage />
                          {field.value && (
                            <div className="mb-4">
                              <Image
                                src={field.value}
                                alt="Cover preview"
                                width={800}
                                height={160}
                                className="h-auto max-h-40 w-full rounded-md object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/studio/posts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
};
