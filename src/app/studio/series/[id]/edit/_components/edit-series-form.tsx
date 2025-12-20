"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useId, useState, useTransition } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { updateSeries } from "@/app/_actions/series";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SelectSeries } from "@/schema";

const editSeriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]),
  coverImage: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type EditSeriesFormValues = z.infer<typeof editSeriesSchema>;

interface EditSeriesFormProps {
  series: SelectSeries;
}

export function EditSeriesForm({ series }: EditSeriesFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const titleId = useId();
  const slugId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const coverImageId = useId();

  const form = useForm<EditSeriesFormValues>({
    resolver: zodResolver(editSeriesSchema),
    defaultValues: {
      title: series.title,
      slug: series.slug,
      description: series.description ?? "",
      status: series.status,
      coverImage: series.coverImage ?? "",
    },
  });

  const handleSubmit = async (values: EditSeriesFormValues) => {
    startTransition(async () => {
      setError(null);

      try {
        await updateSeries(series.id, {
          title: values.title,
          slug: values.slug,
          description: values.description || null,
          status: values.status,
          coverImage: values.coverImage || null,
        });

        router.push("/studio/series" as Route);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update series",
        );
      }
    });
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Edit Series</h1>
            <p className="text-muted-foreground">
              Update series details and settings
            </p>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={"/studio/series" as Route} />}
          >
            Back to Series
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <Card>
            <CardContent className="flex flex-col gap-4 py-6">
              <Controller
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={titleId}>
                      Title <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id={titleId}
                      placeholder="Next.js Deep Dive"
                      autoComplete="off"
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="slug"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={slugId}>
                      Slug <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id={slugId}
                      placeholder="nextjs-deep-dive"
                      autoComplete="off"
                      aria-invalid={!!fieldState.error}
                      {...field}
                    />
                    <FieldDescription>
                      URL-friendly identifier for this series
                    </FieldDescription>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor={descriptionId}>Description</FieldLabel>
                    <Textarea
                      id={descriptionId}
                      placeholder="A comprehensive guide to building with Next.js..."
                      rows={4}
                      autoComplete="off"
                      {...field}
                    />
                    <FieldDescription>
                      Briefly describe what this series covers
                    </FieldDescription>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>Status</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id={statusId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="coverImage"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={!!fieldState.error}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-2">
                      <FieldLabel htmlFor={coverImageId}>
                        Cover Image URL
                      </FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id={coverImageId}
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          autoComplete="off"
                          {...field}
                        />
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
                      <FieldDescription>
                        Optional cover image for the series
                      </FieldDescription>
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </div>
                    {field.value && (
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
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={"/studio/series" as Route} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
