# AGENTS.md

This file applies to the entire repository.

## Repository overview

This is a Node.js 22+, pnpm 11, strict-TypeScript monorepo for semantic Scratch
code. Published packages live in `packages/*`; the browser playground lives in
`apps/playground`.

The package layers are intentional:

- `@scratch-code/ast` owns the codec-independent semantic model.
- `@scratch-code/block-spec` owns block definitions and registry behavior.
- `@scratch-code/fragment` and `@scratch-code/materialize` operate on semantic
  AST state.
- `@scratch-code/turbowarp-blocks` is the generated/audited Scratch and
  TurboWarp-compatible catalog.
- `@scratch-code/sb3`, `@scratch-code/vm-blocks`, and
  `@scratch-code/scratchblocks-codec` are peer adapters at the repository
  boundary. Production code in one codec must not depend on another codec.
- `tests/integration/fixtures` contains repository-only shared fixtures. Do not
  turn it into a published package without an explicit design decision.

Read `docs/ast-invariants.md` before changing AST types, metadata, block IDs,
inputs, fields, procedures, or codec behavior. Treat it as the current contract,
not as a proposal.

## Sources of truth

Do not guess Scratch or TurboWarp wire behavior. When semantics are unclear,
inspect the pinned manifests and the local sibling checkouts:

- `../scratch-blocks`
- `../scratch-vm`
- `../sb3-projects` for corpus projects
- `/Users/luyifei/Projects/GitHub/scratchblocks-plus` for scratchblocks-plus
  parsing and rendering behavior

If a registry has no spec for an opcode, preserve the explicit unsupported/error
path. Do not invent a plausible spec merely to make a fixture pass. Corpus
projects that require unsupported extension catalogs may be skipped with a
clear reason.

Generated or audited catalog data must retain its provenance and licensing.
Use the package scripts under `packages/turbowarp-blocks/scripts` rather than
hand-editing generated output when a generator owns the data.

## Semantic and codec boundaries

- Preserve all invariants in `docs/ast-invariants.md`, especially the difference
  between an absent input and `EmptyInput`, ownership of block and primitive
  shadow IDs, and the dedicated variable/list/broadcast field types.
- New concrete SB3 or VM blocks require unique non-empty Scratch IDs. Do not
  silently fabricate IDs inside a serialization codec; ID/default completion
  belongs in `@scratch-code/materialize`.
- Modeled AST edits must serialize. Do not let stale codec provenance override
  semantic state.
- A codec may read `metadata.scratch` and its own metadata namespace only. It
  must not read another codec's namespace or store whole source graphs,
  collection aggregates, or duplicate snapshots of modeled semantic state.
- Keep codec production dependencies minimal. Cross-codec behavior belongs in
  integration tests, not in runtime coupling.
- When syntax rendering deliberately normalizes spelling, whitespace, or
  localization, assert semantic round trips instead of byte-identical text.
- In scratchblocks-plus code, resolve parameters through its public helpers and
  rebuild translated presentation through its translation APIs; do not assume
  raw child positions or English-only specs are stable.
- Test transformations on relevant subgraphs or Script subsets as well as whole
  target collections. Whole-target round trips can hide dangling-reference or
  collection-state bugs.

## Working conventions

- Preserve unrelated working-tree changes. Check `git status --short` before
  editing and review the final diff.
- Use ESM and explicit `.js` extensions in relative TypeScript imports, matching
  the repository's `NodeNext` configuration.
- Keep the public API typed and JSON-safe. Avoid `any`; validate untrusted codec
  input at the boundary.
- Follow the existing strict compiler options, including
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and
  `noPropertyAccessFromIndexSignature`.
- Add or update tests with behavior changes. Prefer focused unit tests in the
  owning package and integration tests for package-boundary contracts.
- Update the owning package README and the root README when a public API,
  package role, required workflow, or user-facing command changes.
- Use `workspace:^` for internal package dependencies and keep runtime
  dependencies separate from test-only/dev dependencies.
- Run noninteractive installs with `CI=true`. When workspace packages or links
  change, refresh them with `CI=true pnpm install --no-frozen-lockfile`.

## Validation

Use the smallest useful checks while iterating. From the repository root:

```sh
pnpm --filter <package-name> build
pnpm --filter <package-name> typecheck
pnpm --filter <package-name> test
```

Before handing off a normal code change, run:

```sh
pnpm check
git diff --check
```

`pnpm check` runs formatting, linting, builds, type checks, unit tests, smoke
tests, and integration tests. Do not report a full pass if only a filtered check
was run.

For changes to SB3/VM conversion, block identity, graph structure, catalog
coverage, or materialization, also run the local corpus audit when the sibling
checkouts are available:

```sh
pnpm test:corpus -- \
  /Users/luyifei/Projects/Blockdia/scratch-vm \
  /Users/luyifei/Projects/Blockdia/sb3-projects
```

For playground changes, build for the deployed subpath and verify the affected
routes in a real browser, including console errors and the relevant DevTools
globals. Static checks alone do not establish browser or GitHub Pages behavior.

```sh
pnpm build:playground --base=/scratch-code/
```
