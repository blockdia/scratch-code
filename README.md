# scratch-code

TypeScript packages for working with semantic Scratch code.

## Packages

- [`@scratch-code/ast`](./packages/ast): a tree-shaped, JSON-serializable AST for Scratch blocks.
- [`@scratch-code/block-spec`](./packages/block-spec): semantic block specifications and an extensible registry.
- [`@scratch-code/turbowarp-blocks`](./packages/turbowarp-blocks): GPL-3.0 TurboWarp block specs derived from the pinned `scratch-blocks` source.
- [`@scratch-code/sb3`](./packages/sb3): lossless conversion between SB3 target blocks and the semantic AST.
- [`@scratch-code/scratchblocks-codec`](./packages/scratchblocks-codec): semantic conversion between scratchblocks-plus syntax trees and the AST.

## Development

This repository requires Node.js 22 or newer and pnpm 11.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:smoke
```
