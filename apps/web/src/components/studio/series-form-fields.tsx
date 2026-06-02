"use client";

import {
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { CoverImageField } from "@/components/studio/cover-image-field";

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
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value ?? ""}
            onChange={field.onChange}
          >
            <Label isRequired>Title</Label>
            <Input placeholder="Next.js Deep Dive" autoComplete="off" />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        control={form.control}
        name="slug"
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            isReadOnly={slugReadOnly}
            value={field.value ?? ""}
            onChange={field.onChange}
          >
            <Label isRequired={!slugReadOnly}>Slug</Label>
            <Input
              placeholder={
                slugReadOnly ? "auto-generated-from-title" : "nextjs-deep-dive"
              }
              autoComplete="off"
            />
            <Description>
              {slugReadOnly
                ? "Auto-generated from the series title"
                : "URL-friendly identifier for this series"}
            </Description>
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <TextField
            isInvalid={!!fieldState.error}
            value={field.value ?? ""}
            onChange={field.onChange}
          >
            <Label>Description</Label>
            <TextArea
              placeholder="A comprehensive guide to building with Next.js..."
              rows={4}
              autoComplete="off"
            />
            <Description>Briefly describe what this series covers</Description>
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      <Controller
        control={form.control}
        name="status"
        render={({ field, fieldState }) => (
          <Select
            isInvalid={!!fieldState.error}
            value={field.value}
            onChange={field.onChange}
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
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </Select>
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
            description="Optional cover image for the series"
          />
        )}
      />
    </>
  );
}
