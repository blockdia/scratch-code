# @scratch-code/diff

Deterministic semantic diffs for `@scratch-code/ast` Script collections.

The package compares AST meaning rather than SB3 encoding or scratchblocks
presentation. It has no block-registry or codec dependency, so open extension
opcodes are supported without a catalog.

```ts
import { diffScripts } from '@scratch-code/diff';

const result = diffScripts(beforeScripts, afterScripts);

for (const change of result.changes) {
  console.log(change.type);
}
```

## Result model

`diffScripts()` returns a versioned, JSON-safe result with three collections:

- `pairs` maps matched before/after entities and records whether they matched by
  unique Scratch ID, ordered equality, conservative similarity, or a named AST
  key.
- `changes` contains the renderer-independent `add`, `remove`, and `modify`
  operations.
- `relations` currently contains optional move annotations.

Locations use structured paths rooted at `scripts`, matching AST validation
paths. A location may include `metadata.scratch.id` as an identity hint, but
the path is the location for this diff. Diff-local pair and change IDs are
deterministic and never become Scratch IDs.

The result references the caller's before/after ASTs by path instead of copying
whole subtrees. Keep those inputs with the result when a consumer needs to
render source content.

## Semantic boundary

The following state is compared:

- Script and stack order.
- Block opcode and shadow role.
- Named inputs, input types and literal values, nested blocks and substacks,
  and obscured shadows.
- Field types, JSON values, and variable/list/broadcast IDs.
- Modeled semantic mutations.

All AST metadata is excluded from semantic equality. A unique, non-empty
`metadata.scratch.id` may help match Blocks, but changing or removing that ID
alone is not a semantic change. Script coordinates, numeric shadow kinds, and
codec namespaces are likewise ignored.

Both inputs are structurally validated without a registry. Invalid ASTs throw
`InvalidDiffInputError`, whose `inputs` property identifies the `before` or
`after` side and retains the AST diagnostics. The diff never repairs nodes,
materializes defaults, or generates IDs.

## Matching

The default matching pipeline is ID-first, then ordered, then similarity:

```ts
diffScripts(before, after, {
  matching: [{ kind: 'scratch-id' }, { kind: 'ordered' }, { kind: 'similarity' }],
});
```

The array order is significant, and strategies may be omitted. Ordered
matching uses canonical semantic fingerprints with sorted record keys.
Similarity is deliberately conservative: Blocks require the same opcode and
structural shape, and ambiguous duplicate candidates remain additions and
removals.

## Moves

A move is an extra relation, never a fourth base change status. A moved Script
or Block still has a linked removal and addition in `changes`. Consumers that
ignore `relations` therefore retain a complete basic diff, while richer
consumers may collapse the pair into a move presentation.

The first version does not project changes into `metadata.diff`. The canonical
result remains independent of AST metadata; a future projection helper can
derive annotations immutably without becoming another source of truth.
