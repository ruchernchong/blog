"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import slugify from "slugify";
import { createSeries } from "@/app/_actions/series";
import {
  SeriesFormFields,
  type SeriesFormValues,
  seriesFormSchema,
} from "@/components/studio/series-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SeriesForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      status: "draft",
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

  useEffect(() => {
    updateSlugFromTitle(titleValue);
  }, [titleValue]);

  const handleSubmit = async (values: SeriesFormValues) => {
    startTransition(async () => {
      setError(null);

      try {
        await createSeries({
          title: values.title,
          slug:
            values.slug ||
            slugify(values.title, { lower: true, strict: true }) ||
            values.title.toLowerCase().replace(/\s+/g, "-"),
          description: values.description || null,
          status: values.status,
          coverImage: values.coverImage || null,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create series",
        );
      }
    });
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Create New Series
            </h1>
            <p className="text-muted-foreground">
              Group related posts into an ordered collection
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
              <SeriesFormFields slugReadOnly />
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
              {isPending ? "Creating..." : "Create Series"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
