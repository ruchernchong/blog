"use client";

import Image from "next/image";
import { Suspense, useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";
import { Button } from "@/components/ui/button";
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

export const seriesFormSchema = z.object({
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

export type SeriesFormValues = z.infer<typeof seriesFormSchema>;

interface SeriesFormFieldsProps {
  slugReadOnly?: boolean;
}

export function SeriesFormFields({
  slugReadOnly = false,
}: SeriesFormFieldsProps) {
  const form = useFormContext<SeriesFormValues>();

  const titleId = useId();
  const slugId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const coverImageId = useId();

  return (
    <>
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
              Slug{" "}
              {!slugReadOnly && <span className="text-destructive">*</span>}
            </FieldLabel>
            <Input
              id={slugId}
              placeholder={
                slugReadOnly ? "auto-generated-from-title" : "nextjs-deep-dive"
              }
              autoComplete="off"
              readOnly={slugReadOnly}
              className={
                slugReadOnly ? "cursor-not-allowed bg-muted" : undefined
              }
              aria-invalid={!!fieldState.error}
              {...field}
            />
            <FieldDescription>
              {slugReadOnly
                ? "Auto-generated from the series title"
                : "URL-friendly identifier for this series"}
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
              <FieldLabel htmlFor={coverImageId}>Cover Image URL</FieldLabel>
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
    </>
  );
}
