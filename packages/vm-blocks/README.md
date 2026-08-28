# @scratch-code/vm-blocks

Convert Scratch VM's hydrated runtime block array to and from the semantic AST
from `@scratch-code/ast`.

## Installation

```sh
npm install @scratch-code/vm-blocks @scratch-code/turbowarp-blocks
```

This package is ESM-only and requires Node.js 22 or newer. A block-spec
registry is supplied by the caller; the example below uses the TurboWarp
catalog.

```ts
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import { deserializeVmBlocks, serializeVmBlocks } from '@scratch-code/vm-blocks';

const registry = createTurboWarpBlockRegistry();
const scripts = deserializeVmBlocks(Object.values(target.blocks._blocks), registry);

await vm.shareBlocksToTarget(serializeVmBlocks(scripts), destination.id);
```

`deserializeVmBlocks()` accepts the properties produced by
`Object.values(target.blocks._blocks)` and also tolerates defaults omitted from
the minimal objects accepted by `shareBlocksToTarget`. Missing block specs remain
explicit registry errors. The package parses and validates the VM graph directly;
it does not depend on the SB3 codec.

`serializeVmBlocks()` emits complete block, input, and field objects. It derives
`parent`, `next`, `topLevel`, input ownership, shadow flags, field `name`, and
`variableType` from the AST. Empty inputs are omitted. Redundant omitted/null
details are canonicalized rather than preserved byte-for-byte. Input array order
only determines the stable order of disconnected root Scripts and is otherwise
not semantic.

An input shadow edge can infer an omitted block `shadow` flag, but never overrides
an explicit value. A conflicting explicit flag throws `InvalidVmBlocksError`.
Only primitive literal shadow blocks (number, text, color, matrix, and note) fold
into scalar AST inputs; variable, list, broadcast, and menu reporters remain
normal AST Blocks.

## Identity and metadata

Every runtime block must already have a unique non-empty ID. Semantic blocks and
menu/reporter blocks use `Block.metadata.scratch.id`; scalar string, number,
color, matrix, and note inputs use `Input.metadata.scratch.id`. Missing IDs and
duplicates throw. The serializer never creates IDs or mutates its input. The VM
will replace these IDs when `shareBlocksToTarget` imports the array.

Procedure mutations use the AST's semantic mutation model. Raw extension and
legacy mutations plus block comment IDs live in versioned `metadata.vmBlocks`;
use `getVmBlocksBlockMetadata()` instead of reading the namespace directly.
This package-owned metadata contains only `version`, an optional raw mutation,
and an optional comment ID; it never stores a complete VM block snapshot. Field
values remain arbitrary JSON values so historical VM data is not coerced to text.

The package only converts blocks. Extension URL wrappers, variables, lists,
broadcast declarations, target comments, assets, and target state remain the
caller's responsibility.

## Scratch VM validation

After building the workspace, validate against the pinned local VM checkout:

```sh
pnpm --filter @scratch-code/vm-blocks test:vm -- /path/to/scratch-vm
```

An external SB3 corpus can be audited with:

```sh
pnpm --filter @scratch-code/vm-blocks test:corpus -- /path/to/scratch-vm /path/to/sb3-projects
```

Projects requiring block specs absent from the TurboWarp registry are reported
and skipped rather than guessed.

## License

MIT
