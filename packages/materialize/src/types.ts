import type {Block} from "@scratch-code/ast"

/** Stack information available while resolving a block's dynamic spec. */
export interface MaterializeBlockContext {
  readonly hasNext: boolean
}

/** Convert the current AST block into a registry-specific minimal context. */
export type BlockContextFactory<TContext> = (
  block: Readonly<Block>,
  context: MaterializeBlockContext,
) => TContext

/** Generate an ID for one block, with all IDs already reserved in this pass. */
export type BlockIdGenerator = (
  block: Readonly<Block>,
  usedIds: ReadonlySet<string>,
) => string

export interface MaterializeOptions<TContext> {
  readonly contextForBlock: BlockContextFactory<TContext>
  readonly generateBlockId?: BlockIdGenerator
}
