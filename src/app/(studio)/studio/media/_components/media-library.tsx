"use client";

import Image from "next/image";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import type { SelectMedia } from "@/schema";
import { MediaUpload } from "./media-upload";

export function MediaLibrary() {
  const router = useRouter();
  const [media, setMedia] = useState<SelectMedia[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<SelectMedia | null>(null);

  const fetchMedia = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    const response = await fetch(`/api/studio/media?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setMedia(data);
    }
  }, [searchQuery]);

  useEffect(() => {
    startTransition(async () => {
      await fetchMedia();
    });
  }, [fetchMedia]);

  function handleDelete(item: SelectMedia) {
    setDeleteTarget(item);
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const response = await fetch(`/api/studio/media/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMedia();
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to delete media: ${error.message || "Unknown error"}`);
      }
      setDeleteTarget(null);
    });
  }

  function toggleSelection(id: string) {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function toggleAll() {
    if (selectedItems.size === media.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(media.map((item) => item.id)));
    }
  }

  function handleBulkDelete() {
    if (selectedItems.size === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)
    ) {
      return;
    }

    startTransition(async () => {
      const deletePromises = Array.from(selectedItems).map((id) =>
        fetch(`/api/studio/media/${id}`, { method: "DELETE" }),
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter((res) => !res.ok);

      if (failedDeletes.length > 0) {
        alert(
          `Failed to delete ${failedDeletes.length} item(s). Please try again.`,
        );
      }

      await fetchMedia();
      setSelectedItems(new Set());
      router.refresh();
    });
  }

  function handleUploadComplete() {
    startTransition(async () => {
      await fetchMedia();
      router.refresh();
    });
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
  }

  if (isPending && media.length === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Media Library</h1>
            <p className="mb-2 text-muted-foreground">
              Manage your images and media files
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Loading media...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Media Library</h1>
          <p className="mb-2 text-muted-foreground">
            Manage your images and media files
          </p>
        </div>
        <MediaUpload onUploadComplete={handleUploadComplete} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by filename or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        {media.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={media.length > 0 && selectedItems.size === media.length}
              onCheckedChange={toggleAll}
              aria-label="Select all"
            />
            <span className="text-muted-foreground text-sm">Select all</span>
          </div>
        )}
      </div>

      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg border bg-muted p-4">
          <span className="text-sm">{selectedItems.size} item(s) selected</span>
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
              onClick={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {media.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No media yet</EmptyTitle>
                <EmptyDescription>
                  Upload your first image to get started
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <MediaUpload onUploadComplete={handleUploadComplete} />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <Card
              key={item.id}
              className={`group relative overflow-hidden ${
                selectedItems.has(item.id) ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => toggleSelection(item.id)}
                  className="bg-background/80"
                />
              </div>
              <div className="relative aspect-square">
                <Image
                  src={item.url}
                  alt={item.alt || item.filename}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              </div>
              <CardContent className="p-2">
                <p className="truncate font-medium text-sm">{item.filename}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(item.size)}
                </p>
              </CardContent>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(item.url)}
                >
                  Copy URL
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &ldquo;{deleteTarget?.filename}&rdquo;. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
