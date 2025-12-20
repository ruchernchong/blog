"use client";

import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactElement } from "react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SelectMedia } from "@/schema";

interface ImagePickerDialogProps {
  onSelect: (url: string) => void;
  trigger?: ReactElement;
}

export function ImagePickerDialog({
  onSelect,
  trigger,
}: ImagePickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<SelectMedia[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useQueryState(
    "media_search",
    parseAsString.withDefault(""),
  );
  const [selected, setSelected] = useState<SelectMedia | null>(null);

  useEffect(() => {
    if (!open) return;

    startTransition(async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      const response = await fetch(`/api/studio/media?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      }
    });
  }, [open, searchQuery]);

  function handleSelect() {
    if (selected) {
      onSelect(selected.url);
      setOpen(false);
      setSelected(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger}>{null}</DialogTrigger>
      ) : (
        <DialogTrigger render={<Button type="button" variant="outline" />}>
          Browse Media
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
          <DialogDescription>
            Choose an image from your media library
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            type="search"
            placeholder="Search by filename or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {isPending && media.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : media.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No media found. Upload images in the Media Library first.
            </p>
          ) : (
            <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                    selected?.id === item.id
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/50"
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSelect} disabled={!selected}>
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
