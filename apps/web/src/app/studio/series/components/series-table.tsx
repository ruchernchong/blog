"use client";

import type { Selection } from "@heroui/react";
import {
  AlertDialog,
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Select,
  Separator,
  TextField,
  Tooltip,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
  ActionBar,
  DataGrid,
  type DataGridColumn,
  EmptyState,
} from "@heroui-pro/react";
import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { SelectSeries } from "@/schema";

const dateFormatter = new Intl.DateTimeFormat("en-SG", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const statusLabel = (series: SelectSeries) =>
  series.deletedAt ? "deleted" : series.status;

export function SeriesTable() {
  const router = useRouter();
  const [allSeries, setAllSeries] = useState<SelectSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "deleted"
  >("all");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

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
    } finally {
      setIsLoading(false);
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

  // Bulk delete must only touch rows the current filter still shows. Resolve
  // the selection against the visible rows (and the "all" sentinel) so ids
  // selected before a filter narrowed the list can never be acted on.
  const visibleSelectedIds = useMemo(() => {
    const visible = new Set(filteredSeries.map((series) => series.id));
    if (selectedKeys === "all") return visible;
    return new Set(
      Array.from(selectedKeys, (key) => String(key)).filter((id) =>
        visible.has(id),
      ),
    );
  }, [selectedKeys, filteredSeries]);

  const selectionCount = visibleSelectedIds.size;

  const clearSelection = () => setSelectedKeys(new Set());

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearSelection();
  };

  const handleStatusChange = (value: string | number | null) => {
    if (!value) return;
    setStatusFilter(String(value) as "all" | "draft" | "published" | "deleted");
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (selectionCount === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectionCount} series?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const deletePromises = Array.from(visibleSelectedIds).map((seriesId) =>
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
        clearSelection();
        router.refresh();
      } catch (error) {
        console.error("Failed to delete series:", error);
        alert("Failed to delete series");
      }
    });
  };

  const columns: DataGridColumn<SelectSeries>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      isRowHeader: true,
      allowsSorting: true,
      minWidth: 240,
      cell: (series) => (
        <div className="flex flex-col">
          <span className="font-medium">{series.title}</span>
          <span className="text-muted text-xs">{series.slug}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      allowsSorting: true,
      sortFn: (a, b) => statusLabel(a).localeCompare(statusLabel(b)),
      cell: (series) =>
        series.deletedAt ? (
          <Chip size="sm" variant="soft" color="danger">
            deleted
          </Chip>
        ) : (
          <Chip
            size="sm"
            variant="soft"
            color={series.status === "published" ? "success" : "warning"}
          >
            {series.status}
          </Chip>
        ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      accessorKey: "updatedAt",
      allowsSorting: true,
      sortFn: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      cell: (series) => (
        <span className="text-muted text-sm tabular-nums">
          {dateFormatter.format(new Date(series.updatedAt))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      cell: (series) => (
        <div className="flex items-center gap-4">
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
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                href={`/studio/series/${series.id}/edit` as Route}
              >
                Edit
              </Link>
              <AlertDialog>
                <Button variant="ghost" size="sm" isDisabled={isPending}>
                  Delete
                </Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog>
                      <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>Are you sure?</AlertDialog.Heading>
                      </AlertDialog.Header>
                      <AlertDialog.Body>
                        <p>
                          This will delete the series &ldquo;{series.title}
                          &rdquo;. You can restore it later from the Deleted
                          filter.
                        </p>
                      </AlertDialog.Body>
                      <AlertDialog.Footer>
                        <Button slot="close" variant="tertiary">
                          Cancel
                        </Button>
                        <Button
                          slot="close"
                          variant="danger"
                          onPress={() => handleDelete(series.id)}
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
      ),
    },
  ];

  if (isLoading) {
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

      {allSeries.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>No series yet</EmptyState.Title>
                <EmptyState.Description>
                  Get started by creating your first blog series
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Link
                  className={buttonVariants()}
                  href={"/studio/series/new" as Route}
                >
                  Create Series
                </Link>
              </EmptyState.Content>
            </EmptyState>
          </Card.Content>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <TextField
                aria-label="Search series"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
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
              onChange={handleStatusChange}
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
              <DataGrid
                aria-label="All series"
                columns={columns}
                data={filteredSeries}
                defaultSortDescriptor={{
                  column: "updatedAt",
                  direction: "descending",
                }}
                getRowId={(series) => series.id}
                onSelectionChange={setSelectedKeys}
                renderEmptyState={() => (
                  <div className="py-6">
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
                            clearSelection();
                          }}
                        >
                          Clear Filters
                        </Button>
                      </EmptyState.Content>
                    </EmptyState>
                  </div>
                )}
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                showSelectionCheckboxes
              />
            </Card.Content>
          </Card>

          <ActionBar
            aria-label="Bulk series actions"
            isOpen={selectionCount > 0}
          >
            <ActionBar.Prefix>
              <Chip size="sm" variant="soft">
                {selectionCount}
              </Chip>
            </ActionBar.Prefix>
            <Separator />
            <ActionBar.Content>
              <Button
                size="sm"
                variant="danger"
                onPress={handleBulkDelete}
                isDisabled={isPending}
              >
                <HugeiconsIcon icon={Delete02Icon} />
                <span className="action-bar__label">
                  {isPending ? "Deleting..." : "Delete"}
                </span>
              </Button>
            </ActionBar.Content>
            <Separator />
            <ActionBar.Suffix>
              <Tooltip>
                <Button
                  isIconOnly
                  aria-label="Clear selection"
                  size="sm"
                  variant="ghost"
                  onPress={clearSelection}
                >
                  <HugeiconsIcon icon={Cancel01Icon} />
                </Button>
                <Tooltip.Content>Clear selection</Tooltip.Content>
              </Tooltip>
            </ActionBar.Suffix>
          </ActionBar>
        </>
      )}
    </div>
  );
}
