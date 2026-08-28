import assert from "node:assert/strict"
import {createTurboWarpBlockRegistry, turboWarpBlockSpecs} from "../dist/index.js"

assert.equal(turboWarpBlockSpecs.length, 294)
assert.equal(createTurboWarpBlockRegistry().size, 294)
assert.equal(createTurboWarpBlockRegistry().require("tw_getButtonIsDown").shape, "boolean")
assert.equal(createTurboWarpBlockRegistry().require("music_getTempo").outputType, "number")
