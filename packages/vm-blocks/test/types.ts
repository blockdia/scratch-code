import type {JsonObject} from "@scratch-code/ast"

import type {
  VmBlock,
  VmBlockField,
  VmBlockInput,
  VmBlocksBlockMetadata,
  VmVariableType,
} from "../src/index.js"

const input: VmBlockInput = {name: "VALUE", block: "child", shadow: null}
const field: VmBlockField = {name: "VALUE", value: ["legacy", {valid: true}]}
const variableType: VmVariableType = "broadcast_msg"
const metadata: VmBlocksBlockMetadata = {
  version: 1,
  mutation: {tagName: "mutation", children: []} satisfies JsonObject,
}

// @ts-expect-error VM metadata is deliberately minimal and never stores block snapshots.
const invalidMetadata: VmBlocksBlockMetadata = {version: 1, block: {id: "snapshot"}}
const block: VmBlock = {
  id: "block",
  opcode: "extension_example",
  inputs: {VALUE: input},
  fields: {VALUE: field},
  mutation: metadata.mutation!,
}

// @ts-expect-error VM fields must remain JSON-safe.
const invalidField: VmBlockField = {value: undefined}

// @ts-expect-error Runtime variable types are a closed Scratch VM set.
const invalidVariableType: VmVariableType = "scalar"

void [block, variableType, metadata, invalidMetadata, invalidField, invalidVariableType]
