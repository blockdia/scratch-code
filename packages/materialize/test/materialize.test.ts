import { describe, expect, it } from 'vitest';

import type { Block, Script } from '@scratch-code/ast';
import { walk } from '@scratch-code/ast';
import { createBlockSpecRegistry } from '@scratch-code/block-spec';
import { serializeSb3Blocks, type Sb3Block } from '@scratch-code/sb3';
import { deserializeScratchblocks } from '@scratch-code/scratchblocks-codec';
import {
  createTurboWarpBlockRegistry,
  getTurboWarpBlockResolveContext,
  InvalidTurboWarpBlockContextError,
} from '@scratch-code/turbowarp-blocks';
import { parse } from 'scratchblocks-plus/syntax';

import {
  DuplicateBlockIdError,
  generateScratchBlockId,
  InvalidGeneratedBlockIdError,
  materialize,
} from '../src/index.js';

const createFixtureRegistry = () => {
  const registry = createBlockSpecRegistry<undefined>();
  registry.register({
    opcode: 'root',
    shape: 'command',
    inputs: {
      NUMBER: {
        connection: 'value',
        accepts: 'number',
        default: { kind: 'input', type: 'number', value: 10 },
      },
      MENU: {
        connection: 'value',
        accepts: 'string',
        default: {
          kind: 'input',
          type: 'block',
          value: {
            kind: 'block',
            opcode: 'menu',
            inputs: {},
            fields: { VALUE: { kind: 'field', type: 'dropdown', value: 'default' } },
          },
        },
      },
      CONNECTED: {
        connection: 'value',
        accepts: 'number',
        default: { kind: 'input', type: 'number', value: 1 },
      },
      PROMOTE: {
        connection: 'value',
        accepts: 'string',
        default: { kind: 'input', type: 'string', value: 'default' },
      },
      PRESERVED: {
        connection: 'value',
        accepts: 'number',
        default: { kind: 'input', type: 'number', value: 2 },
      },
      BODY: { connection: 'statement' },
      BOOLEAN: { connection: 'value', accepts: 'boolean' },
    },
    fields: { VARIABLE: { type: 'variable' } },
    arguments: [
      { kind: 'field', name: 'VARIABLE' },
      { kind: 'input', name: 'NUMBER' },
      { kind: 'input', name: 'MENU' },
      { kind: 'input', name: 'CONNECTED' },
      { kind: 'input', name: 'PROMOTE' },
      { kind: 'input', name: 'PRESERVED' },
      { kind: 'input', name: 'BODY' },
      { kind: 'input', name: 'BOOLEAN' },
    ],
  });
  registry.register({
    opcode: 'menu',
    shape: 'reporter',
    outputType: 'string',
    inputs: {},
    fields: { VALUE: { type: 'dropdown' } },
    arguments: [{ kind: 'field', name: 'VALUE' }],
  });
  registry.register({
    opcode: 'reporter',
    shape: 'reporter',
    outputType: 'number',
    inputs: {},
    fields: {},
    arguments: [],
  });
  registry.register({ opcode: 'command', shape: 'command', inputs: {}, fields: {}, arguments: [] });
  return registry;
};

const partialFixture = (): Script[] => [
  {
    kind: 'script',
    blocks: [
      {
        kind: 'block',
        opcode: 'root',
        metadata: { scratch: { id: 'root-id' }, custom: { kept: true } },
        fields: {
          VARIABLE: { kind: 'field', type: 'variable', value: 'score', id: 'variable-id' },
        },
        inputs: {
          NUMBER: { kind: 'input', type: 'empty' },
          MENU: {
            kind: 'input',
            type: 'block',
            value: {
              kind: 'block',
              opcode: 'menu',
              inputs: {},
              fields: { VALUE: { kind: 'field', type: 'dropdown', value: 'chosen' } },
            },
          },
          CONNECTED: {
            kind: 'input',
            type: 'block',
            value: {
              kind: 'block',
              opcode: 'reporter',
              inputs: {},
              fields: {},
            },
          },
          PROMOTE: {
            kind: 'input',
            type: 'empty',
            obscuredShadow: {
              kind: 'input',
              type: 'block',
              value: {
                kind: 'block',
                opcode: 'menu',
                inputs: {},
                fields: { VALUE: { kind: 'field', type: 'dropdown', value: 'promoted' } },
              },
            },
          },
          PRESERVED: {
            kind: 'input',
            type: 'block',
            value: {
              kind: 'block',
              opcode: 'reporter',
              inputs: {},
              fields: {},
            },
            obscuredShadow: { kind: 'input', type: 'string', value: 'kept' },
          },
          BODY: {
            kind: 'input',
            type: 'script',
            value: {
              kind: 'script',
              blocks: [{ kind: 'block', opcode: 'command', inputs: {}, fields: {} }],
            },
          },
          EXTRA: {
            kind: 'input',
            type: 'block',
            value: {
              kind: 'block',
              opcode: 'reporter',
              inputs: {},
              fields: {},
            },
          },
        },
      },
    ],
  },
];

