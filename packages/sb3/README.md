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

The converter does not generate block IDs or synthesize shadow blocks. New
non-primitive blocks therefore need `metadata.scratch.id`. SB3-only encoding
details, obscured shadows, and disconnected components are retained under
`metadata.scratch.sb3`; there is no separate raw wrapper.

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
reported and skipped. Legacy `[1, null]` inputs are normalized to omitted keys
before comparison.

## License

MIT
