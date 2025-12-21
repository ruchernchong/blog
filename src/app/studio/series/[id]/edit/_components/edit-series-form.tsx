"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { updateSeries } from "@/app/_actions/series";
import {
  SeriesFormFields,
  type SeriesFormValues,
  seriesFormSchema,
} from "@/components/studio/series-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SelectSeries } from "@/schema";

interface EditSeriesFormProps {
  series: SelectSeries;
}

export function EditSeriesForm({ series }: EditSeriesFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesFormSchema),
    defaultValues: {
      title: series.title,
      slug: series.slug,
      description: series.description ?? "",
      status: series.status,
      coverImage: series.coverImage ?? "",
    },
  });

  const handleSubmit = async (values: SeriesFormValues) => {
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
              <SeriesFormFields />
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
