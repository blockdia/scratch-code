# @scratch-code/materialize

Complete a partial Scratch AST from block specs without mutating the input.
The package inserts default shadows, preserves connected values as mode 3
inputs, and assigns Scratch VM-compatible IDs to every block, including menu
and procedure shadows.

```ts
import {materializeScripts} from "@scratch-code/materialize"
import {
  createTurboWarpBlockRegistry,
  getTurboWarpBlockResolveContext,
} from "@scratch-code/turbowarp-blocks"

const registry = createTurboWarpBlockRegistry()
const complete = materializeScripts(scripts, registry, {
  contextForBlock: (block, {hasNext}) =>
    getTurboWarpBlockResolveContext(block, hasNext),
})
```

`contextForBlock` is required because a `BlockSpecRegistry` may contain dynamic
entries. The callback receives the current cloned block after its ID has been
assigned and whether another block follows it in the same stack. Missing specs
and invalid dynamic contexts remain explicit registry errors.

Missing and empty declared inputs use their spec default. An existing hidden
shadow on an empty input is promoted first. Connected block or script values
receive the default as `obscuredShadow`; literals are already shadows. A block
matching a block default is marked with `shadow: true`. Existing fields,
metadata, mutations, undeclared inputs, and hidden shadows are retained.

Existing non-empty IDs are preserved. Duplicate existing IDs, generator
collisions, and invalid generated IDs throw rather than silently rewriting
identity. Pass `generateBlockId` for deterministic tests or another ID policy.
Variable, list, and broadcast field IDs are outside this package's scope.

## License

MIT
