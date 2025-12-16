"use client";

import type { MutableRefObject, RefObject } from "react";
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useTransition,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { R2Config, type AllowedMimeType } from "@/lib/config/r2.config";
import { cn } from "@/lib/utils";
import { ImagePickerDialog } from "./image-picker-dialog";

export interface ContentEditorMethods {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
  insertText: (text: string) => void;
}

interface ContentEditorProps {
  markdown: string;
  onChange?: (markdown: string) => void;
  editorRef?: MutableRefObject<ContentEditorMethods | null>;
  slug?: string;
}

async function imageUploadHandler(file: File, slug?: string): Promise<string> {
  if (
    !R2Config.ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)
  ) {
    throw new Error(
      `Invalid file type. Allowed: ${R2Config.ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  if (file.size > R2Config.MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size: ${R2Config.MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Use temp upload if slug is provided (draft mode)
  const isTemp = Boolean(slug);

  const presignResponse = await fetch("/api/studio/media/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      isTemp,
    }),
  });

  if (!presignResponse.ok) {
    const err = await presignResponse.json();
    throw new Error(err.message || "Failed to get upload URL");
  }

  const { uploadUrl, key, publicUrl } = await presignResponse.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage");
  }

  let width: number | undefined;
  let height: number | undefined;

  if (file.type.startsWith("image/")) {
    const dimensions = await getImageDimensions(file);
    width = dimensions.width;
    height = dimensions.height;
  }

  // Confirm to temp (Redis) or permanent (PostgreSQL) based on mode
  const confirmEndpoint = isTemp ? "/api/studio/media/tmp" : "/api/studio/media";
  const confirmBody = isTemp
    ? { key, filename: file.name, url: publicUrl, mimeType: file.type, size: file.size, width, height, slug }
    : { key, filename: file.name, url: publicUrl, mimeType: file.type, size: file.size, width, height };

  const confirmResponse = await fetch(confirmEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(confirmBody),
  });

  if (!confirmResponse.ok) {
    const err = await confirmResponse.json();
    throw new Error(err.message || "Failed to save media record");
  }

  return publicUrl;
}

function getImageDimensions(
  file: File
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

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}

export default function ContentEditor({
  markdown,
  onChange,
  editorRef,
  slug,
}: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(editorRef, () => ({
    getMarkdown: () => markdown,
    setMarkdown: (md: string) => onChange?.(md),
    focus: () => textareaRef.current?.focus(),
    insertText: (text: string) => insertAtCursor(textareaRef, markdown, onChange, text),
  }));

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const selectedText = value.substring(selectionStart, selectionEnd);
      const newText =
        value.substring(0, selectionStart) +
        before +
        selectedText +
        after +
        value.substring(selectionEnd);

      onChange?.(newText);

      requestAnimationFrame(() => {
        textarea.focus();
        if (selectedText) {
          textarea.setSelectionRange(
            selectionStart + before.length,
            selectionEnd + before.length
          );
        } else {
          const cursorPos = selectionStart + before.length;
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [onChange]
  );

  const prefixLine = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, value } = textarea;
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const lineEnd = value.indexOf("\n", selectionStart);
      const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.substring(lineStart, actualLineEnd);

      // Check if line already has this prefix
      if (currentLine.startsWith(prefix)) {
        // Remove prefix
        const newText =
          value.substring(0, lineStart) +
          currentLine.substring(prefix.length) +
          value.substring(actualLineEnd);
        onChange?.(newText);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            selectionStart - prefix.length,
            selectionStart - prefix.length
          );
        });
      } else {
        // Add prefix
        const newText =
          value.substring(0, lineStart) + prefix + value.substring(lineStart);
        onChange?.(newText);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            selectionStart + prefix.length,
            selectionStart + prefix.length
          );
        });
      }
    },
    [onChange]
  );

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const linkText = selectedText || "link text";
    const linkMarkdown = `[${linkText}](url)`;

    const newText =
      value.substring(0, selectionStart) +
      linkMarkdown +
      value.substring(selectionEnd);

    onChange?.(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      // Select "url" so user can type the actual URL
      const urlStart = selectionStart + linkText.length + 3;
      const urlEnd = urlStart + 3;
      textarea.setSelectionRange(urlStart, urlEnd);
    });
  }, [onChange]);

  const insertImage = useCallback(
    (url: string, alt = "image") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const imageMarkdown = `![${alt}](${url})`;

      const newText =
        value.substring(0, selectionStart) +
        imageMarkdown +
        value.substring(selectionEnd);

      onChange?.(newText);

      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = selectionStart + imageMarkdown.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [onChange]
  );

  const insertCodeBlock = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);

    // If text is selected, wrap in code block
    if (selectedText && selectedText.includes("\n")) {
      const codeBlock = "```\n" + selectedText + "\n```";
      const newText =
        value.substring(0, selectionStart) +
        codeBlock +
        value.substring(selectionEnd);
      onChange?.(newText);
    } else if (selectedText) {
      // Inline code for single line
      wrapSelection("`", "`");
    } else {
      // Insert empty code block
      const codeBlock = "```\n\n```";
      const newText =
        value.substring(0, selectionStart) +
        codeBlock +
        value.substring(selectionEnd);
      onChange?.(newText);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = selectionStart + 4;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    }
  }, [onChange, wrapSelection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "b") {
        e.preventDefault();
        wrapSelection("**", "**");
      } else if (isMod && e.key === "i") {
        e.preventDefault();
        wrapSelection("_", "_");
      } else if (isMod && e.key === "k") {
        e.preventDefault();
        insertLink();
      } else if (isMod && e.key === "e") {
        e.preventDefault();
        wrapSelection("`", "`");
      } else if (isMod && e.key === "1") {
        e.preventDefault();
        prefixLine("# ");
      } else if (isMod && e.key === "2") {
        e.preventDefault();
        prefixLine("## ");
      } else if (isMod && e.key === "3") {
        e.preventDefault();
        prefixLine("### ");
      } else if (e.key === "Tab") {
        e.preventDefault();
        insertAtCursor(textareaRef, markdown, onChange, "  ");
      }
    },
    [wrapSelection, insertLink, prefixLine, markdown, onChange]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      startUpload(async () => {
        try {
          const url = await imageUploadHandler(file, slug);
          insertImage(url, file.name.replace(/\.[^/.]+$/, ""));
        } catch (error) {
          console.error("Upload failed:", error);
          alert(error instanceof Error ? error.message : "Upload failed");
        }
      });

      // Reset input
      e.target.value = "";
    },
    [insertImage, slug]
  );

  const handleMediaSelect = useCallback(
    (url: string) => {
      insertImage(url);
    },
    [insertImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) =>
        R2Config.ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)
      );

      if (!imageFile) {
        alert(`Invalid file type. Allowed: ${R2Config.ALLOWED_MIME_TYPES.join(", ")}`);
        return;
      }

      startUpload(async () => {
        try {
          const url = await imageUploadHandler(imageFile, slug);
          insertImage(url, imageFile.name.replace(/\.[^/.]+$/, ""));
        } catch (error) {
          console.error("Upload failed:", error);
          alert(error instanceof Error ? error.message : "Upload failed");
        }
      });
    },
    [insertImage, slug]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        <ToolbarButton
          icon={<Bold className="size-4" />}
          label="Bold"
          shortcut="Ctrl+B"
          onClick={() => wrapSelection("**", "**")}
        />
        <ToolbarButton
          icon={<Italic className="size-4" />}
          label="Italic"
          shortcut="Ctrl+I"
          onClick={() => wrapSelection("_", "_")}
        />
        <ToolbarButton
          icon={<Code className="size-4" />}
          label="Code"
          shortcut="Ctrl+E"
          onClick={insertCodeBlock}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={<Heading1 className="size-4" />}
          label="Heading 1"
          shortcut="Ctrl+1"
          onClick={() => prefixLine("# ")}
        />
        <ToolbarButton
          icon={<Heading2 className="size-4" />}
          label="Heading 2"
          shortcut="Ctrl+2"
          onClick={() => prefixLine("## ")}
        />
        <ToolbarButton
          icon={<Heading3 className="size-4" />}
          label="Heading 3"
          shortcut="Ctrl+3"
          onClick={() => prefixLine("### ")}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={<List className="size-4" />}
          label="Bullet List"
          onClick={() => prefixLine("- ")}
        />
        <ToolbarButton
          icon={<ListOrdered className="size-4" />}
          label="Numbered List"
          onClick={() => prefixLine("1. ")}
        />
        <ToolbarButton
          icon={<Quote className="size-4" />}
          label="Blockquote"
          onClick={() => prefixLine("> ")}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          icon={<Link className="size-4" />}
          label="Insert Link"
          shortcut="Ctrl+K"
          onClick={insertLink}
        />

        <ToolbarButton
          icon={<Upload className="size-4" />}
          label="Upload Image"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        />

        <ImagePickerDialog
          onSelect={handleMediaSelect}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Browse Media Library"
              aria-label="Browse Media Library"
            >
              <Image className="size-4" />
            </Button>
          }
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={R2Config.ALLOWED_MIME_TYPES.join(",")}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Editor + Preview */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={30}>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "h-full w-full resize-none border-0 bg-background p-4 font-mono text-sm outline-none transition-colors",
              isDragging && "bg-primary/10 ring-2 ring-primary ring-inset"
            )}
            placeholder="Write your content in Markdown..."
            spellCheck={false}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <ScrollArea className="h-full">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
              {markdown ? (
                <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
              ) : (
                <p className="text-muted-foreground">Preview will appear here...</p>
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function insertAtCursor(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  markdown: string,
  onChange: ((markdown: string) => void) | undefined,
  text: string
) {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const { selectionStart, selectionEnd, value } = textarea;
  const newText =
    value.substring(0, selectionStart) + text + value.substring(selectionEnd);

  onChange?.(newText);

  requestAnimationFrame(() => {
    textarea.focus();
    const newPos = selectionStart + text.length;
    textarea.setSelectionRange(newPos, newPos);
  });
}
