import { describe, expect, it } from 'vitest';

import type { Script } from '@scratch-code/ast';
import { createBlockSpecRegistry, MissingBlockSpecError } from '@scratch-code/block-spec';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';

import {
  deserializeVmBlocks,
  DuplicateVmBlockIdError,
  getVmBlocksBlockMetadata,
  InvalidVmBlocksError,
  MissingVmBlockIdError,
  serializeVmBlocks,
  type VmBlock,
} from '../src/index.js';

const registry = () => createTurboWarpBlockRegistry();
const byId = (blocks: readonly VmBlock[]): Record<string, VmBlock> =>
  Object.fromEntries(blocks.map((block) => [block.id, block]));

describe('VM block conversion', () => {
  it('round-trips stacks, scalar shadows, obscured shadows, comments, and coordinates', () => {
    const source: VmBlock[] = [
      {
        id: 'hat',
        opcode: 'event_whenflagclicked',
        next: 'move',
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 12,
        y: 34,
        comment: 'comment-id',
      },
      {
        id: 'move',
        opcode: 'motion_movesteps',
        next: 'not',
        parent: 'hat',
        fields: {},
        shadow: false,
        inputs: { STEPS: { name: 'STEPS', block: 'variable', shadow: 'number' } },
      },
      {
        id: 'variable',
        opcode: 'data_variable',
        next: null,
        parent: 'move',
        inputs: {},
        shadow: false,
        fields: {
          VARIABLE: { name: 'VARIABLE', value: 'score', id: 'variable-id', variableType: '' },
        },
      },
      {
        id: 'number',
        opcode: 'math_number',
        next: null,
        parent: 'move',
        inputs: {},
        shadow: true,
        fields: { NUM: { name: 'NUM', value: '10' } },
      },
      {
        id: 'not',
        opcode: 'operator_not',
        next: null,
        parent: 'move',
        fields: {},
        shadow: false,
        inputs: { OPERAND: { name: 'OPERAND', block: null, shadow: null } },
      },
    ];

    const scripts = deserializeVmBlocks(source, registry());
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.metadata?.scratch).toEqual({ x: 12, y: 34 });
    expect(getVmBlocksBlockMetadata(scripts[0]!.blocks[0]!)).toEqual({
      version: 1,
      comment: 'comment-id',
    });
    expect(scripts[0]!.blocks[0]!.metadata).toEqual({
      scratch: { id: 'hat' },
      vmBlocks: { version: 1, comment: 'comment-id' },
    });
    expect(JSON.stringify(scripts)).not.toContain('"sb3"');
    expect(JSON.stringify(getVmBlocksBlockMetadata(scripts[0]!.blocks[0]!))).not.toContain(
      'opcode',
    );
    expect(scripts[0]?.blocks[1]?.inputs['STEPS']).toMatchObject({
      type: 'block',
      value: { opcode: 'data_variable', metadata: { scratch: { id: 'variable' } } },
      obscuredShadow: { type: 'number', value: '10', metadata: { scratch: { id: 'number' } } },
    });
    expect(scripts[0]?.blocks[2]?.inputs['OPERAND']).toMatchObject({ type: 'empty' });

    const canonical = byId(serializeVmBlocks(scripts));
    expect(canonical['hat']).toMatchObject({
      topLevel: true,
      parent: null,
      x: 12,
      y: 34,
      comment: 'comment-id',
    });
    expect(canonical['move']?.inputs?.['STEPS']).toEqual({
      name: 'STEPS',
      block: 'variable',
      shadow: 'number',
    });
    expect(canonical['number']).toMatchObject({ parent: 'move', shadow: true, topLevel: false });
    expect(canonical['variable']?.fields?.['VARIABLE']).toEqual({
      name: 'VARIABLE',
      value: 'score',
      id: 'variable-id',
      variableType: '',
    });
    expect(canonical['not']?.inputs).toEqual({});
    expect(deserializeVmBlocks(Object.values(canonical), registry())).toEqual(scripts);
  });

  it('preserves raw mutations and JSON-valued historical fields', () => {
    const source: VmBlock[] = [
      {
        id: 'stop',
        opcode: 'control_stop',
        next: null,
        inputs: {},
        shadow: false,
        topLevel: true,
        fields: { STOP_OPTION: { name: 'STOP_OPTION', value: ['all', { legacy: true }] } },
        mutation: { tagName: 'mutation', children: [], hasnext: 'false' },
      },
    ];
    const scripts = deserializeVmBlocks(source, registry());
    const stop = scripts[0]!.blocks[0]!;
    expect(stop.fields['STOP_OPTION']?.value).toEqual(['all', { legacy: true }]);
    expect(getVmBlocksBlockMetadata(stop)).toEqual({
      version: 1,
      mutation: { tagName: 'mutation', children: [], hasnext: 'false' },
    });
    expect(byId(serializeVmBlocks(scripts))['stop']).toMatchObject({
      fields: { STOP_OPTION: { name: 'STOP_OPTION', value: ['all', { legacy: true }] } },
      mutation: { tagName: 'mutation', children: [], hasnext: 'false' },
    });
  });

  it('normalizes procedure mutations semantically', () => {
    const source: VmBlock[] = [
      {
        id: 'call',
        opcode: 'procedures_call',
        next: null,
        fields: {},
        shadow: false,
        topLevel: true,
        inputs: { argument: { block: 'text', shadow: 'text' } },
        mutation: {
          tagName: 'mutation',
          children: [],
          proccode: 'say %s',
          argumentids: '["argument"]',
          warp: false,
        },
      },
      {
        id: 'text',
        opcode: 'text',
        next: null,
        parent: 'call',
        inputs: {},
        shadow: true,
        fields: { TEXT: { value: 'hello' } },
      },
    ];
    const scripts = deserializeVmBlocks(source, registry());
    expect(scripts[0]?.blocks[0]?.mutation).toEqual({
      type: 'procedure-call',
      proccode: 'say %s',
      argumentIds: ['argument'],
      warp: false,
      returnType: 'statement',
    });
    expect(byId(serializeVmBlocks(scripts))['call']?.mutation).toEqual({
      tagName: 'mutation',
      children: [],
      proccode: 'say %s',
      argumentids: '["argument"]',
      warp: 'false',
    });
  });

  it('accepts omitted VM defaults and derives shadow ownership', () => {
    const source: VmBlock[] = [
      {
        id: 'move',
        opcode: 'motion_movesteps',
        inputs: { STEPS: { block: 'number', shadow: 'number' } },
      },
      {
        id: 'number',
        opcode: 'math_number',
        fields: { NUM: { value: 5 } },
      },
    ];
    const scripts = deserializeVmBlocks(source, registry());
    expect(scripts[0]?.blocks[0]?.inputs['STEPS']).toMatchObject({
      type: 'number',
      value: 5,
      metadata: { scratch: { id: 'number' } },
    });
    expect(byId(serializeVmBlocks(scripts))['number']).toMatchObject({
      shadow: true,
      parent: 'move',
    });
  });

  it('keeps disconnected VM shadow blocks marked as shadows', () => {
    const scripts = deserializeVmBlocks(
      [
        {
          id: 'argument',
          opcode: 'argument_reporter_string_number',
          shadow: true,
          fields: { VALUE: { value: 'name' } },
        },
      ],
      registry(),
    );
    expect(scripts[0]?.blocks[0]?.shadow).toBe(true);
    expect(byId(serializeVmBlocks(scripts))['argument']).toMatchObject({
      topLevel: true,
      parent: null,
      shadow: true,
    });
  });

  it('round-trips statement inputs, block shadows, lists, and broadcasts', () => {
    const source: VmBlock[] = [
      {
        id: 'repeat',
        opcode: 'control_repeat',
        topLevel: true,
        inputs: {
          TIMES: { block: 'times', shadow: 'times' },
          SUBSTACK: { block: 'show', shadow: null },
        },
      },
      {
        id: 'times',
        opcode: 'math_whole_number',
        parent: 'repeat',
        shadow: true,
        fields: { NUM: { value: '3' } },
      },
      {
        id: 'show',
        opcode: 'looks_show',
        parent: 'repeat',
      },
      {
        id: 'key',
        opcode: 'sensing_keypressed',
        topLevel: true,
        inputs: { KEY_OPTION: { block: 'key-menu', shadow: 'key-menu' } },
      },
      {
        id: 'key-menu',
        opcode: 'sensing_keyoptions',
        parent: 'key',
        shadow: true,
        fields: { KEY_OPTION: { value: 'space' } },
      },
      {
        id: 'list',
        opcode: 'data_listcontents',
        topLevel: true,
        x: 20,
        y: 30,
        fields: { LIST: { value: 'items', id: 'list-id', variableType: 'list' } },
      },
      {
        id: 'broadcast',
        opcode: 'event_whenbroadcastreceived',
        topLevel: true,
        fields: {
          BROADCAST_OPTION: {
            value: 'go',
            id: 'broadcast-id',
            variableType: 'broadcast_msg',
          },
        },
      },
    ];

    const scripts = deserializeVmBlocks(source, registry());
    const keyInput = scripts.find((script) => script.blocks[0]?.opcode === 'sensing_keypressed')!
      .blocks[0]!.inputs['KEY_OPTION']!;
    expect(keyInput).toMatchObject({
      type: 'block',
      value: {
        opcode: 'sensing_keyoptions',
        shadow: true,
        metadata: { scratch: { id: 'key-menu' } },
      },
    });
    const canonical = byId(serializeVmBlocks(scripts));
    expect(canonical['repeat']?.inputs?.['SUBSTACK']).toEqual({
      name: 'SUBSTACK',
      block: 'show',
      shadow: null,
    });
    expect(canonical['key']?.inputs?.['KEY_OPTION']).toEqual({
      name: 'KEY_OPTION',
      block: 'key-menu',
      shadow: 'key-menu',
    });
    expect(canonical['key-menu']).toMatchObject({ parent: 'key', shadow: true });
    expect(canonical['list']?.fields?.['LIST']).toEqual({
      name: 'LIST',
      value: 'items',
      id: 'list-id',
      variableType: 'list',
    });
    expect(canonical['broadcast']?.fields?.['BROADCAST_OPTION']).toEqual({
      name: 'BROADCAST_OPTION',
      value: 'go',
      id: 'broadcast-id',
      variableType: 'broadcast_msg',
    });
  });

  it('uses VM array order only to order roots', () => {
    const root: VmBlock = { id: 'root', opcode: 'looks_show', next: 'child' };
    const child: VmBlock = { id: 'child', opcode: 'looks_hide', parent: 'root', shadow: false };
    expect(deserializeVmBlocks([root, child], registry())).toEqual(
      deserializeVmBlocks([child, root], registry()),
    );

    const roots = deserializeVmBlocks(
      [
        { id: 'second', opcode: 'looks_hide' },
        { id: 'first', opcode: 'looks_show' },
      ],
      registry(),
    );
    expect(roots.map((script) => script.blocks[0]?.metadata?.scratch?.id)).toEqual([
      'second',
      'first',
    ]);
  });
});

