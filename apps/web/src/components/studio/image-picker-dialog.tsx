"use client";

import {
  Button,
  cn,
  Input,
  Modal,
  TextField,
  ToggleButton,
} from "@heroui/react";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactElement } from "react";
import { useEffect, useState, useTransition } from "react";
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
    <Modal>
      {trigger ?? (
        <Button type="button" variant="outline">
          Browse Media
        </Button>
      )}
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-4xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Select Image</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-muted text-sm">
                Choose an image from your media library
              </p>

              <TextField
                aria-label="Search media"
                type="search"
                value={searchQuery}
                onChange={setSearchQuery}
              >
                <Input placeholder="Search by filename or alt text..." />
              </TextField>

              {isPending && media.length === 0 ? (
                <p className="py-8 text-center text-muted">Loading...</p>
              ) : media.length === 0 ? (
                <p className="py-8 text-center text-muted">
                  No media found. Upload images in the Media Library first.
                </p>
              ) : (
                <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto">
                  {media.map((item) => (
                    <ToggleButton
                      key={item.id}
                      aria-label={item.alt || item.filename}
                      isSelected={selected?.id === item.id}
                      onChange={() => setSelected(item)}
                      className={cn(
                        "relative aspect-square h-auto overflow-hidden rounded-md border-2 p-0 transition-colors",
                        selected?.id === item.id
                          ? "border-accent"
                          : "border-transparent hover:border-muted-foreground/50",
                      )}
                    >
                      <Image
                        src={item.url}
                        alt={item.alt || item.filename}
                        fill
                        className="object-cover"
                        sizes="150px"
                      />
                    </ToggleButton>
                  ))}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" type="button" variant="outline">
                Cancel
              </Button>
              <Button
                type="button"
                onPress={handleSelect}
                isDisabled={!selected}
              >
                Select
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
