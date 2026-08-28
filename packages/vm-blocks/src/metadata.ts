import type {Block} from "@scratch-code/ast"

import type {VmBlocksBlockMetadata} from "./types.js"

export const getVmBlocksBlockMetadata = (
  block: Readonly<Block>,
): VmBlocksBlockMetadata | undefined => {
  const value = block.metadata?.["vmBlocks"]
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  return (value as Record<string, unknown>)["version"] === 1
    ? value as VmBlocksBlockMetadata
    : undefined
}
