import { describe, expect, it } from 'vitest';

import type { Script } from '@scratch-code/ast';
import { createBlockSpecRegistry } from '@scratch-code/block-spec';
import { DuplicateBlockIdError, materialize } from '@scratch-code/materialize';
import {
  createTurboWarpBlockRegistry,
  getTurboWarpBlockResolveContext,
} from '@scratch-code/turbowarp-blocks';

import { semanticFixtures } from './fixtures/semantic.js';

const options = () => {
  let next = 1;
  return {
    contextForBlock: (
      block: Parameters<typeof getTurboWarpBlockResolveContext>[0],
      { hasNext }: { hasNext: boolean },
    ) => getTurboWarpBlockResolveContext(block, hasNext),
    generateBlockId: () => `materialized-${next++}`,
  };
};

describe('materialize invariants across shared fixtures', () => {
  for (const fixture of semanticFixtures) {
    it(`${fixture.name}: immutable and idempotent`, () => {
      const input = fixture.createAst();
      const before = JSON.parse(JSON.stringify(input)) as Script[];
      const first = materialize(input, createTurboWarpBlockRegistry(), options());
      const second = materialize(first, createTurboWarpBlockRegistry(), {
        ...options(),
        generateBlockId: () => {
          throw new Error('idempotent materialize must preserve every existing ID');
        },
      });
      expect(input).toEqual(before);
      expect(first).not.toBe(input);
      expect(second).toEqual(first);
    });
  }

  it('does not guess a primitive shadow from accepts without InputSpec.default', () => {
    const registry = createBlockSpecRegistry<undefined>();
    registry.register({
      opcode: 'no-default',
      shape: 'command',
      inputs: { VALUE: { connection: 'value', accepts: 'number' } },
      fields: {},
      arguments: [{ kind: 'input', name: 'VALUE' }],
    });
    const source: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'no-default',
            inputs: {},
            fields: {},
          },
        ],
      },
    ];
    const result = materialize(source, registry, { generateBlockId: () => 'block-id' });
    expect(result[0]!.blocks[0]!.inputs['VALUE']).toEqual({ kind: 'input', type: 'empty' });
  });

  it('materializes recursive obscured shadows and rejects duplicate identities', () => {
    const registry = createBlockSpecRegistry<undefined>();
    registry.register({
      opcode: 'root',
      shape: 'command',
      fields: {},
      arguments: [{ kind: 'input', name: 'VALUE' }],
      inputs: {
        VALUE: {
          connection: 'value',
          accepts: 'string',
          default: {
            kind: 'input',
            type: 'block',
            value: {
              kind: 'block',
              opcode: 'menu',
              inputs: {},
              fields: {},
            },
          },
        },
      },
    });
    registry.register({
      opcode: 'menu',
      shape: 'reporter',
      outputType: 'string',
      inputs: {},
      fields: {},
      arguments: [],
    });
    const source: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'root',
            inputs: {
              VALUE: {
                kind: 'input',
                type: 'string',
                value: 'active',
                obscuredShadow: {
                  kind: 'input',
                  type: 'block',
                  value: { kind: 'block', opcode: 'menu', inputs: {}, fields: {} },
                },
              },
            },
            fields: {},
          },
        ],
      },
    ];
    let next = 1;
    const result = materialize(source, registry, {
      contextForBlock: () => undefined,
      generateBlockId: () => `recursive-${next++}`,
    });
    expect(result[0]!.blocks[0]!.inputs['VALUE']).toMatchObject({
      metadata: { scratch: { id: 'recursive-2' } },
      obscuredShadow: { value: { shadow: true, metadata: { scratch: { id: 'recursive-3' } } } },
    });

    const duplicate: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'menu',
            inputs: {},
            fields: {},
            metadata: { scratch: { id: 'same' } },
          },
          {
            kind: 'block',
            opcode: 'menu',
            inputs: {},
            fields: {},
            metadata: { scratch: { id: 'same' } },
          },
        ],
      },
    ];
    expect(() =>
      materialize(duplicate, registry, {
        contextForBlock: () => undefined,
      }),
    ).toThrow(DuplicateBlockIdError);
  });
});
