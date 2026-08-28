# @scratch-code/turbowarp-blocks

TurboWarp-compatible block specifications for `@scratch-code/block-spec`.
The package contains 169 serializable definitions extracted from the
TurboWarp `scratch-blocks` fork at revision
`7c58de666658df1bb447d010132aa3914c10f41e`.

```ts
import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"

const registry = createTurboWarpBlockRegistry()
registry.get("motion_movesteps")
registry.resolve("control_stop", {kind: "control-stop", hasNext: true})
```

Category arrays and the aggregate `turboWarpBlockSpecs` are read-only catalog
data. The factory creates a new registry on every call; the package does not
export shared mutable registry state.

Every definition exposes language-independent ordered `arguments`, an explicit
scratchblocks-plus block binding when the block has a textual command identity,
and separate `source.scratchBlocks` provenance. Runtime codecs do not depend on
the generated raw Scratch Blocks `args*` data.

## Dynamic definitions

`control_stop`, `procedures_call`, and `procedures_prototype` require a minimal
`TurboWarpBlockResolveContext`. Static definitions can be resolved with
`undefined`. A dynamic definition given missing or mismatched context throws
`InvalidTurboWarpBlockContextError` rather than silently returning its base.

The base specs remain stable. Extracting these contexts from an AST belongs in
a converter or SB3 adapter and is intentionally not part of this package.

## Source audit

The committed `source-manifest.json` records each opcode's source file, input
connections, raw field types, and whether it is dynamic. To audit it against a
local checkout at the pinned revision:

```sh
pnpm build
pnpm --filter @scratch-code/turbowarp-blocks audit:scratch-blocks -- /path/to/scratch-blocks
```

The catalog excludes `procedures_declaration`, the two `argument_editor_*`
editor-only blocks, and the demonstration `extension_*` definitions. It does
not include an SB3 adapter, AST-to-context extractor, workspace menu contents,
or external extension definitions.

## License

This package is licensed under GPL-3.0-only because its catalog is derived from
TurboWarp's GPL-licensed `scratch-blocks` source. The package does not import or
bundle `scratch-blocks` or `scratch-vm` runtime code. Other packages in this
monorepo keep their own licenses.
