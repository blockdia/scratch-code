import assert from "node:assert/strict"

import {createBlockSpecRegistry} from "@scratch-code/block-spec"
import {deserializeSb3Blocks, serializeSb3Blocks} from "@scratch-code/sb3"

const registry = createBlockSpecRegistry()
registry.register({
  opcode: "event_whenflagclicked",
  shape: "hat",
  hatStyle: "standard",
  inputs: {},
  fields: {},
})

const blocks = {
  event: {
    opcode: "event_whenflagclicked",
    next: null,
    parent: null,
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: true,
    x: 0,
    y: 0,
  },
}

assert.deepEqual(serializeSb3Blocks(deserializeSb3Blocks(blocks, registry)), blocks)
