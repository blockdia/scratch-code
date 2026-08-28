# @scratch-code/ast

A small, tree-shaped, JSON-serializable AST for Scratch code. It models block
content rather than the flat ID graph used by SB3 or rendering-oriented syntax
trees.

## Installation

```sh
npm install @scratch-code/ast
```

This package is ESM-only and requires Node.js 22 or newer.

```ts
import type { Script } from '@scratch-code/ast';
import { walk } from '@scratch-code/ast';

const script: Script = {
  kind: 'script',
  blocks: [
    {
      kind: 'block',
      opcode: 'motion_movesteps',
      fields: {},
      inputs: {
        STEPS: {
          kind: 'input',
          type: 'number',
          value: '0010',
          metadata: { scratch: { numericKind: 'number' } },
          obscuredShadow: {
            kind: 'input',
            type: 'number',
            value: '10',
          },
        },
      },
    },
  ],
  metadata: { scratch: { x: 32, y: 48 } },
};

walk(script, {
  enter(node) {
    if (node.kind === 'block') console.log(node.opcode);
  },
});
```

## Validation

`validateScripts()` treats its input as untrusted data and returns stable,
structured diagnostics. With no options it validates only the AST contract:
node shapes and required values, JSON safety, metadata and mutation shapes, and
tree ownership (no shared AST nodes or cycles). It does not require block IDs
and does not reject an open or extension opcode.

```ts
import { AstValidationError, assertValidScripts, validateScripts } from '@scratch-code/ast';

const diagnostics = validateScripts(possiblyUntrustedValue);
for (const diagnostic of diagnostics) {
  console.log(diagnostic.code, diagnostic.path, diagnostic.nodeId);
}

// This also narrows an unknown value to readonly Script[].
assertValidScripts(possiblyUntrustedValue);
```

Every diagnostic has a stable `code`, `severity`, structured `path`, human
message, and the nearest `metadata.scratch.id` as `nodeId` when available.
`assertValidScripts()` throws `AstValidationError` when any error is present;
the error's `diagnostics` property retains the same structured entries.

Supplying a `BlockSpecRegistry` opts into semantic validation. The validator
uses only the registry's `get()` surface, which avoids a reverse package
dependency from `@scratch-code/ast` to `@scratch-code/block-spec`:

```ts
import { validateScripts } from '@scratch-code/ast';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';

const diagnostics = validateScripts(scripts, {
  registry: createTurboWarpBlockRegistry(),
});
```

Semantic validation checks declared fields and inputs, value versus statement
connection shapes, literal compatibility with `accepts`, procedure mutations,
and shadow/obscured-shadow placement. In this mode an opcode without a registry
entry produces `MISSING_BLOCK_SPEC`. The validator is read-only: it never
materializes defaults, creates IDs, changes shadows, or repairs the input.

## Immutable transforms

`transformScripts()` is the modifying counterpart to `walk()`. It visits the
same AST nodes in the same child order, but calls its visitor bottom-up so a
parent receives its already-transformed children.

```ts
import { transformScripts } from '@scratch-code/ast';

const renamed = transformScripts([script], {
  leave(node, context) {
    if (node.kind === 'block' && node.opcode === 'looks_say') {
      return { ...node, opcode: 'looks_think' };
    }
    if (node.kind === 'field' && context.key === 'VARIABLE') {
      return { ...node, value: 'renamed variable' };
    }
    // Returning undefined keeps this node.
  },
});
```

The input AST is never modified. Changed nodes and their ancestors are copied;
unchanged subtrees, metadata, and mutations retain their references where
possible. The returned top-level array is always new. A replacement must keep
the original node `kind`, although an Input or Field may change its subtype.

Transform context has the same `parent`, `key`, `index`, and `depth` fields as
`walk()`. Its `parent` refers to the node in the input tree; the node passed to
the parent's `leave` callback contains transformed children. Metadata and
mutation objects are properties available on their owning node, not separate
visitor events.

Deletion is intentionally unsupported. AST node positions such as named inputs,
fields, nested script values, and obscured shadows cannot be absent once their
owning key exists; callers can replace an Input with an explicit `EmptyInput`
where that is semantically appropriate. An `obscuredShadow` replacement must
remain a scalar or block input.

## Scratch alignment

- Canonical Scratch opcodes remain open strings so extension blocks are valid.
- Scalar shadow blocks are represented as literals. Their source block identity
  can be recorded as `metadata.scratch.id`; numeric shadow variants are recorded
  non-semantically as `metadata.scratch.numericKind`.
- Menu and other non-scalar shadows remain blocks with `shadow: true`; only
  Scratch fields use `type: "dropdown"`.
- A mode 3 fallback hidden by a connected value lives on that Input as
  `obscuredShadow`; it moves and clones with the Input. If the current value is
  itself the shadow, it is stored only as the current value.
- Boolean inputs contain a reporter block or are explicitly empty. There is no
  boolean literal input.
- Workspace coordinates belong to the top-level `Script`. Source block IDs
  belong to individual `Block` nodes and scalar inputs normalized from VM
  shadow blocks.

Procedure mutations are normalized as either `procedure-prototype` or
`procedure-call`. Prototype argument ID, name, and default arrays are parallel
and must have matching lengths. Call argument IDs correspond to the call block's
input keys, and `returnType` distinguishes statement, reporter, and boolean calls.

Structural validation does not interpret opcodes. Optional registry validation
checks their declared semantic shape, but the package does not execute blocks,
render blocks, or convert SB3 files. Stable annotations under
`metadata.scratch` are limited to source block IDs, script coordinates, and
numeric shadow kinds. Codec namespaces such as `metadata.sb3` and
`metadata.scratchblocks` are owned and typed by their codec packages.

`Field.value` is a `JsonValue`. Scratch normally uses strings, but imported
projects and the VM can retain JSON arrays or objects in historical field data;
text-only consumers should convert values at their own boundary.

`JsonValue` describes the JSON data model, but TypeScript cannot prove that a
number is finite. Use `isJsonValue()` or `assertJsonValue()` at untrusted
boundaries; missing object properties should be omitted rather than represented
as array `undefined` values.
