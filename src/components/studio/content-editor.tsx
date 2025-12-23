"use client";

import type { RefObject } from "react";
import { useImperativeHandle, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownEditor, type MarkdownEditorMethods } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";

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

type ViewMode = "source" | "preview" | "split";

export function ContentEditor({
  markdown,
  onChange,
  editorRef,
}: ContentEditorProps) {
  const innerRef = useRef<MarkdownEditorMethods>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  useImperativeHandle(editorRef, () => ({
    getMarkdown: () => innerRef.current?.getMarkdown() ?? markdown,
    setMarkdown: (md: string) => innerRef.current?.setMarkdown(md),
    focus: () => innerRef.current?.focus(),
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="split">Split</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === "source" && (
          <MarkdownEditor
            ref={innerRef}
            markdown={markdown}
            onChange={onChange}
          />
        )}

        {viewMode === "preview" && <MarkdownPreview markdown={markdown} />}

        {viewMode === "split" && (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-auto">
                <MarkdownEditor
                  ref={innerRef}
                  markdown={markdown}
                  onChange={onChange}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <MarkdownPreview markdown={markdown} />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
