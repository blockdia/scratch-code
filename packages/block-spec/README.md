# @scratch-code/block-spec

Semantic Scratch block specifications and an extensible registry. A spec
describes the connections a block exposes and the initial content used to draw
empty slots. It does not describe a block instance's current contents.

```ts
import {
  createBlockSpecRegistry,
  type BlockSpec,
} from "@scratch-code/block-spec"

const moveSteps: BlockSpec = {
  opcode: "motion_movesteps",
  shape: "command",
  inputs: {
    STEPS: {
      connection: "value",
      accepts: "number",
      default: {
        kind: "input",
        type: "number",
        value: 10,
        metadata: {scratch: {numericKind: "number"}},
      },
    },
  },
  fields: {},
}

const registry = createBlockSpecRegistry()
registry.register(moveSteps)
registry.get("motion_movesteps") // moveSteps
```

## Connections and defaults

`connection` preserves the distinction between a value slot and a statement
slot. `accepts` is a semantic constraint on a value slot; it is deliberately
different from `Input.type` in `@scratch-code/ast`, which describes the content
currently occupying a slot.

Defaults use AST `Input` nodes. Scalar shadows therefore retain details such as
`metadata.scratch.numericKind`, while menu shadows can be represented by a
complete `BlockInput` containing their opcode and fields. A statement slot may
also have a `BlockInput` default, as used by a procedure definition's prototype.

`metadata.scratchBlocks.blockJson` is available on specs, inputs, and fields for
JSON-safe Scratch Blocks source details which are not part of the semantic API.

Hat blocks distinguish the curved, event-style hat from the flat procedure
definition hat:

```ts
const definition: BlockSpec = {
  opcode: "procedures_definition",
  shape: "hat",
  hatStyle: "define",
  inputs: {custom_block: {connection: "statement"}},
  fields: {},
}
```

## Dynamic specs

Every registry entry has a stable base spec and may have a resolver. `get`
always returns the base; `resolve` returns the context-dependent final spec.
The context contains only semantic information chosen by the consumer. Turning
an AST block into that context belongs in a converter or adapter package.

```ts
type StopContext = {hasNext: boolean}

const registry = createBlockSpecRegistry<StopContext>()
registry.register(baseStopSpec, (base, context) => ({
  ...base,
  shape: context.hasNext ? "command" : "terminal",
}))

registry.get("control_stop") // stable baseStopSpec
registry.resolve("control_stop", {hasNext: false}) // terminal final spec
```

Resolvers run for every `resolve` call and must return the registered opcode.
Use `replace` when intentionally replacing both a base spec and its resolver.

## SB3 boundary

A future SB3 adapter can combine a resolved spec with an AST block. The spec
provides connection requirements and default shadows; the AST provides current
values, IDs, mutations, and source metadata. The adapter remains responsible
for SB3 primitive codes, generated IDs, and parent/next/input relationships.

This package intentionally contains no built-in block definitions, global
registry, SB3 adapter, or AST-to-context extractor.
