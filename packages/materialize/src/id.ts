import type { BlockIdGenerator } from './types.js';

// Kept in sync with scratch-vm/src/util/uid.js. `$` is intentionally excluded.
const scratchIdCharacters =
  '!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Generate one Scratch VM-compatible 20-character block ID. */
export const generateScratchBlockId: BlockIdGenerator = (_block, _usedIds) => {
  let result = '';
  for (let index = 0; index < 20; index += 1) {
    result += scratchIdCharacters.charAt(Math.random() * scratchIdCharacters.length);
  }
  return result;
};
