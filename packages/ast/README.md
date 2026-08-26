# @scratch-code/ast

A small, tree-shaped, JSON-serializable AST for Scratch code. It models block
content rather than the flat ID graph used by SB3 or rendering-oriented syntax
trees.

```ts
import type {Script} from "@scratch-code/ast"
import {walk} from "@scratch-code/ast"

const script: Script = {
  kind: "script",
  blocks: [
    {
      kind: "block",
      opcode: "motion_movesteps",
      fields: {},
      inputs: {
        STEPS: {
          kind: "input",
          type: "number",
          value: "0010",
          metadata: {scratch: {numericKind: "number"}},
        },
      },
    },
  ],
  metadata: {scratch: {x: 32, y: 48}},
}

walk(script, {
  enter(node) {
    if (node.kind === "block") console.log(node.opcode)
  },
})
```

## Scratch alignment

- Canonical Scratch opcodes remain open strings so extension blocks are valid.
- Scalar shadow blocks are represented as literals. Numeric shadow variants are
  recorded non-semantically as `metadata.scratch.numericKind`.
- Menu shadows remain blocks; only Scratch fields use `type: "dropdown"`.
- Boolean inputs contain a reporter block or are explicitly empty. There is no
  boolean literal input.
- Workspace coordinates belong to the top-level `Script`, while source block IDs
  belong to individual `Block` nodes.

Procedure mutations are normalized as either `procedure-prototype` or
`procedure-call`. Prototype argument ID, name, and default arrays are parallel
and must have matching lengths. Call argument IDs correspond to the call block's
input keys, and `returnType` distinguishes statement, reporter, and boolean calls.

The package does not validate opcodes, execute blocks, render blocks, or convert
SB3 files. Hidden/obscured shadows and unsupported raw mutations may be retained
under `metadata.scratch.sb3` by converter packages.
