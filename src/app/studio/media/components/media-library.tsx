"use client";

import {
  AlertDialog,
  Button,
  Card,
  Checkbox,
  Input,
  TextField,
} from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Media Library</h1>
            <p className="mb-2 text-muted-foreground">
              Manage your images and media files
            </p>
          </div>
        </div>
        <Card>
          <Card.Content className="py-12">
            <p className="text-center text-muted-foreground">
              Loading media...
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
          <TextField
            aria-label="Search media"
            type="search"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <Input
              className="max-w-md"
              placeholder="Search by filename or alt text..."
            />
          </TextField>
        </div>
        {media.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              isSelected={
                media.length > 0 && selectedItems.size === media.length
              }
              onChange={() => toggleAll()}
              aria-label="Select all"
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox>
            <span className="text-muted-foreground text-sm">Select all</span>
          </div>
        )}
      </div>

      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg border bg-muted p-4">
          <span className="text-sm">{selectedItems.size} item(s) selected</span>
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
              onPress={() => setSelectedItems(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {media.length === 0 ? (
        <Card>
          <Card.Content className="py-12">
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>No media yet</EmptyState.Title>
                <EmptyState.Description>
                  Upload your first image to get started
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <MediaUpload onUploadComplete={handleUploadComplete} />
              </EmptyState.Content>
            </EmptyState>
          </Card.Content>
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
                  isSelected={selectedItems.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="bg-background/80"
                  aria-label={`Select ${item.filename}`}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
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
              <Card.Content className="p-2">
                <p className="truncate font-medium text-sm">{item.filename}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(item.size)}
                </p>
              </Card.Content>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => copyToClipboard(item.url)}
                >
                  Copy URL
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => handleDelete(item)}
                  isDisabled={isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete media?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>
                  This will delete &ldquo;{deleteTarget?.filename}&rdquo;. This
                  action cannot be undone.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary">
                  Cancel
                </Button>
                <Button slot="close" variant="danger" onPress={confirmDelete}>
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
