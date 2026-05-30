"use client";

import { Button, Modal } from "@heroui/react";
import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { R2Config } from "@/lib/config/r2.config";

interface MediaUploadProps {
  onUploadComplete: () => void;
}

export function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files?.[0]) {
      handleFiles(e.target.files);
    }
  }

  function handleFiles(files: FileList) {
    setError(null);
    const file = files[0];

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
              <p className="text-muted-foreground text-sm">
                Drag and drop an image or click to browse
              </p>

              <button
                type="button"
                className={`relative w-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onClick={() => inputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={R2Config.ALLOWED_MIME_TYPES.join(",")}
                  onChange={handleChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-2">
                  <p className="text-muted-foreground text-sm">
                    {isPending ? "Uploading..." : "Drop your image here, or"}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onPress={() => inputRef.current?.click()}
                    isDisabled={isPending}
                  >
                    Browse Files
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    Max file size: {R2Config.MAX_FILE_SIZE / 1024 / 1024}MB
                  </p>
                </div>
              </button>

              {error && <p className="text-destructive text-sm">{error}</p>}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
