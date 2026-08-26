# scratch-code

TypeScript packages for working with semantic Scratch code.

## Packages

- [`@scratch-code/ast`](./packages/ast): a tree-shaped, JSON-serializable AST for Scratch blocks.
- [`@scratch-code/block-spec`](./packages/block-spec): semantic block specifications and an extensible registry.

## Development

This repository requires Node.js 22 or newer and pnpm 11.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:smoke
```
