"use client";

import { Button, Modal } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { useState, useTransition } from "react";
import { R2Config } from "@/lib/config/r2.config";

interface MediaUploadProps {
  onUploadComplete: () => void;
}

interface DropEvent {
  items: Array<{ kind: string; getFile?: () => Promise<File> }>;
}

export function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function validateAndUpload(file: File) {
    setError(null);

    if (
      !R2Config.ALLOWED_MIME_TYPES.includes(
        file.type as (typeof R2Config.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      setError(
        `Invalid file type. Allowed: ${R2Config.ALLOWED_MIME_TYPES.join(", ")}`,
      );
      return;
    }

    if (file.size > R2Config.MAX_FILE_SIZE) {
      setError(
        `File too large. Maximum size: ${R2Config.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
      return;
    }

    uploadFile(file);
  }

  function handleSelect(files: FileList) {
    if (files[0]) {
      validateAndUpload(files[0]);
    }
  }

  async function handleDrop(e: DropEvent) {
    const item = e.items.find((i) => i.kind === "file" && i.getFile);
    if (item?.getFile) {
      validateAndUpload(await item.getFile());
    }
  }

  function uploadFile(file: File) {
    startTransition(async () => {
      const presignResponse = await fetch("/api/studio/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      if (!presignResponse.ok) {
        const err = await presignResponse.json();
        setError(err.message || "Failed to get upload URL");
        return;
      }

      const { uploadUrl, key, publicUrl } = await presignResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        setError("Failed to upload file to storage");
        return;
      }

      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith("image/")) {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      const confirmResponse = await fetch("/api/studio/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          filename: file.name,
          url: publicUrl,
          mimeType: file.type,
          size: file.size,
          width,
          height,
        }),
      });

      if (!confirmResponse.ok) {
        const err = await confirmResponse.json();
        setError(err.message || "Failed to save media record");
        return;
      }

      setOpen(false);
      onUploadComplete();
    });
  }

  function getImageDimensions(
    file: File,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  return (
    <Modal>
      <Button>Upload</Button>
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Upload Media</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <DropZone>
                <DropZone.Area isDisabled={isPending} onDrop={handleDrop}>
                  <DropZone.Icon />
                  <DropZone.Label>
                    {isPending ? "Uploading..." : "Drop your image here, or"}
                  </DropZone.Label>
                  <DropZone.Description>
                    Max file size: {R2Config.MAX_FILE_SIZE / 1024 / 1024}MB
                  </DropZone.Description>
                  <DropZone.Trigger isDisabled={isPending}>
                    Browse Files
                  </DropZone.Trigger>
                </DropZone.Area>
                <DropZone.Input
                  accept={R2Config.ALLOWED_MIME_TYPES.join(",")}
                  onSelect={handleSelect}
                />
              </DropZone>

              {error && <p className="text-danger text-sm">{error}</p>}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
