import { describe, expect, it, vi } from 'vitest';

import {
  BlockSpecRegistry,
  DuplicateBlockSpecError,
  InvalidResolvedBlockSpecError,
  MissingBlockSpecError,
  createBlockSpecRegistry,
  type BlockSpec,
  type CommandBlockSpec,
} from '../src/index.js';

const moveSteps: CommandBlockSpec = {
  opcode: 'motion_movesteps',
  shape: 'command',
  inputs: {
    STEPS: {
      connection: 'value',
      accepts: 'number',
      default: {
        kind: 'input',
        type: 'number',
        value: 10,
        metadata: { scratch: { numericKind: 'number' } },
      },
    },
  },
  fields: {},
  arguments: [{ kind: 'input', name: 'STEPS' }],
};

describe('BlockSpecRegistry', () => {
  it('registers, queries, enumerates, and unregisters base specs', () => {
    const registry = createBlockSpecRegistry();

    expect(registry.size).toBe(0);
    expect(registry.register(moveSteps)).toBe(registry);
    expect(registry.get('motion_movesteps')).toBe(moveSteps);
    expect(registry.require('motion_movesteps')).toBe(moveSteps);
    expect(registry.resolve('motion_movesteps', undefined)).toBe(moveSteps);
    expect(registry.resolveRequired('motion_movesteps', undefined)).toBe(moveSteps);
    expect(registry.has('motion_movesteps')).toBe(true);
    expect([...registry.opcodes()]).toEqual(['motion_movesteps']);
    expect(registry.unregister('motion_movesteps')).toBe(true);
    expect(registry.unregister('motion_movesteps')).toBe(false);
    expect(registry.size).toBe(0);
  });

  it('rejects duplicate registration and missing strict operations', () => {
    const registry = new BlockSpecRegistry().register(moveSteps);

    expect(() => registry.register(moveSteps)).toThrow(DuplicateBlockSpecError);
    expect(() => registry.require('missing')).toThrow(MissingBlockSpecError);
    expect(() => registry.resolveRequired('missing', undefined)).toThrow(MissingBlockSpecError);
    expect(() => new BlockSpecRegistry().replace(moveSteps)).toThrow(MissingBlockSpecError);
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.resolve('missing', undefined)).toBeUndefined();
  });

  it('replaces an existing base spec and its resolver together', () => {
    const terminal: BlockSpec = { ...moveSteps, shape: 'terminal' };
    const registry = new BlockSpecRegistry().register(moveSteps);

    expect(registry.replace(terminal)).toBe(registry);
    expect(registry.get('motion_movesteps')).toBe(terminal);
    expect(registry.resolve('motion_movesteps', undefined)).toBe(terminal);
  });

  it('resolves from a stable base without caching the result', () => {
    type Context = { terminal: boolean };
    const resolver = vi.fn((base: BlockSpec, context: Context): BlockSpec => {
      if (base.shape !== 'command') {
        throw new Error('Expected the command base spec');
      }
      return context.terminal ? { ...base, shape: 'terminal' } : base;
    });
    const registry = createBlockSpecRegistry<Context>().register(moveSteps, resolver);

    const terminal = registry.resolveRequired('motion_movesteps', {
      terminal: true,
    });
    const command = registry.resolveRequired('motion_movesteps', {
      terminal: false,
    });

    expect(terminal.shape).toBe('terminal');
    expect(command.shape).toBe('command');
    expect(terminal).not.toBe(command);
    expect(resolver).toHaveBeenCalledTimes(2);
    expect(resolver.mock.calls[0]?.[0]).toBe(moveSteps);
    expect(resolver.mock.calls[1]?.[0]).toBe(moveSteps);
    expect(registry.get('motion_movesteps')).toBe(moveSteps);
    expect(moveSteps.shape).toBe('command');
  });

  it('rejects a resolver result for another opcode', () => {
    const other: BlockSpec = { ...moveSteps, opcode: 'motion_turnright' };
    const registry = createBlockSpecRegistry().register(moveSteps, () => other);

    expect(() => registry.resolve('motion_movesteps', undefined)).toThrow(
      InvalidResolvedBlockSpecError,
    );
  });

  it('keeps registry instances isolated', () => {
    const first = createBlockSpecRegistry().register(moveSteps);
    const second = createBlockSpecRegistry();

    expect(first.has('motion_movesteps')).toBe(true);
    expect(second.has('motion_movesteps')).toBe(false);
  });
});

