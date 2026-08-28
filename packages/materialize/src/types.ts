import type {
  Block,
  ColorInput,
  MatrixInput,
  NoteInput,
  NumberInput,
  StringInput,
} from "@scratch-code/ast"

export type ScratchBlockIdNode =
  | Block
  | StringInput
  | NumberInput
  | ColorInput
  | MatrixInput
  | NoteInput

/** Stack information available while resolving a block's dynamic spec. */
export interface MaterializeBlockContext {
  readonly hasNext: boolean
}

/** Convert the current AST block into a registry-specific minimal context. */
export type BlockContextFactory<TContext> = (
  block: Readonly<Block>,
  context: MaterializeBlockContext,
) => TContext

/** Generate an ID for one runtime block, with all IDs already reserved in this pass. */
export type BlockIdGenerator = (
  block: Readonly<ScratchBlockIdNode>,
  usedIds: ReadonlySet<string>,
) => string

export interface MaterializeOptions<TContext> {
  /** Required only when the registry contains a resolver that needs context. */
  readonly contextForBlock?: BlockContextFactory<TContext>
  readonly generateBlockId?: BlockIdGenerator
}
