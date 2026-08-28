# @scratch-code/fragment

Analyze semantic Scratch scripts and create versioned, JSON-serializable code
fragments without consulting SB3, VM Blocks, scratchblocks, or a block registry.

## Installation

```sh
npm install @scratch-code/fragment
```

This package is ESM-only and requires Node.js 22 or newer.

```ts
import { analyzeScripts, createScratchFragment } from '@scratch-code/fragment';

const analysis = analyzeScripts(selectedScripts);
const fragment = createScratchFragment(selectedScripts, { sourceScripts });
```

`analyzeScripts()` reports variable, list, broadcast, procedure, and extension
usage. Resource identities are deduplicated without inventing missing IDs.
Procedure definitions are read only from canonical top blocks; procedure calls
are found recursively. Unknown extension opcodes are supported through their
Scratch-compatible opcode prefix.

`createScratchFragment()` preserves selected script order and appends reachable
procedure definition scripts in `sourceScripts` order. Direct and mutual
recursion terminate, missing calls remain minimal `{proccode}` dependencies,
and ambiguous reachable definitions throw. Existing definition block IDs are
used to recognize the same occurrence across cloned script arrays.

The returned AST is a deep copy. Fragment creation does not materialize blocks,
generate IDs, resolve destination conflicts, create project resources, import
the fragment, or load extensions.

## License

MIT
