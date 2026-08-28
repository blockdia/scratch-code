export { DuplicateBlockIdError, InvalidGeneratedBlockIdError } from './errors.js';
export { generateScratchBlockId } from './id.js';
export { materialize } from './materialize.js';
export type {
  BlockContextFactory,
  BlockIdGenerator,
  MaterializeBlockContext,
  MaterializeOptions,
  ScratchBlockIdNode,
} from './types.js';
