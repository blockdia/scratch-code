import type {AstNode, Block, Field, Input, Script} from "./types.js"

/** Location of a node in a walk. The root has a null parent and key. */
export interface WalkContext {
  parent: AstNode | null
  key: string | null
  index?: number
  depth: number
}

export interface WalkVisitor {
  enter(node: AstNode, context: WalkContext): void
  leave?(node: AstNode, context: WalkContext): void
}

const hasKind = (value: unknown, kind: AstNode["kind"]): boolean =>
  typeof value === "object" && value !== null && "kind" in value && value.kind === kind

export const isScript = (node: unknown): node is Script =>
  hasKind(node, "script")

export const isBlock = (node: unknown): node is Block => hasKind(node, "block")

export const isInput = (node: unknown): node is Input => hasKind(node, "input")

export const isField = (node: unknown): node is Field => hasKind(node, "field")

/** Return direct AST children in the same order used by {@link walk}. */
export const getChildren = (node: AstNode): AstNode[] => {
  switch (node.kind) {
    case "script":
      return [...node.blocks]
    case "block":
      return [...Object.values(node.fields), ...Object.values(node.inputs)]
    case "input":
      return node.type === "block" || node.type === "script" ? [node.value] : []
    case "field":
      return []
  }
}

/**
 * Walk an AST depth-first. Metadata and semantic mutations are annotations, not
 * nodes, and are deliberately excluded.
 */
export const walk = (root: AstNode, visitor: WalkVisitor): void => {
  const visit = (node: AstNode, context: WalkContext): void => {
    visitor.enter(node, context)

    switch (node.kind) {
      case "script":
        node.blocks.forEach((block, index) => {
          visit(block, {
            parent: node,
            key: "blocks",
            index,
            depth: context.depth + 1,
          })
        })
        break
      case "block":
        for (const [key, field] of Object.entries(node.fields)) {
          visit(field, {
            parent: node,
            key,
            depth: context.depth + 1,
          })
        }
        for (const [key, input] of Object.entries(node.inputs)) {
          visit(input, {
            parent: node,
            key,
            depth: context.depth + 1,
          })
        }
        break
      case "input":
        if (node.type === "block" || node.type === "script") {
          visit(node.value, {
            parent: node,
            key: "value",
            depth: context.depth + 1,
          })
        }
        break
      case "field":
        break
    }

    visitor.leave?.(node, context)
  }

  visit(root, {parent: null, key: null, depth: 0})
}
