import type { Root } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that transforms mermaid code blocks into Mermaid JSX components.
 * This allows using standard markdown code fences with the mermaid language.
 */
export const remarkMermaid = () => {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || index === undefined || !parent) {
        return;
      }

      // Replace the code node with an MDX JSX element
      const mermaidNode = {
        type: "mdxJsxFlowElement" as const,
        name: "Mermaid",
        attributes: [
          {
            type: "mdxJsxAttribute" as const,
            name: "chart",
            value: node.value,
          },
        ],
        children: [],
      };

      parent.children[index] = mermaidNode;
    });
  };
};
