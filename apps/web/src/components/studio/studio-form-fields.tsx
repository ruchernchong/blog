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
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";

interface StudioTextFieldControllerProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: Path<TValues>;
  label: string;
  placeholder: string;
  description?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
}

export function StudioTextFieldController<TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  isRequired = false,
  isReadOnly = false,
}: StudioTextFieldControllerProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          isInvalid={!!fieldState.error}
          isReadOnly={isReadOnly}
          value={field.value ?? ""}
          onChange={field.onChange}
        >
          <Label isRequired={isRequired}>{label}</Label>
          <Input placeholder={placeholder} autoComplete="off" />
          {description && <Description>{description}</Description>}
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </TextField>
      )}
    />
  );
}

interface StudioTextAreaControllerProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: Path<TValues>;
  label: string;
  placeholder: string;
  rows: number;
  description?: string;
}

export function StudioTextAreaController<TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows,
  description,
}: StudioTextAreaControllerProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          isInvalid={!!fieldState.error}
          value={field.value ?? ""}
          onChange={field.onChange}
        >
          <Label>{label}</Label>
          <TextArea placeholder={placeholder} rows={rows} autoComplete="off" />
          {description && <Description>{description}</Description>}
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </TextField>
      )}
    />
  );
}

interface StudioStatusSelectControllerProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: Path<TValues>;
}

export function StudioStatusSelectController<TValues extends FieldValues>({
  control,
  name,
}: StudioStatusSelectControllerProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
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
  );
}
