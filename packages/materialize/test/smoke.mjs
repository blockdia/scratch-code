import assert from "node:assert/strict"
import {createBlockSpecRegistry} from "@scratch-code/block-spec"
import {materializeScripts} from "../dist/index.js"

const registry = createBlockSpecRegistry()
registry.register({
  opcode: "example",
  shape: "command",
  inputs: {VALUE: {connection: "value", accepts: "number", default: {kind: "input", type: "number", value: 10}}},
  fields: {},
  arguments: [{kind: "input", name: "VALUE"}],
})

let nextId = 0
const result = materializeScripts([
  {kind: "script", blocks: [{kind: "block", opcode: "example", inputs: {}, fields: {}}]},
], registry, {
  contextForBlock: () => undefined,
  generateBlockId: () => nextId++ === 0 ? "block-id" : `shadow-${nextId}`,
})

assert.equal(result[0].blocks[0].metadata.scratch.id, "block-id")
assert.equal(result[0].blocks[0].inputs.VALUE.value, 10)
