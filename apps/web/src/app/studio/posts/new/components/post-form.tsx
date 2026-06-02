"use client";

import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  ScrollShadow,
  Select,
  TextField,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Resizable } from "@heroui-pro/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import slugify from "slugify";
import { z } from "zod";
import { ContentEditor } from "@/components/studio/content-editor";
import { CoverImageField } from "@/components/studio/cover-image-field";
import { SaveStatusIndicator } from "@/components/studio/save-status-indicator";
import {
  StudioStatusSelectController,
  StudioTextAreaController,
  StudioTextFieldController,
} from "@/components/studio/studio-form-fields";
import { useAutoSave, useBeforeUnload } from "@/hooks/use-auto-save";

const NO_SERIES = "__none__";

const newPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  summary: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.string().optional(),
  seriesId: z.string().optional().or(z.literal("")),
  coverImage: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type NewPostFormValues = z.infer<typeof newPostSchema>;

interface SeriesOption {
  id: string;
  title: string;
}

interface PostFormProps {
  seriesOptions: SeriesOption[];
}

export function PostForm({ seriesOptions }: PostFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(true);

  const form = useForm<NewPostFormValues>({
    resolver: zodResolver(newPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      content: "",
      status: "draft",
      tags: "",
      seriesId: "",
      coverImage: "",
    },
  });

  const formValues = form.watch();
  const isDirty = form.formState.isDirty;

  const createAutoDraft = useEffectEvent(async () => {
    try {
      const slug = `draft-${Date.now()}`;
      const response = await fetch("/api/studio/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: slug,
          slug,
          content: " ",
          status: "draft",
          tags: [],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create draft");
      }

      const post = await response.json();
      setDraftId(post.id);
      setDraftUpdatedAt(post.updatedAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialise draft",
      );
    } finally {
      setIsCreatingDraft(false);
    }
  });

  useEffect(() => {
    createAutoDraft();
  }, []);

  const titleValue = form.watch("title");

  const updateSlugFromTitle = useEffectEvent((title: string) => {
    const generatedSlug = title
      ? slugify(title, { lower: true, strict: true })
      : "";

    if (form.getValues("slug") !== generatedSlug) {
      form.setValue("slug", generatedSlug, { shouldDirty: true });
    }
  });

  useEffect(() => {
    updateSlugFromTitle(titleValue);
  }, [titleValue]);

  const handleAutoSave = async () => {
    if (!draftId) return;

    const values = form.getValues();
    const data = {
      title: values.title || `Untitled draft`,
      slug:
        values.slug ||
        slugify(values.title, { lower: true, strict: true }) ||
        `draft-${draftId}`,
      summary: values.summary ?? "",
      content: values.content || " ",
      status: values.status,
      tags: (values.tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      seriesId: values.seriesId || null,
      coverImage: values.coverImage || null,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (draftUpdatedAt) {
      headers["If-Match"] = draftUpdatedAt;
    }

    const response = await fetch(`/api/studio/posts/${draftId}`, {
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
    setDraftUpdatedAt(updated.updatedAt);
  };

  const { saveStatus, lastSavedAt, triggerSave } = useAutoSave({
    saveFn: handleAutoSave,
    data: formValues,
    enabled: draftId !== null && isDirty && !isPending,
  });

  useBeforeUnload(isDirty && saveStatus !== "saved");

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
        seriesId: values.seriesId || null,
        coverImage: values.coverImage || null,
      };

      try {
        if (draftId) {
          const response = await fetch(`/api/studio/posts/${draftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create post");
          }
        } else {
          const response = await fetch("/api/studio/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create post");
          }
        }

        router.push("/studio/posts");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create post");
      }
    });
  };

  if (isCreatingDraft) {
    return (
      <Card>
        <Card.Content className="flex items-center justify-center py-12">
          <p className="text-muted">Preparing editor...</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Create New Post</h1>
            <p className="mb-2 text-muted">Write and publish a new blog post</p>
          </div>
          <div className="flex items-center gap-4">
            <SaveStatusIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              onRetry={triggerSave}
            />
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/studio/posts"
            >
              Back to Posts
            </Link>
          </div>
        </div>

        {error && (
          <Card className="border-danger">
            <Card.Content className="pt-6">
              <p className="text-danger text-sm">{error}</p>
            </Card.Content>
          </Card>
        )}

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-1 flex-col gap-4"
        >
          <Resizable
            orientation="horizontal"
            className="flex-1 rounded-lg border"
          >
            {/* Editor Panel */}
            <Resizable.Panel defaultSize={70} minSize={50}>
              <div className="flex h-full flex-col">
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field, fieldState }) => (
                    <div className="flex h-full flex-col">
                      <ContentEditor
                        markdown={field.value}
                        onChange={field.onChange}
                      />
                      {fieldState.error && (
                        <p className="px-4 text-danger text-sm">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </Resizable.Panel>

            <Resizable.Handle withIndicator />

            {/* Post Details Sidebar */}
            <Resizable.Panel defaultSize={30} minSize={25} maxSize={40}>
              <div className="flex h-full flex-col">
                <div className="border-b p-4">
                  <h2 className="font-semibold text-lg">Post Details</h2>
                </div>
                <ScrollShadow className="flex-1">
                  <div className="flex flex-col gap-4 p-4">
                    <StudioTextFieldController
                      control={form.control}
                      name="title"
                      label="Title"
                      placeholder="My Awesome Post"
                      isRequired
                    />

                    <StudioTextFieldController
                      control={form.control}
                      name="slug"
                      label="Slug"
                      placeholder="auto-generated-from-title"
                      description="Auto-generated from the post title"
                      isReadOnly
                    />

                    <StudioTextAreaController
                      control={form.control}
                      name="summary"
                      label="Summary"
                      placeholder="A brief description..."
                      rows={3}
                    />

                    <StudioStatusSelectController
                      control={form.control}
                      name="status"
                    />

                    <Controller
                      control={form.control}
                      name="seriesId"
                      render={({ field, fieldState }) => (
                        <Select
                          isInvalid={!!fieldState.error}
                          value={field.value || NO_SERIES}
                          onChange={(value) =>
                            field.onChange(value === NO_SERIES ? "" : value)
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
                          <Description>
                            Assign this post to a series
                          </Description>
                          {fieldState.error && (
                            <FieldError>{fieldState.error.message}</FieldError>
                          )}
                        </Select>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="tags"
                      render={({ field, fieldState }) => (
                        <TextField
                          isInvalid={!!fieldState.error}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        >
                          <Label>Tags</Label>
                          <Input
                            placeholder="nextjs, react"
                            autoComplete="off"
                          />
                          <Description>Comma-separated</Description>
                          {fieldState.error && (
                            <FieldError>{fieldState.error.message}</FieldError>
                          )}
                        </TextField>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="coverImage"
                      render={({ field, fieldState }) => (
                        <CoverImageField
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onSelect={(url) => form.setValue("coverImage", url)}
                          errorMessage={fieldState.error?.message}
                          description="Optional cover image URL"
                        />
                      )}
                    />
                  </div>
                </ScrollShadow>
              </div>
            </Resizable.Panel>
          </Resizable>

          <div className="flex justify-end gap-4">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/studio/posts"
            >
              Cancel
            </Link>
            <Button type="submit" isDisabled={isPending}>
              {isPending ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
