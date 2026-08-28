# @scratch-code/scratchblocks-codec

Convert syntax trees from [`scratchblocks-plus`](https://www.npmjs.com/package/scratchblocks-plus)
to and from the semantic tree-shaped AST from `@scratch-code/ast`.

```ts
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import {
  deserializeScratchblocks,
  serializeScratchblocks,
} from '@scratch-code/scratchblocks-codec';
import { parse } from 'scratchblocks-plus/syntax';

const registry = createTurboWarpBlockRegistry();
const document = parse('move (10) steps', { languages: ['en'] });
const scripts = deserializeScratchblocks(document, registry);
const rebuilt = serializeScratchblocks(scripts, registry);

rebuilt.stringify(); // "move (10) steps"
```

Both directions require a block-spec registry. The registry supplies semantic
input and field types, menu-shadow defaults, ordered arguments, explicit syntax
bindings, and block shapes. The codec uses `scratchblocks-plus/syntax`; it does
not require a DOM, canvas implementation, or renderer.

## Type conversion

Scratchblocks input shapes are intentionally permissive. The default `loose`
mode converts scalar values to the type required by the registry. Numeric text
is preserved as text, so values such as `0010` remain intact. A scalar in a
boolean slot becomes an empty input because the semantic AST has no boolean
literal. Nested blocks are retained rather than coerced into literals.

Use `{coercion: "strict"}` in either direction to reject incompatible scalar
or statement shapes instead.

Dropdown children are interpreted using the spec:

- field slots become semantic fields;
- value slots with a menu-shadow default become a nested menu block;
- static option labels are converted back to their canonical Scratch values.

## Languages and children

Serialization starts with scratchblocks-plus's built-in English language. A
BlockSpec's ordered `arguments` and explicit `bindings.scratchblocks.blockId`
construct a minimal English pivot block containing only semantic children—
fields, inputs, nested blocks, and scripts. It then calls `Block.translate()`,
allowing scratchblocks-plus to rebuild labels, icons, RTL layout, and localized
child ordering. The codec does not read raw `blockJson.args*` and does not use
English message matching as its primary identity mechanism.

Pass a loaded `LanguageData` object as `language` to produce another language.
Blocks not registered in the English scratchblocks language table cannot be
reconstructed merely from a translation key and produce an explicit metadata
error.

## Custom procedures

Definitions are indexed before calls, including forward references. Procedure
argument IDs are deterministic and shared by matching definitions and calls.
Pass `createProcedureArgumentId` to choose another ID scheme.

Scratchblocks syntax does not contain Scratch 3 prototype defaults or warp
state. New mutations therefore use Scratch 3-compatible defaults:

- `%n` and `%s`: `""`
- `%b`: `false`
- `warp`: `false`

## Preserved scratchblocks metadata

Comments, diff markers, and glow wrappers are stored under versioned
`metadata.scratchblocks` and restored when serializing. Script metadata only
permits glow; Block metadata permits comment, diff, and glow. Use
`getScratchblocksScriptMetadata()` and `getScratchblocksBlockMetadata()` for
typed access. Ordinary labels and icons are rebuilt and are not copied into
semantic metadata.

Scratchblocks ASTs do not carry workspace coordinates or variable, list, and
broadcast IDs. Those values are not invented. This package provides semantic
round-tripping, not byte-for-byte SB3 preservation.

## Tests

The test suite includes reproducible block-graph fragments extracted from
these local corpus projects:

- `ASCII Key Detector.sb3`
- `Tile Based Game Tutorial Part 1.sb3`
- `Interactive Bézier Curve.sb3`

The fixtures exercise SB3 → scratch-code → scratchblocks → scratch-code for
variables/lists, nested boolean reporters and custom arguments, and broadcast
menu shadows without requiring the external corpus directory in CI.

## License

MIT
