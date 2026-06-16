"use client";

import {
  AlertDialog,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { EmptyState } from "@heroui-pro/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
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

  // TODO: To be fixed. This should be an empty state
  if (allSeries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Series</h1>
            <p className="mb-2 text-muted">Manage your blog series</p>
          </div>
          <Link
            className={buttonVariants()}
            href={"/studio/series/new" as Route}
          >
            Create Series
          </Link>
        </div>
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted">Loading series...</p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Series</h1>
          <p className="mb-2 text-muted">Manage your blog series</p>
        </div>
        <Link className={buttonVariants()} href={"/studio/series/new" as Route}>
          Create Series
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <TextField
            aria-label="Search series"
            type="search"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <Input
              className="max-w-md"
              placeholder="Search series by title or slug..."
            />
          </TextField>
        </div>
        <Select
          aria-label="Filter by status"
          className="w-45"
          value={statusFilter}
          onChange={(value) => {
            if (value)
              setStatusFilter(
                value as "all" | "draft" | "published" | "deleted",
              );
          }}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="all" textValue="All Series">
                All Series
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="draft" textValue="Draft">
                Draft
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="published" textValue="Published">
                Published
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="deleted" textValue="Deleted">
                Deleted
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {selectedSeries.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg border bg-default p-4">
          <span className="text-sm">{selectedSeries.size} series selected</span>
          <div className="ml-auto flex gap-4">
            <Button
              variant="danger"
              size="sm"
              onPress={handleBulkDelete}
              isDisabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Selected"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setSelectedSeries(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {filteredSeries.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>No series found</EmptyState.Title>
                <EmptyState.Description>
                  Try adjusting your search or filter criteria
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button
                  variant="outline"
                  onPress={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </EmptyState.Content>
            </EmptyState>
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>
              All Series ({filteredSeries.length}
              {filteredSeries.length !== allSeries.length &&
                ` of ${allSeries.length}`}
              )
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="w-12 px-6 py-3">
                      <Checkbox
                        isSelected={
                          filteredSeries.length > 0 &&
                          selectedSeries.size === filteredSeries.length
                        }
                        onChange={() => toggleAllSeries()}
                        aria-label="Select all series"
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
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
                      className={`border-b last:border-0 hover:bg-default/50 ${
                        series.deletedAt ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          isSelected={selectedSeries.has(series.id)}
                          onChange={() => toggleSeriesSelection(series.id)}
                          aria-label={`Select ${series.title}`}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{series.title}</span>
                          <span className="text-muted text-xs">
                            {series.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {series.deletedAt ? (
                            <Chip size="sm" variant="soft" color="danger">
                              deleted
                            </Chip>
                          ) : (
                            <Chip
                              size="sm"
                              variant="soft"
                              color={
                                series.status === "published"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {series.status}
                            </Chip>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted text-sm">
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
                              onPress={() => handleRestore(series.id)}
                              isDisabled={isPending}
                            >
                              {isPending ? "Restoring..." : "Restore"}
                            </Button>
                          ) : (
                            <>
                              <Link
                                className={buttonVariants({
                                  variant: "ghost",
                                  size: "sm",
                                })}
                                href={
                                  `/studio/series/${series.id}/edit` as Route
                                }
                              >
                                Edit
                              </Link>
                              <AlertDialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  isDisabled={isPending}
                                >
                                  Delete
                                </Button>
                                <AlertDialog.Backdrop>
                                  <AlertDialog.Container>
                                    <AlertDialog.Dialog>
                                      <AlertDialog.Header>
                                        <AlertDialog.Icon status="danger" />
                                        <AlertDialog.Heading>
                                          Are you sure?
                                        </AlertDialog.Heading>
                                      </AlertDialog.Header>
                                      <AlertDialog.Body>
                                        <p>
                                          This will delete the series &ldquo;
                                          {series.title}&rdquo;. You can restore
                                          it later from the Deleted filter.
                                        </p>
                                      </AlertDialog.Body>
                                      <AlertDialog.Footer>
                                        <Button slot="close" variant="tertiary">
                                          Cancel
                                        </Button>
                                        <Button
                                          slot="close"
                                          variant="danger"
                                          onPress={() =>
                                            handleDelete(series.id)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </AlertDialog.Footer>
                                    </AlertDialog.Dialog>
                                  </AlertDialog.Container>
                                </AlertDialog.Backdrop>
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
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
