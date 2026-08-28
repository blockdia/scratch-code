# @scratch-code/turbowarp-blocks

TurboWarp-compatible block specifications for `@scratch-code/block-spec`.
The package contains 294 serializable definitions: 169 extracted from the
TurboWarp `scratch-blocks` fork at revision
`7c58de666658df1bb447d010132aa3914c10f41e`, plus 125 block and reporter-menu
definitions from the built-in extensions at `scratch-vm` revision
`96ed93bbb5c405b7bf48f673a379f1c595672373`.

```ts
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';

const registry = createTurboWarpBlockRegistry();
registry.get('motion_movesteps');
registry.resolve('control_stop', { kind: 'control-stop', hasNext: true });
```

Category arrays and the aggregate `turboWarpBlockSpecs` are read-only catalog
data. The factory creates a new registry on every call; the package does not
export shared mutable registry state.

The built-in extension arrays are exported under their VM IDs: `penBlockSpecs`,
`wedo2BlockSpecs`, `musicBlockSpecs`, `microbitBlockSpecs`,
`text2speechBlockSpecs`, `translateBlockSpecs`, `videoSensingBlockSpecs`,
`ev3BlockSpecs`, `makeymakeyBlockSpecs`, `boostBlockSpecs`, `gdxforBlockSpecs`,
and `twBlockSpecs`. Reporter-accepting menus are included as their serialized
`${extensionId}_menu_${menuName}` shadow opcodes.

`translate_getTranslate.LANGUAGE` intentionally has no static default in the
catalog: the VM selects that menu shadow's initial language randomly each time
the extension metadata is requested.

Every definition exposes language-independent ordered `arguments` and separate
`source.scratchBlocks` or `source.scratchVm` provenance. Core definitions use
explicit scratchblocks-plus block IDs where available; built-in extensions keep
an empty binding because scratchblocks-plus has no matching built-in-extension
catalog. Runtime codecs do not depend on generated raw source argument data.

## Dynamic definitions

`control_stop`, `procedures_call`, and `procedures_prototype` require a minimal
`TurboWarpBlockResolveContext`. Static definitions can be resolved with
`undefined`. A dynamic definition given missing or mismatched context throws
`InvalidTurboWarpBlockContextError` rather than silently returning its base.

The base specs remain stable. Use
`getTurboWarpBlockResolveContext(block, hasNext)` to extract this minimal
context from an AST block for consumers such as `@scratch-code/materialize`.

## Source audit

The committed manifests record the Scratch Blocks definitions and the VM
extension metadata used to build the catalog. To audit them against local
checkouts at the pinned revisions:

```sh
pnpm build
pnpm --filter @scratch-code/turbowarp-blocks audit:scratch-blocks -- /path/to/scratch-blocks
pnpm --filter @scratch-code/turbowarp-blocks audit:scratch-vm -- /path/to/scratch-vm
```

After intentionally changing the pinned VM revision, regenerate its committed
catalog and manifest before auditing:

```sh
pnpm --filter @scratch-code/turbowarp-blocks generate:scratch-vm -- /path/to/scratch-vm
```

The catalog excludes `procedures_declaration`, the two `argument_editor_*`
editor-only blocks, the Scratch Blocks demonstration `extension_*`
definitions, and VM `coreExample`. It includes every entry in the VM's
`defaultBuiltinExtensions` table except that example. `speech2text` is not in
that table and remains outside the built-in catalog. The package does not
include an SB3 adapter or external extension definitions.

## License

This package is licensed under GPL-3.0-only because its catalog is derived from
TurboWarp's GPL-licensed `scratch-blocks` source. The package does not import or
bundle `scratch-blocks` or `scratch-vm` runtime code. Other packages in this
monorepo keep their own licenses.
