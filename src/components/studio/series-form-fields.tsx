"use client";

import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import Image from "next/image";
import { Suspense } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";

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
          <div className="flex flex-col gap-4">
            <TextField
              type="url"
              isInvalid={!!fieldState.error}
              value={field.value ?? ""}
              onChange={field.onChange}
            >
              <Label>Cover Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  autoComplete="off"
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
              <Description>Optional cover image for the series</Description>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
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
          </div>
        )}
      />
    </>
  );
}
