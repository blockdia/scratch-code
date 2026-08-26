import assert from "node:assert/strict"

import {isScript, walk} from "@scratch-code/ast"

const script = {kind: "script", blocks: []}
let visits = 0

walk(script, {
  enter() {
    visits += 1
  },
})

assert.equal(isScript(script), true)
assert.equal(visits, 1)
