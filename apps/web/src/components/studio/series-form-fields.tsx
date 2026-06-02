"use client";

import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { CoverImageField } from "@/components/studio/cover-image-field";
import {
  StudioStatusSelectController,
  StudioTextAreaController,
  StudioTextFieldController,
} from "@/components/studio/studio-form-fields";

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

  return (
    <>
      <StudioTextFieldController
        control={form.control}
        name="title"
        label="Title"
        placeholder="Next.js Deep Dive"
        isRequired
      />

      <StudioTextFieldController
        control={form.control}
        name="slug"
        label="Slug"
        placeholder={
          slugReadOnly ? "auto-generated-from-title" : "nextjs-deep-dive"
        }
        description={
          slugReadOnly
            ? "Auto-generated from the series title"
            : "URL-friendly identifier for this series"
        }
        isReadOnly={slugReadOnly}
        isRequired={!slugReadOnly}
      />

      <StudioTextAreaController
        control={form.control}
        name="description"
        label="Description"
        placeholder="A comprehensive guide to building with Next.js..."
        rows={4}
        description="Briefly describe what this series covers"
      />

      <StudioStatusSelectController control={form.control} name="status" />

      <Controller
        control={form.control}
        name="coverImage"
        render={({ field, fieldState }) => (
          <CoverImageField
            value={field.value ?? ""}
            onChange={field.onChange}
            onSelect={(url) => form.setValue("coverImage", url)}
            errorMessage={fieldState.error?.message}
            description="Optional cover image for the series"
          />
        )}
      />
    </>
  );
}