describe('VM block errors', () => {
  it('uses procedure-call semantic return shape instead of its command base spec', () => {
    expect(
      deserializeVmBlocks(
        [
          {
            id: 'say',
            opcode: 'looks_say',
            next: null,
            parent: null,
            inputs: { MESSAGE: { block: 'call', shadow: null } },
            fields: {},
            topLevel: true,
          },
          {
            id: 'call',
            opcode: 'procedures_call',
            next: null,
            parent: 'say',
            inputs: {},
            fields: {},
            topLevel: false,
            mutation: {
              tagName: 'mutation',
              children: [],
              proccode: 'value',
              argumentids: '[]',
              warp: 'false',
              return: '1',
            },
          },
        ],
        registry(),
      )[0]?.blocks[0],
    ).toMatchObject({
      inputs: { MESSAGE: { value: { mutation: { returnType: 'reporter' } } } },
    });
  });

  it('requires IDs for ordinary blocks and scalar shadows', () => {
    const missingBlock: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'looks_say',
            fields: {},
            inputs: {},
          },
        ],
      },
    ];
    expect(() => serializeVmBlocks(missingBlock)).toThrow(MissingVmBlockIdError);

    const missingShadow: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'looks_say',
            metadata: { scratch: { id: 'say' } },
            fields: {},
            inputs: { MESSAGE: { kind: 'input', type: 'string', value: 'hello' } },
          },
        ],
      },
    ];
    expect(() => serializeVmBlocks(missingShadow)).toThrow(MissingVmBlockIdError);
  });

  it('rejects duplicate IDs across blocks and scalar shadows', () => {
    const scripts: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'looks_say',
            metadata: { scratch: { id: 'same' } },
            fields: {},
            inputs: {
              MESSAGE: {
                kind: 'input',
                type: 'string',
                value: 'hello',
                metadata: { scratch: { id: 'same' } },
              },
            },
          },
        ],
      },
    ];
    expect(() => serializeVmBlocks(scripts)).toThrow(DuplicateVmBlockIdError);
    expect(() =>
      deserializeVmBlocks(
        [
          { id: 'same', opcode: 'looks_hide' },
          { id: 'same', opcode: 'looks_show' },
        ],
        registry(),
      ),
    ).toThrow(DuplicateVmBlockIdError);
  });

  it('rejects invalid JSON, dangling references, cycles, and missing specs', () => {
    expect(() =>
      deserializeVmBlocks(
        [
          {
            id: 'bad',
            opcode: 'looks_say',
            fields: { VALUE: { value: Number.NaN } },
          },
        ],
        registry(),
      ),
    ).toThrow(InvalidVmBlocksError);

    expect(() =>
      deserializeVmBlocks(
        [
          {
            id: 'move',
            opcode: 'motion_movesteps',
            inputs: { STEPS: { block: 'missing', shadow: null } },
          },
        ],
        registry(),
      ),
    ).toThrow(InvalidVmBlocksError);

    expect(() =>
      deserializeVmBlocks(
        [
          {
            id: 'a',
            opcode: 'looks_show',
            next: 'b',
          },
          {
            id: 'b',
            opcode: 'looks_hide',
            next: 'a',
          },
        ],
        registry(),
      ),
    ).toThrow(InvalidVmBlocksError);

    expect(() =>
      deserializeVmBlocks(
        [{ id: 'unknown', opcode: 'extension_missing' }],
        createBlockSpecRegistry(),
      ),
    ).toThrow(MissingBlockSpecError);
  });

  it('rejects shared subgraphs and non-JSON AST data', () => {
    expect(() =>
      deserializeVmBlocks(
        [
          {
            id: 'say',
            opcode: 'looks_say',
            inputs: { MESSAGE: { block: 'text', shadow: null } },
          },
          {
            id: 'think',
            opcode: 'looks_think',
            inputs: { MESSAGE: { block: 'text', shadow: null } },
          },
          {
            id: 'text',
            opcode: 'text',
            fields: { TEXT: { value: 'shared' } },
          },
        ],
        registry(),
      ),
    ).toThrow(InvalidVmBlocksError);

    const invalidAst = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'looks_show',
            metadata: { scratch: { id: 'show' } },
            fields: { VALUE: { kind: 'field', type: 'text', value: undefined } },
            inputs: {},
          },
        ],
      },
    ] as unknown as Script[];
    expect(() => serializeVmBlocks(invalidAst)).toThrow(InvalidVmBlocksError);
  });

  it('rejects an explicit shadow flag which conflicts with its input edge', () => {
    expect(() =>
      deserializeVmBlocks(
        [
          {
            id: 'move',
            opcode: 'motion_movesteps',
            inputs: { STEPS: { block: 'number', shadow: 'number' } },
          },
          {
            id: 'number',
            opcode: 'math_number',
            shadow: false,
            fields: { NUM: { value: '10' } },
          },
        ],
        registry(),
      ),
    ).toThrowError(new InvalidVmBlocksError('Block "number" has shadow false; expected true.'));
  });
});
