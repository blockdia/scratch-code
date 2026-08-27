import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"
import {parse} from "scratchblocks-plus/syntax"

import {deserializeScratchblocks, serializeScratchblocks} from "../dist/index.js"

const registry = createTurboWarpBlockRegistry()
const scripts = deserializeScratchblocks(parse("move (10) steps", {languages: ["en"]}), registry)
const result = serializeScratchblocks(scripts, registry)

if (result.stringify() !== "move (10) steps") {
  throw new Error("scratchblocks-codec ESM smoke test failed")
}
