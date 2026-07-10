"use client";

import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import Image from "next/image";
import { ImagePickerDialog } from "@/components/studio/image-picker-dialog";

interface CoverImageFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (url: string) => void;
  errorMessage?: string;
  description: string;
  showPreview?: boolean;
}

export function CoverImageField({
  value,
  onChange,
  onSelect,
  errorMessage,
  description,
  showPreview = true,
}: CoverImageFieldProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        type="url"
        isInvalid={!!errorMessage}
        value={value}
        onChange={onChange}
      >
        <Label>Cover Image URL</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/image.jpg"
            autoComplete="off"
          />
          <ImagePickerDialog
            onSelect={onSelect}
            trigger={
              <Button type="button" variant="outline" size="sm">
                Browse
              </Button>
            }
          />
        </div>
        <Description>{description}</Description>
        {errorMessage && <FieldError>{errorMessage}</FieldError>}
      </TextField>
      {showPreview && value && (
        <Image
          src={value}
          alt="Cover preview"
          width={800}
          height={160}
          className="h-auto max-h-40 w-full rounded-md object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
