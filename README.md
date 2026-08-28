# scratch-code

TypeScript packages for working with semantic Scratch code.

## Packages

- [`@scratch-code/ast`](./packages/ast): a tree-shaped, JSON-serializable AST for Scratch blocks, with structural and optional registry-backed semantic validation.
- [`@scratch-code/block-spec`](./packages/block-spec): semantic block specifications and an extensible registry.
- [`@scratch-code/fragment`](./packages/fragment): semantic dependency analysis and versioned code fragments.
- [`@scratch-code/materialize`](./packages/materialize): immutable completion of spec-default shadows and Scratch block IDs.
- [`@scratch-code/turbowarp-blocks`](./packages/turbowarp-blocks): GPL-3.0 TurboWarp block specs derived from the pinned `scratch-blocks` source.
- [`@scratch-code/sb3`](./packages/sb3): semantic conversion between SB3 target blocks and a stable canonical SB3 form.
- [`@scratch-code/vm-blocks`](./packages/vm-blocks): bidirectional conversion between AST scripts and Scratch VM runtime blocks.
- [`@scratch-code/scratchblocks-codec`](./packages/scratchblocks-codec): semantic conversion between scratchblocks-plus syntax trees and the AST.

The shared semantic contract is documented in
[`docs/ast-invariants.md`](./docs/ast-invariants.md). Codec packages are peer
adapters: their production code does not depend on another codec or consume
another codec's private metadata.

## Development

This repository requires Node.js 22 or newer and pnpm 11.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:smoke
pnpm test:integration
```

`tests/integration/fixtures` contains repository-only semantic and wire
fixtures shared by the codecs; it is not a published package. Run the complete
local corpus audit explicitly when the pinned VM checkout and SB3 corpus are
available:

```sh
pnpm test:corpus -- /path/to/scratch-vm /path/to/sb3-projects
```

The default CI commands do not depend on absolute corpus paths.

## Playground

The browser playground provides a package index with focused explorers for the
AST, block-spec registry, TurboWarp catalog, SB3 conversion, and scratchblocks
codec.

```sh
pnpm build
pnpm dev:playground
```
