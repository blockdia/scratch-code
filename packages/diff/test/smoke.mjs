import assert from 'node:assert/strict';

import { diffScripts } from '../dist/index.js';

const before = [
  {
    kind: 'script',
    blocks: [{ kind: 'block', opcode: 'unknownExtension_before', fields: {}, inputs: {} }],
  },
];
const after = [
  {
    kind: 'script',
    blocks: [{ kind: 'block', opcode: 'unknownExtension_after', fields: {}, inputs: {} }],
  },
];

const result = diffScripts(before, after);
assert.equal(result.version, 1);
assert.ok(result.changes.length > 0);
assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
