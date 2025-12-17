"use client";

import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  diffSourcePlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  Separator,
  DiffSourceToggleWrapper,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { R2Config, type AllowedMimeType } from "@/lib/config/r2.config";

export interface MarkdownEditorMethods {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
}

interface MarkdownEditorProps {
  markdown: string;
  onChange?: (markdown: string) => void;
}

async function imageUploadHandler(file: File): Promise<string> {
  if (!R2Config.ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new Error("Invalid file type");
  }

  if (file.size > R2Config.MAX_FILE_SIZE) {
    throw new Error("File too large");
  }

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
    throw new Error("Failed to get upload URL");
  }

  const { uploadUrl, key, publicUrl } = await presignResponse.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadResponse.ok) {
    console.error("R2 upload failed:", uploadResponse.status);
    throw new Error("Failed to upload file");
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
    }),
  });

  if (!confirmResponse.ok) {
    const err = await confirmResponse.json().catch(() => ({}));
    console.error("Confirm failed:", err);
    throw new Error("Failed to save media");
  }

  return publicUrl;
}

export const MarkdownEditor = forwardRef<
  MarkdownEditorMethods,
  MarkdownEditorProps
>(function MarkdownEditor({ markdown, onChange }, ref) {
  const editorRef = useRef<MDXEditorMethods>(null);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => editorRef.current?.getMarkdown() ?? "",
    setMarkdown: (md: string) => editorRef.current?.setMarkdown(md),
    focus: () => editorRef.current?.focus(),
  }));

  return (
    <MDXEditor
      ref={editorRef}
      markdown={markdown}
      onChange={onChange}
      contentEditableClassName="prose dark:prose-invert max-w-none min-h-[400px] p-4"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin({ imageUploadHandler }),
        diffSourcePlugin({ viewMode: "rich-text" }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <BoldItalicUnderlineToggles />
              <Separator />
              <ListsToggle />
              <Separator />
              <BlockTypeSelect />
              <Separator />
              <CreateLink />
              <InsertImage />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
});
