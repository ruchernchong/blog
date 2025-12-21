"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import slugify from "slugify";
import { createSeries, updateSeries } from "@/app/_actions/series";
import {
  SeriesFormFields,
  type SeriesFormValues,
  seriesFormSchema,
} from "@/components/studio/series-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SelectSeries } from "@/schema";

interface SeriesFormProps {
  series?: SelectSeries;
}

export function SeriesForm({ series }: SeriesFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!series;

  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      title: series?.title ?? "",
      slug: series?.slug ?? "",
      description: series?.description ?? "",
      status: series?.status ?? "draft",
      coverImage: series?.coverImage ?? "",
    },
  });

  const titleValue = form.watch("title");

  useEffect(() => {
    if (isEditing) return;

    const generatedSlug = titleValue
      ? slugify(titleValue, { lower: true, strict: true })
      : "";

    if (form.getValues("slug") !== generatedSlug) {
      form.setValue("slug", generatedSlug);
    }
  }, [titleValue, isEditing, form]);

  const handleSubmit = async (values: SeriesFormValues) => {
    startTransition(async () => {
      setError(null);

      try {
        const data = {
          title: values.title,
          slug:
            values.slug ||
            slugify(values.title, { lower: true, strict: true }) ||
            values.title.toLowerCase().replace(/\s+/g, "-"),
          description: values.description || null,
          status: values.status,
          coverImage: values.coverImage || null,
        };

        if (isEditing) {
          await updateSeries(series.id, data);
        } else {
          await createSeries(data);
        }

        router.push("/studio/series" as Route);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to ${isEditing ? "update" : "create"} series`,
        );
      }
    });
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {isEditing ? "Edit Series" : "Create New Series"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Update series details and settings"
                : "Group related posts into an ordered collection"}
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
              <SeriesFormFields slugReadOnly={!isEditing} />
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
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Series"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