const deterministicIds = () => {
  let next = 1;
  return () => `generated-${next++}`;
};

describe('materialize', () => {
  it('generates Scratch VM-compatible default IDs', () => {
    const id = generateScratchBlockId(
      { kind: 'block', opcode: 'command', inputs: {}, fields: {} },
      new Set(),
    );
    const characters = new Set(
      '!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    );
    expect(id).toHaveLength(20);
    expect([...id].every((character) => characters.has(character))).toBe(true);
  });

  it('deep-clones and completes defaults, shadows, nested IDs, and empty slots', () => {
    const input = partialFixture();
    const snapshot = JSON.parse(JSON.stringify(input)) as Script[];
    const result = materialize(input, createFixtureRegistry(), {
      contextForBlock: () => undefined,
      generateBlockId: deterministicIds(),
    });

    expect(input).toEqual(snapshot);
    expect(result).not.toBe(input);
    expect(result[0]).not.toBe(input[0]);
    const root = result[0]!.blocks[0]!;
    expect(root.metadata).toMatchObject({ scratch: { id: 'root-id' }, custom: { kept: true } });
    expect(root.fields['VARIABLE']).toMatchObject({ id: 'variable-id' });
    expect(root.inputs['NUMBER']).toMatchObject({
      type: 'number',
      value: 10,
      metadata: { scratch: { id: 'generated-1' } },
    });
    expect(root.inputs['BOOLEAN']).toEqual({ kind: 'input', type: 'empty' });

    const menu = root.inputs['MENU'];
    expect(menu).toMatchObject({
      type: 'block',
      value: { shadow: true, metadata: { scratch: { id: 'generated-2' } } },
    });
    const connected = root.inputs['CONNECTED'];
    expect(connected).toMatchObject({
      type: 'block',
      value: { metadata: { scratch: { id: 'generated-3' } } },
      obscuredShadow: { type: 'number', value: 1, metadata: { scratch: { id: 'generated-4' } } },
    });
    expect(connected?.type === 'block' && connected.value.shadow).toBeUndefined();
    expect(root.inputs['PROMOTE']).toMatchObject({
      type: 'block',
      value: {
        shadow: true,
        fields: { VALUE: { value: 'promoted' } },
        metadata: { scratch: { id: 'generated-5' } },
      },
    });
    expect(root.inputs['PRESERVED']).toMatchObject({
      type: 'block',
      value: { metadata: { scratch: { id: 'generated-6' } } },
      obscuredShadow: {
        type: 'string',
        value: 'kept',
        metadata: { scratch: { id: 'generated-7' } },
      },
    });
    expect(root.inputs['BODY']).toMatchObject({
      type: 'script',
      value: { blocks: [{ metadata: { scratch: { id: 'generated-8' } } }] },
    });
    expect(root.inputs['EXTRA']).toMatchObject({
      type: 'block',
      value: { metadata: { scratch: { id: 'generated-9' } } },
    });
  });

  it('is structurally idempotent and does not call the generator again', () => {
    const first = materialize(partialFixture(), createFixtureRegistry(), {
      contextForBlock: () => undefined,
      generateBlockId: deterministicIds(),
    });
    const second = materialize(first, createFixtureRegistry(), {
      contextForBlock: () => undefined,
      generateBlockId: () => {
        throw new Error('generator must not be called');
      },
    });
    expect(second).toEqual(first);
  });

  it('rejects duplicate existing IDs and invalid or colliding generated IDs', () => {
    const duplicate: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'command',
            inputs: {},
            fields: {},
            metadata: { scratch: { id: 'same' } },
          },
          {
            kind: 'block',
            opcode: 'command',
            inputs: {},
            fields: {},
            metadata: { scratch: { id: 'same' } },
          },
        ],
      },
    ];
    expect(() =>
      materialize(duplicate, createFixtureRegistry(), {
        contextForBlock: () => undefined,
      }),
    ).toThrow(DuplicateBlockIdError);

    const existing: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'command',
            inputs: {},
            fields: {},
            metadata: { scratch: { id: 'used' } },
          },
          { kind: 'block', opcode: 'command', inputs: {}, fields: {} },
        ],
      },
    ];
    expect(() =>
      materialize(existing, createFixtureRegistry(), {
        contextForBlock: () => undefined,
        generateBlockId: () => 'used',
      }),
    ).toThrow(DuplicateBlockIdError);
    expect(() =>
      materialize(
        [
          {
            kind: 'script',
            blocks: [{ kind: 'block', opcode: 'command', inputs: {}, fields: {} }],
          },
        ],
        createFixtureRegistry(),
        {
          contextForBlock: () => undefined,
          generateBlockId: () => '',
        },
      ),
    ).toThrow(InvalidGeneratedBlockIdError);
  });

  it('uses resolved TurboWarp procedure defaults and reports invalid mutations', () => {
    const argumentIds = ['number', 'text', 'boolean'];
    const scripts: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'procedures_call',
            fields: {},
            inputs: Object.fromEntries(
              argumentIds.map((id) => [id, { kind: 'input', type: 'empty' }]),
            ),
            mutation: {
              type: 'procedure-call',
              proccode: 'mix %n %s %b',
              argumentIds,
              warp: false,
              returnType: 'statement',
            },
          },
          {
            kind: 'block',
            opcode: 'procedures_prototype',
            fields: {},
            inputs: Object.fromEntries(
              argumentIds.map((id) => [id, { kind: 'input', type: 'empty' }]),
            ),
            mutation: {
              type: 'procedure-prototype',
              proccode: 'mix %n %s %b',
              argumentIds,
              argumentNames: ['count', 'label', 'ready?'],
              argumentDefaults: [0, '', false],
              warp: false,
            },
          },
        ],
      },
    ];
    const result = materialize(scripts, createTurboWarpBlockRegistry(), {
      contextForBlock: (block, { hasNext }) => getTurboWarpBlockResolveContext(block, hasNext),
      generateBlockId: deterministicIds(),
    });
    const call = result[0]!.blocks[0]!;
    expect(call.inputs['number']).toMatchObject({ type: 'number', value: 1 });
    expect(call.inputs['text']).toMatchObject({
      kind: 'input',
      type: 'string',
      value: '',
      metadata: { scratch: { id: expect.any(String) } },
    });
    expect(call.inputs['boolean']).toEqual({ kind: 'input', type: 'empty' });
    const prototype = result[0]!.blocks[1]!;
    expect(prototype.inputs['number']).toMatchObject({
      type: 'block',
      value: { opcode: 'argument_reporter_string_number', shadow: true },
    });
    expect(prototype.inputs['boolean']).toMatchObject({
      type: 'block',
      value: { opcode: 'argument_reporter_boolean', shadow: true },
    });

    expect(() =>
      materialize(
        [
          {
            kind: 'script',
            blocks: [
              {
                kind: 'block',
                opcode: 'procedures_call',
                inputs: {},
                fields: {},
              },
            ],
          },
        ],
        createTurboWarpBlockRegistry(),
        {
          contextForBlock: (block, { hasNext }) => getTurboWarpBlockResolveContext(block, hasNext),
          generateBlockId: () => 'call-id',
        },
      ),
    ).toThrow(InvalidTurboWarpBlockContextError);
  });

  it('materializes scratchblocks AST into canonical SB3 shadows and mode 3 inputs', () => {
    const registry = createTurboWarpBlockRegistry();
    const source = 'move (x position) steps\ngo to (random position v)';
    const partial = deserializeScratchblocks(parse(source, { languages: ['en'] }), registry);
    const result = materialize(partial, registry, {
      contextForBlock: (block, { hasNext }) => getTurboWarpBlockResolveContext(block, hasNext),
      generateBlockId: deterministicIds(),
    });
    const goto = result[0]!.blocks[1]!;
    const menu = goto.inputs['TO'];
    if (menu?.type !== 'block') throw new Error('Expected a menu block');
    expect(menu.value.shadow).toBe(true);

    const ids: string[] = [];
    for (const script of result)
      walk(script, {
        enter(node) {
          if (
            node.kind === 'block' ||
            (node.kind === 'input' &&
              node.type !== 'block' &&
              node.type !== 'script' &&
              node.type !== 'empty')
          ) {
            ids.push(node.metadata?.scratch?.id ?? '');
          }
        },
      });
    expect(ids.every((id) => id.length > 0)).toBe(true);

    const blocks = serializeSb3Blocks(result);
    expect(blocks[menu.value.metadata!.scratch!.id!] as Sb3Block).toMatchObject({ shadow: true });
    const move = result[0]!.blocks[0]!;
    const rawMove = blocks[move.metadata!.scratch!.id!] as Sb3Block;
    expect(rawMove.inputs['STEPS']?.[0]).toBe(3);
    const rawGoto = blocks[goto.metadata!.scratch!.id!] as Sb3Block;
    expect(rawGoto.inputs['TO']).toEqual([1, menu.value.metadata!.scratch!.id!]);
  });
});
