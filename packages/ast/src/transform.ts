import type {
  AstNode,
  Block,
  Field,
  Input,
  ObscuredShadow,
  Script,
} from "./types.js"
import type {WalkContext} from "./traversal.js"

/** Location of a node in a transform. It has the same shape as {@link WalkContext}. */
export type TransformContext = WalkContext

/** A bottom-up AST transformer. Returning `undefined` keeps the visited node. */
export interface TransformVisitor {
  leave(node: AstNode, context: TransformContext): AstNode | void
}

const invalidReplacement = (from: AstNode, to: unknown): never => {
  const replacementKind =
    typeof to === "object" && to !== null && "kind" in to
      ? String(to.kind)
      : typeof to
  throw new TypeError(
    `Cannot replace ${from.kind} node with ${replacementKind} node`,
  )
}

const isObscuredShadow = (input: Input): input is ObscuredShadow =>
  input.type !== "empty" && input.type !== "script"

const transformScriptChildren = (
  script: Script,
  context: TransformContext,
  visitor: TransformVisitor,
): Script => {
  let blocks = script.blocks

  script.blocks.forEach((block, index) => {
    const transformed = transformNode(block, {
      parent: script,
      key: "blocks",
      index,
      depth: context.depth + 1,
    }, visitor)
    if (transformed === block) return
    if (blocks === script.blocks) blocks = [...script.blocks]
    blocks[index] = transformed
  })

  return blocks === script.blocks ? script : {...script, blocks}
}

const transformBlockChildren = (
  block: Block,
  context: TransformContext,
  visitor: TransformVisitor,
): Block => {
  let fields = block.fields
  for (const [key, field] of Object.entries(block.fields)) {
    const transformed = transformNode(field, {
      parent: block,
      key,
      depth: context.depth + 1,
    }, visitor)
    if (transformed === field) continue
    if (fields === block.fields) fields = {...block.fields}
    fields[key] = transformed
  }

  let inputs = block.inputs
  for (const [key, input] of Object.entries(block.inputs)) {
    const transformed = transformNode(input, {
      parent: block,
      key,
      depth: context.depth + 1,
    }, visitor)
    if (transformed === input) continue
    if (inputs === block.inputs) inputs = {...block.inputs}
    inputs[key] = transformed
  }

  return fields === block.fields && inputs === block.inputs
    ? block
    : {...block, fields, inputs}
}

const transformInputChildren = (
  input: Input,
  context: TransformContext,
  visitor: TransformVisitor,
): Input => {
  let transformed: Input = input

  if (input.type === "block") {
    const value = transformNode(input.value, {
      parent: input,
      key: "value",
      depth: context.depth + 1,
    }, visitor)
    if (value !== input.value) transformed = {...input, value}
  } else if (input.type === "script") {
    const value = transformNode(input.value, {
      parent: input,
      key: "value",
      depth: context.depth + 1,
    }, visitor)
    if (value !== input.value) transformed = {...input, value}
  }

  if (input.obscuredShadow !== undefined) {
    const obscuredShadow = transformNode(input.obscuredShadow, {
      parent: input,
      key: "obscuredShadow",
      depth: context.depth + 1,
    }, visitor)
    if (!isObscuredShadow(obscuredShadow)) {
      throw new TypeError("An obscuredShadow must remain a scalar or block input")
    }
    if (obscuredShadow !== input.obscuredShadow) {
      transformed = {...transformed, obscuredShadow}
    }
  }

  return transformed
}

function transformNode(
  node: Script,
  context: TransformContext,
  visitor: TransformVisitor,
): Script
function transformNode(
  node: Block,
  context: TransformContext,
  visitor: TransformVisitor,
): Block
function transformNode(
  node: Input,
  context: TransformContext,
  visitor: TransformVisitor,
): Input
function transformNode(
  node: Field,
  context: TransformContext,
  visitor: TransformVisitor,
): Field
function transformNode(
  node: AstNode,
  context: TransformContext,
  visitor: TransformVisitor,
): AstNode {
  let transformed: AstNode
  switch (node.kind) {
    case "script":
      transformed = transformScriptChildren(node, context, visitor)
      break
    case "block":
      transformed = transformBlockChildren(node, context, visitor)
      break
    case "input":
      transformed = transformInputChildren(node, context, visitor)
      break
    case "field":
      transformed = node
      break
  }

  const replacement = visitor.leave(transformed, context)
  if (replacement === undefined) return transformed
  if (
    typeof replacement !== "object" ||
    replacement === null ||
    replacement.kind !== node.kind
  ) invalidReplacement(node, replacement)
  return replacement
}

/**
 * Immutably transform scripts depth-first and bottom-up.
 *
 * Child replacements are installed before their parent is passed to `leave`.
 * Context parents refer to nodes in the input tree, matching {@link walk}.
 * Metadata and semantic mutations remain ordinary properties and are not
 * visited separately. Deletion is deliberately unsupported because every
 * structural position represented by an AST node requires a node.
 */
export const transformScripts = (
  scripts: readonly Script[],
  visitor: TransformVisitor,
): Script[] => scripts.map(script => transformNode(script, {
  parent: null,
  key: null,
  depth: 0,
}, visitor))
