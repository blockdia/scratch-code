import type {Block, JsonObject, Script} from "@scratch-code/ast"

import type {ScratchblocksBlockMetadata, ScratchblocksScriptMetadata} from "./types.js"

const metadataFor = (node: Script | Block): JsonObject | undefined => {
  const value = node.metadata?.["scratchblocks"]
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  return record["version"] === 1 ? value as JsonObject : undefined
}

export const getScratchblocksScriptMetadata = (
  node: Script,
): ScratchblocksScriptMetadata | undefined =>
  metadataFor(node) as ScratchblocksScriptMetadata | undefined

export const getScratchblocksBlockMetadata = (
  node: Block,
): ScratchblocksBlockMetadata | undefined =>
  metadataFor(node) as ScratchblocksBlockMetadata | undefined
