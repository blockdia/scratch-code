# @scratch-code/sb3

Convert a serialized Scratch 3 target's `blocks` object to and from the
tree-shaped AST from `@scratch-code/ast`.

```ts
import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"
import {deserializeBlocks, serializeBlocks} from "@scratch-code/sb3"

const registry = createTurboWarpBlockRegistry()
const scripts = deserializeBlocks(target.blocks, registry)
target.blocks = serializeBlocks(scripts)
```

Deserialization requires a block-spec registry. Missing inputs declared by a
spec become `EmptyInput` nodes; spec defaults are never inserted. Serialization
omits every `EmptyInput` key, matching current TurboWarp output.

The converter does not generate block IDs. New non-primitive blocks therefore
need `metadata.scratch.id`. A Script is an independent stack or expression tree,
not an alias for SB3 `topLevel: true`; filtering or cloning the returned
`Script[]` does not depend on another Script.

Mode 3 fallback shadows are first-class `Input.obscuredShadow` values. Object
scalar shadow IDs use `Input.metadata.scratch.id`. Minimal SB3-only provenance
lives under versioned `metadata.sb3`; use
`getSb3ScriptMetadata()`, `getSb3BlockMetadata()`,
and `getSb3FieldMetadata()` instead of reading magic keys. The codec never
stores the complete target blocks map or raw block/input/
field snapshots. `metadata.scratch` remains limited to stable IDs, coordinates,
and numeric kinds.

Non-scalar shadow identity is represented by the codec-independent
`Block.shadow` flag. `metadata.sb3` does not represent block shadow identity.

Serialization is canonical: empty inputs, including legacy `[1, null]`, are
omitted; procedure mutations are synthesized from semantic mutations; and an
input whose current content is itself a shadow is not duplicated as a fallback.
Shared blocks, cycles, contradictory parent links, and structurally invalid
connections throw `InvalidBlockGraphError`.

Only `target.blocks` is in scope. This package does not read ZIP archives,
convert assets, inspect other target properties, validate opcodes beyond the
provided registry, execute blocks, or render code.

## Corpus audit

After building the workspace, an external directory of `.sb3` projects can be
checked with:

```sh
pnpm --filter @scratch-code/sb3 test:corpus -- /path/to/projects
```

Projects containing opcodes missing from the TurboWarp block registry are
reported and skipped. Malformed targets are reported as rejected. Supported
targets must preserve semantic AST across the first canonicalization, and the
second canonical serialization must be stable. The audit also reports source,
semantic AST, full AST, and codec-provenance byte totals.

## License

MIT
