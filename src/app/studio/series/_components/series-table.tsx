"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectSeries } from "@/schema";

export function SeriesTable() {
  const router = useRouter();
  const [allSeries, setAllSeries] = useState<SelectSeries[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "deleted"
  >("all");
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());

  const fetchSeries = useCallback(async () => {
    try {
      const response = await fetch("/api/studio/series");
      if (response.ok) {
        const series = await response.json();
        startTransition(() => {
          setAllSeries(series);
        });
      } else if (response.status === 401) {
        console.error("Unauthorised: Please sign in");
      }
    } catch (error) {
      console.error("Failed to fetch series:", error);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleDelete = async (seriesId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/studio/series/${seriesId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchSeries();
          router.refresh();
        } else {
          const error = await response.json();
          console.error("Failed to delete series:", error);
          alert(`Failed to delete series: ${error.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Failed to delete series:", error);
        alert("Failed to delete series");
      }
    });
  };

  const handleRestore = async (seriesId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/studio/series/${seriesId}/restore`, {
          method: "POST",
        });

        if (response.ok) {
          await fetchSeries();
          router.refresh();
        } else {
          const error = await response.json();
          console.error("Failed to restore series:", error);
          alert(
            `Failed to restore series: ${error.message || "Unknown error"}`,
          );
        }
      } catch (error) {
        console.error("Failed to restore series:", error);
        alert("Failed to restore series");
      }
    });
  };

  const toggleSeriesSelection = (seriesId: string) => {
    setSelectedSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  };

  const toggleAllSeries = () => {
    if (selectedSeries.size === filteredSeries.length) {
      setSelectedSeries(new Set());
    } else {
      setSelectedSeries(new Set(filteredSeries.map((s) => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSeries.size === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectedSeries.size} series?`)
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(selectedSeries).map((seriesId) =>
          fetch(`/api/studio/series/${seriesId}`, { method: "DELETE" }),
        );

        const results = await Promise.all(deletePromises);
        const failedDeletes = results.filter((res) => !res.ok);

        if (failedDeletes.length > 0) {
          alert(
            `Failed to delete ${failedDeletes.length} series. Please try again.`,
          );
        }

        await fetchSeries();
        setSelectedSeries(new Set());
        router.refresh();
      } catch (error) {
        console.error("Failed to delete series:", error);
        alert("Failed to delete series");
      }
    });
  };

  const filteredSeries = allSeries.filter((series) => {
    const matchesSearch =
      searchQuery === "" ||
      series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      series.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "deleted" && series.deletedAt) ||
      (statusFilter !== "deleted" &&
        !series.deletedAt &&
        series.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  if (allSeries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Series</h1>
            <p className="mb-2 text-muted-foreground">
              Manage your blog series
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href={"/studio/series/new" as Route} />}
          >
            Create Series
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Loading series...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Series</h1>
          <p className="mb-2 text-muted-foreground">Manage your blog series</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={"/studio/series/new" as Route} />}
        >
          Create Series
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search series by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(
            value: "all" | "draft" | "published" | "deleted" | null,
          ) => {
            if (value) setStatusFilter(value);
          }}
        >
          <SelectTrigger className="w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedSeries.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg border bg-muted p-4">
          <span className="text-sm">{selectedSeries.size} series selected</span>
          <div className="ml-auto flex gap-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Selected"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSeries(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {filteredSeries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No series found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search or filter criteria
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              All Series ({filteredSeries.length}
              {filteredSeries.length !== allSeries.length &&
                ` of ${allSeries.length}`}
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="w-12 px-6 py-3">
                      <Checkbox
                        checked={
                          filteredSeries.length > 0 &&
                          selectedSeries.size === filteredSeries.length
                        }
                        onCheckedChange={toggleAllSeries}
                        aria-label="Select all series"
                      />
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-sm">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-sm">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-sm">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSeries.map((series) => (
                    <tr
                      key={series.id}
                      className={`border-b last:border-0 hover:bg-muted/50 ${
                        series.deletedAt ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedSeries.has(series.id)}
                          onCheckedChange={() =>
                            toggleSeriesSelection(series.id)
                          }
                          aria-label={`Select ${series.title}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{series.title}</span>
                          <span className="text-muted-foreground text-xs">
                            {series.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {series.deletedAt ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800 text-xs">
                              deleted
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                                series.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {series.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(series.updatedAt).toLocaleDateString(
                          "en-SG",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          {series.deletedAt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(series.id)}
                              disabled={isPending}
                            >
                              {isPending ? "Restoring..." : "Restore"}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                nativeButton={false}
                                render={
                                  <Link
                                    href={
                                      `/studio/series/${series.id}/edit` as Route
                                    }
                                  />
                                }
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isPending}
                                    />
                                  }
                                >
                                  Delete
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete the series &ldquo;
                                      {series.title}&rdquo;. You can restore it
                                      later from the Deleted filter.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(series.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
