# AST invariants

This document records the invariants implemented by the current
`@scratch-code/ast` types and codecs. It is a contract summary, not a proposal
for a different AST.

## Script

- `Script.blocks` is one independent stack or expression tree. A Script is not
  synonymous with an SB3 block whose `topLevel` property is `true`.
- A standalone reporter, boolean, or command is a valid one-Block Script.
- `metadata.scratch.x` and `metadata.scratch.y` are the workspace coordinates
  of a top-level Script. Nested Scripts normally have no coordinates.
- A nested statement stack is represented by a `ScriptInput`; the Script owns
  the ordered `next`-equivalent sequence in its `blocks` array.

## Block

- `opcode` is an open string so extension blocks do not require an AST release.
- Concrete block identity is `metadata.scratch.id`. Codecs which emit a
  concrete graph require a unique, non-empty ID for every emitted Block.
- `shadow: true` means that the Block is a real Scratch/VM shadow block.
  Omission means an ordinary block.
- `fields` and `inputs` are always present, including when empty.
- Modeled procedure prototype and call mutations are first-class semantic AST
  state. They must not be downgraded into codec metadata.

## Input

The four structural input states are literal, `block`, `script`, and `empty`.
String, number, color, note, and matrix inputs are semantic literals.

- An `EmptyInput` and an absent input key are different AST states. A codec may
  canonicalize an EmptyInput according to its wire contract; for example SB3
  serialization omits the key.
- After `materialize()`, every input declared by a known resolved BlockSpec is
  present and contains either its canonical default/shadow or an explicit
  EmptyInput.
- The concrete ID of a nested `BlockInput` belongs to `input.value`, not to the
  structural Input wrapper.
- When a literal corresponds to a primitive shadow block in the VM concrete
  model, its identity is `input.metadata.scratch.id`.
- `obscuredShadow` is input-local fallback-shadow state. It moves with the
  active input and may contain a scalar literal or one Block shadow. It is not a
  pointer into, or a snapshot of, a complete SB3/VM graph.
- An obscured shadow cannot itself contain another obscured shadow.

## Field

- Variable, list, and broadcast names plus their optional `id` are semantic
  references. A block-ID generator must not create or rewrite those IDs.
- Reference fields retain their dedicated `variable`, `list`, or `broadcast`
  types and optional string ID.
- Other VM field values use the JSON-shaped `Field.value`; codecs validate
  untrusted values at their own boundary rather than coercing historical data
  to strings.

## Metadata namespaces

Metadata is non-semantic, JSON-safe, and node-local. The namespaces have
separate owners:

- `metadata.scratch`: stable cross-codec Scratch annotations—Block or primitive
  shadow IDs, top-level Script coordinates, and numeric shadow kind.
- `metadata.sb3`: versioned SB3 codec provenance that cannot be reconstructed
  from semantic AST state, currently unmodeled raw mutation and comment IDs.
- `metadata.vmBlocks`: versioned VM Blocks provenance, currently unmodeled raw
  mutation and block comment IDs.
- `metadata.scratchblocks`: versioned scratchblocks-plus surface provenance,
  currently comments, diff markers, and glow wrappers.

A codec may read `metadata.scratch` and its own namespace. It must not read
another codec's namespace. Codec metadata must not contain a complete raw SB3
blocks object, a complete `VmBlock[]`, collection aggregates stored on
`scripts[0]`, or a duplicated source snapshot of modeled semantic state.
