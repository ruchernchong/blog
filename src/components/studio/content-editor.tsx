"use client";

import type { RefObject } from "react";
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
  editorRef?: RefObject<ContentEditorMethods | null>;
}

export function ContentEditor({
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
    <MarkdownEditor ref={innerRef} markdown={markdown} onChange={onChange} />
  );
}