describe('SB3-compatible semantic fixtures', () => {
  it('retains canonical shadows, statement slots, fields, and raw source data', () => {
    const specs: BlockSpec[] = [
      moveSteps,
      {
        opcode: 'motion_goto',
        shape: 'command',
        inputs: {
          TO: {
            connection: 'value',
            accepts: 'string',
            default: {
              kind: 'input',
              type: 'block',
              value: {
                kind: 'block',
                opcode: 'motion_goto_menu',
                inputs: {},
                fields: {
                  TO: {
                    kind: 'field',
                    type: 'dropdown',
                    value: '_random_',
                  },
                },
              },
            },
          },
        },
        fields: {},
        arguments: [{ kind: 'input', name: 'TO' }],
      },
      {
        opcode: 'control_repeat',
        shape: 'command',
        inputs: {
          TIMES: {
            connection: 'value',
            accepts: 'number',
            default: {
              kind: 'input',
              type: 'number',
              value: '10',
              metadata: { scratch: { numericKind: 'whole-number' } },
            },
          },
          SUBSTACK: { connection: 'statement' },
        },
        fields: {},
        arguments: [
          { kind: 'input', name: 'TIMES' },
          { kind: 'input', name: 'SUBSTACK' },
        ],
      },
      {
        opcode: 'test_literal_shadows',
        shape: 'command',
        inputs: {
          INTEGER: {
            connection: 'value',
            accepts: 'number',
            default: {
              kind: 'input',
              type: 'number',
              value: -1,
              metadata: { scratch: { numericKind: 'integer' } },
            },
          },
          POSITIVE: {
            connection: 'value',
            accepts: 'number',
            default: {
              kind: 'input',
              type: 'number',
              value: 1,
              metadata: { scratch: { numericKind: 'positive-number' } },
            },
          },
          ANGLE: {
            connection: 'value',
            accepts: 'number',
            default: {
              kind: 'input',
              type: 'number',
              value: 90,
              metadata: { scratch: { numericKind: 'angle' } },
            },
          },
          TEXT: {
            connection: 'value',
            accepts: 'string',
            default: { kind: 'input', type: 'string', value: 'hello' },
          },
          COLOR: {
            connection: 'value',
            accepts: 'color',
            default: { kind: 'input', type: 'color', value: '#ff00aa' },
          },
          MATRIX: {
            connection: 'value',
            accepts: 'matrix',
            default: {
              kind: 'input',
              type: 'matrix',
              value: '0101010101100010101000100',
            },
          },
          NOTE: {
            connection: 'value',
            accepts: 'note',
            default: { kind: 'input', type: 'note', value: 60 },
          },
        },
        fields: {},
        arguments: [
          { kind: 'input', name: 'INTEGER' },
          { kind: 'input', name: 'POSITIVE' },
          { kind: 'input', name: 'ANGLE' },
          { kind: 'input', name: 'TEXT' },
          { kind: 'input', name: 'COLOR' },
          { kind: 'input', name: 'MATRIX' },
          { kind: 'input', name: 'NOTE' },
        ],
      },
      {
        opcode: 'procedures_definition',
        shape: 'hat',
        hatStyle: 'define',
        inputs: {
          custom_block: {
            connection: 'statement',
            default: {
              kind: 'input',
              type: 'block',
              value: {
                kind: 'block',
                opcode: 'procedures_prototype',
                fields: {},
                inputs: {},
                mutation: {
                  type: 'procedure-prototype',
                  proccode: 'do %s',
                  argumentIds: ['arg'],
                  argumentNames: ['value'],
                  argumentDefaults: [''],
                  warp: false,
                },
              },
            },
          },
        },
        fields: {},
        arguments: [{ kind: 'input', name: 'custom_block' }],
      },
      {
        opcode: 'data_variable',
        shape: 'reporter',
        outputType: 'any',
        inputs: {},
        fields: {
          VARIABLE: {
            type: 'variable',
            default: {
              kind: 'field',
              type: 'variable',
              value: 'score',
              id: 'variable-id',
            },
            bindings: { scratchblocks: { shape: 'dropdown' } },
          },
          LIST: {
            type: 'list',
            default: {
              kind: 'field',
              type: 'list',
              value: 'items',
              id: 'list-id',
            },
          },
          BROADCAST_OPTION: {
            type: 'broadcast',
            default: {
              kind: 'field',
              type: 'broadcast',
              value: 'message1',
              id: 'broadcast-id',
            },
          },
        },
        arguments: [
          { kind: 'field', name: 'VARIABLE' },
          { kind: 'field', name: 'LIST' },
          { kind: 'field', name: 'BROADCAST_OPTION' },
        ],
      },
    ];

    const copy = JSON.parse(JSON.stringify(specs)) as BlockSpec[];
    expect(copy).toEqual(specs);
    expect(copy[0]?.inputs['STEPS']?.default).toMatchObject({
      type: 'number',
      metadata: { scratch: { numericKind: 'number' } },
    });
    expect(copy[1]?.inputs['TO']?.default).toMatchObject({
      type: 'block',
      value: { opcode: 'motion_goto_menu' },
    });
    expect(copy[2]?.inputs['SUBSTACK']).toEqual({
      connection: 'statement',
    });
    expect(copy[3]?.inputs['COLOR']?.default).toEqual({
      kind: 'input',
      type: 'color',
      value: '#ff00aa',
    });
    expect(copy[4]).toMatchObject({ shape: 'hat', hatStyle: 'define' });
    expect(copy[5]?.fields['VARIABLE']).toMatchObject({
      type: 'variable',
      default: { id: 'variable-id' },
      bindings: { scratchblocks: { shape: 'dropdown' } },
    });
  });
});
