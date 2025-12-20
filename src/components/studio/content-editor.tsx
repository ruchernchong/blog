"use client";

import type { MutableRefObject } from "react";
import { useImperativeHandle, useRef } from "react";
import { MarkdownEditor, type MarkdownEditorMethods } from "./markdown-editor";

export interface ContentEditorMethods {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
}

interface ContentEditorProps {
  markdown: string;
  onChange?: (markdown: string) => void;
  editorRef?: MutableRefObject<ContentEditorMethods | null>;
}

export default function ContentEditor({
  markdown,
  onChange,
  editorRef,
}: ContentEditorProps) {
  const innerRef = useRef<MarkdownEditorMethods>(null);

  useImperativeHandle(editorRef, () => ({
    getMarkdown: () => innerRef.current?.getMarkdown() ?? markdown,
    setMarkdown: (md: string) => innerRef.current?.setMarkdown(md),
    focus: () => innerRef.current?.focus(),
  }));

  return (
    <div className="flex h-full flex-col">
      <MarkdownEditor ref={innerRef} markdown={markdown} onChange={onChange} />
    </div>
  );
}
