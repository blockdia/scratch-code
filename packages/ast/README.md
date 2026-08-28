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
          obscuredShadow: {
            kind: "input",
            type: "number",
            value: "10",
          },
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
- Scalar shadow blocks are represented as literals. Their source block identity
  can be recorded as `metadata.scratch.id`; numeric shadow variants are recorded
  non-semantically as `metadata.scratch.numericKind`.
- Menu and other non-scalar shadows remain blocks with `shadow: true`; only
  Scratch fields use `type: "dropdown"`.
- A mode 3 fallback hidden by a connected value lives on that Input as
  `obscuredShadow`; it moves and clones with the Input. If the current value is
  itself the shadow, it is stored only as the current value.
- Boolean inputs contain a reporter block or are explicitly empty. There is no
  boolean literal input.
- Workspace coordinates belong to the top-level `Script`. Source block IDs
  belong to individual `Block` nodes and scalar inputs normalized from VM
  shadow blocks.

Procedure mutations are normalized as either `procedure-prototype` or
`procedure-call`. Prototype argument ID, name, and default arrays are parallel
and must have matching lengths. Call argument IDs correspond to the call block's
input keys, and `returnType` distinguishes statement, reporter, and boolean calls.

The package does not validate opcodes, execute blocks, render blocks, or convert
SB3 files. Stable annotations under `metadata.scratch` are limited to source block IDs,
script coordinates, and numeric shadow kinds. Codec namespaces such as
`metadata.sb3` and `metadata.scratchblocks` are owned and typed by their codec
packages.

`Field.value` is a `JsonValue`. Scratch normally uses strings, but imported
projects and the VM can retain JSON arrays or objects in historical field data;
text-only consumers should convert values at their own boundary.

`JsonValue` describes the JSON data model, but TypeScript cannot prove that a
number is finite. Use `isJsonValue()` or `assertJsonValue()` at untrusted
boundaries; missing object properties should be omitted rather than represented
as array `undefined` values.
