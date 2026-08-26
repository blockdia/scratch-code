import assert from "node:assert/strict"
import {createTurboWarpBlockRegistry, turboWarpBlockSpecs} from "../dist/index.js"

assert.equal(turboWarpBlockSpecs.length, 169)
assert.equal(createTurboWarpBlockRegistry().size, 169)
