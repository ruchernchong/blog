"use client";

import { Tabs } from "@heroui/react";
import { Resizable } from "@heroui-pro/react";
import type { RefObject } from "react";
import { useImperativeHandle, useRef, useState } from "react";
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
          selectedKey={viewMode}
          onSelectionChange={(key) => setViewMode(key as ViewMode)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Editor view mode">
              <Tabs.Tab id="source">
                Source
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="split">
                Split
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="preview">
                Preview
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
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
          <Resizable orientation="horizontal" className="h-full">
            <Resizable.Panel defaultSize={50} minSize={30}>
              <div className="h-full overflow-auto">
                <MarkdownEditor
                  ref={innerRef}
                  markdown={markdown}
                  onChange={onChange}
                />
              </div>
            </Resizable.Panel>
            <Resizable.Handle withIndicator />
            <Resizable.Panel defaultSize={50} minSize={30}>
              <MarkdownPreview markdown={markdown} />
            </Resizable.Panel>
          </Resizable>
        )}
      </div>
    </div>
  );
}
