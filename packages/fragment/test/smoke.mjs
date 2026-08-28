import assert from "node:assert/strict"

import {analyzeScripts, createScratchFragment} from "../dist/index.js"

const scripts = [{
  kind: "script",
  blocks: [{kind: "block", opcode: "unknownExtension_run", inputs: {}, fields: {}}],
}]

assert.deepEqual(analyzeScripts(scripts).extensions, ["unknownExtension"])
assert.equal(createScratchFragment(scripts).version, 1)
