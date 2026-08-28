import assert from 'node:assert/strict';

import { BlockSpecRegistry, createBlockSpecRegistry } from '@scratch-code/block-spec';

const spec = {
  opcode: 'motion_movesteps',
  shape: 'command',
  inputs: {},
  fields: {},
};

const registry = createBlockSpecRegistry();
registry.register(spec);

assert.equal(registry instanceof BlockSpecRegistry, true);
assert.equal(registry.get('motion_movesteps'), spec);
assert.equal(registry.resolve('motion_movesteps', undefined), spec);
