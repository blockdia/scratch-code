import type {Block, Field, Input, JsonObject, Script} from "@scratch-code/ast"

import type {
  Sb3BlockMetadata,
  Sb3FieldMetadata,
  Sb3InputMetadata,
  Sb3ScriptMetadata,
} from "./types.js"

const metadataFor = (node: Script | Block | Input | Field): JsonObject | undefined => {
  const value = node.metadata?.["sb3"]
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  return record["version"] === 1 ? value as JsonObject : undefined
}

export const getSb3ScriptMetadata = (node: Script): Sb3ScriptMetadata | undefined =>
  metadataFor(node) as Sb3ScriptMetadata | undefined

export const getSb3BlockMetadata = (node: Block): Sb3BlockMetadata | undefined =>
  metadataFor(node) as Sb3BlockMetadata | undefined

export const getSb3InputMetadata = (node: Input): Sb3InputMetadata | undefined =>
  metadataFor(node) as Sb3InputMetadata | undefined

export const getSb3FieldMetadata = (node: Field): Sb3FieldMetadata | undefined =>
  metadataFor(node) as Sb3FieldMetadata | undefined
