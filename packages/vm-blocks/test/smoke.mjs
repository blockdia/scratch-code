import assert from 'node:assert/strict';

import { createBlockSpecRegistry } from '@scratch-code/block-spec';
import { deserializeVmBlocks, serializeVmBlocks } from '../dist/index.js';

const registry = createBlockSpecRegistry();
registry.register({
  opcode: 'example',
  shape: 'command',
  inputs: { VALUE: { connection: 'value', accepts: 'string' } },
  fields: {},
  arguments: [{ kind: 'input', name: 'VALUE' }],
});
registry.register({
  opcode: 'text',
  shape: 'reporter',
  outputType: 'string',
  inputs: {},
  fields: { TEXT: { type: 'text' } },
  arguments: [{ kind: 'field', name: 'TEXT' }],
});

const source = [
  {
    id: 'example',
    opcode: 'example',
    next: null,
    inputs: { VALUE: { block: 'text', shadow: 'text' } },
    fields: {},
    shadow: false,
    topLevel: true,
  },
  {
    id: 'text',
    opcode: 'text',
    next: null,
    parent: 'example',
    inputs: {},
    fields: { TEXT: { value: 'hello' } },
    shadow: true,
    topLevel: false,
  },
];
const scripts = deserializeVmBlocks(source, registry);
assert.equal(scripts[0].blocks[0].inputs.VALUE.metadata.scratch.id, 'text');
assert.deepEqual(serializeVmBlocks(scripts).find((block) => block.id === 'text').fields.TEXT, {
  name: 'TEXT',
  value: 'hello',
});
