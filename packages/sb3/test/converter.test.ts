import { describe, expect, it } from 'vitest';

import type { Block, Script } from '@scratch-code/ast';
import { createBlockSpecRegistry, MissingBlockSpecError } from '@scratch-code/block-spec';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';

import {
  deserializeSb3Blocks,
  DuplicateBlockIdError,
  getSb3BlockMetadata,
  InvalidBlockGraphError,
  MissingBlockIdError,
  serializeSb3Blocks,
  type Sb3Blocks,
} from '../src/index.js';

describe('empty inputs', () => {
  it('materializes omitted inputs and omits EmptyInput when serializing', () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: 'operator_and',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 122,
        y: 340,
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts[0]?.blocks[0]?.inputs).toMatchObject({
      OPERAND1: { type: 'empty' },
      OPERAND2: { type: 'empty' },
    });
    expect(serializeSb3Blocks(scripts)).toEqual(blocks);
  });

  it('normalizes legacy [1, null] inputs to omitted keys', () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: 'operator_not',
        next: null,
        parent: null,
        inputs: { OPERAND: [1, null] },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 1,
        y: 2,
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts[0]?.blocks[0]?.inputs['OPERAND']).toMatchObject({ type: 'empty' });
    expect((serializeSb3Blocks(scripts)['a'] as { inputs: object }).inputs).toEqual({});
  });
});

describe('SB3 fidelity', () => {
  it('preserves primitives, obscured shadows, comments, and top-level reporters', () => {
    const blocks: Sb3Blocks = {
      hat: {
        opcode: 'event_whenflagclicked',
        next: 'move',
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 10,
        y: 20,
      },
      move: {
        opcode: 'motion_movesteps',
        next: null,
        parent: 'hat',
        inputs: { STEPS: [3, [12, 'score', 'variable'], [4, '0010']] },
        fields: {},
        shadow: false,
        topLevel: false,
        comment: 'comment-id',
      },
      variableReporter: [12, 'score', 'variable', 200, 300],
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts).toHaveLength(2);
    expect(scripts[0]?.blocks[1]?.inputs['STEPS']).toMatchObject({
      type: 'block',
      value: { opcode: 'data_variable' },
    });
    expect(serializeSb3Blocks(scripts)).toEqual(blocks);
  });

  it('updates modeled literal values while retaining their input encoding', () => {
    const blocks: Sb3Blocks = {
      move: {
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: [1, [4, '10']] },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    const input = scripts[0]!.blocks[0]!.inputs['STEPS']!;
    if (input.type === 'number') input.value = '25';
    expect((serializeSb3Blocks(scripts)['move'] as { inputs: object }).inputs).toEqual({
      STEPS: [1, [4, '25']],
    });
  });

  it('round-trips object scalar shadows and disconnected components', () => {
    const blocks: Sb3Blocks = {
      move: {
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: [1, 'number'] },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
      number: {
        opcode: 'math_number',
        next: null,
        parent: 'move',
        inputs: {},
        fields: { NUM: ['10'] },
        shadow: true,
        topLevel: false,
      },
      orphan: {
        opcode: 'looks_hide',
        next: null,
        parent: 'move',
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts).toHaveLength(2);
    const steps = scripts[0]!.blocks[0]!.inputs['STEPS']!;
    expect(steps).toMatchObject({ type: 'number', value: '10' });
    expect(steps.metadata?.scratch?.id).toBe('number');
    expect(steps.metadata?.scratch).not.toHaveProperty('sb3');
    if (steps.type === 'number') steps.value = '20';
    const serialized = serializeSb3Blocks(scripts);
    expect((serialized['number'] as { fields: object }).fields).toEqual({ NUM: ['20'] });
    expect(serialized['orphan']).toEqual({
      ...blocks['orphan'],
      parent: null,
      topLevel: true,
    });
  });

  it('keeps a shadow as the semantic value of [3, null, shadow]', () => {
    const blocks: Sb3Blocks = {
      not: {
        opcode: 'operator_not',
        next: null,
        parent: null,
        inputs: { OPERAND: [3, null, 'equals'] },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
      equals: {
        opcode: 'operator_equals',
        next: null,
        parent: 'not',
        inputs: { OPERAND1: [1, [10, '']], OPERAND2: [1, [10, '']] },
        fields: {},
        shadow: true,
        topLevel: false,
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts[0]?.blocks[0]?.inputs['OPERAND']).toMatchObject({
      type: 'block',
      value: { opcode: 'operator_equals' },
    });
    const shadowBlock = scripts[0]!.blocks[0]!.inputs['OPERAND'];
    if (shadowBlock?.type !== 'block') throw new Error('Expected shadow block');
    expect(shadowBlock.value.shadow).toBe(true);
    expect(getSb3BlockMetadata(shadowBlock.value)).toBeUndefined();
    expect(shadowBlock.value.metadata?.scratch).not.toHaveProperty('sb3');
    expect((serializeSb3Blocks(scripts)['not'] as { inputs: object }).inputs).toEqual({
      OPERAND: [1, 'equals'],
    });
  });

  it('keeps identified primitive reporters as ordinary connected blocks', () => {
    const scripts: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'looks_say',
            metadata: { scratch: { id: 'say' } },
            fields: {},
            inputs: {
              MESSAGE: {
                kind: 'input',
                type: 'block',
                value: {
                  kind: 'block',
                  opcode: 'data_variable',
                  metadata: { scratch: { id: 'variable' } },
                  fields: {
                    VARIABLE: {
                      kind: 'field',
                      type: 'variable',
                      value: 'score',
                      id: 'variable-id',
                    },
                  },
                  inputs: {},
                },
              },
            },
          },
        ],
      },
    ];

    expect(serializeSb3Blocks(scripts)).toMatchObject({
      say: { inputs: { MESSAGE: [2, 'variable'] } },
      variable: {
        opcode: 'data_variable',
        shadow: false,
        fields: { VARIABLE: ['score', 'variable-id'] },
      },
    });
  });

  it('normalizes procedure mutations semantically and writes canonical mutation JSON', () => {
    const blocks: Sb3Blocks = {
      call: {
        opcode: 'procedures_call',
        next: null,
        parent: null,
        inputs: { argument: [1, [10, 'value']] },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 4,
        y: 8,
        mutation: {
          tagName: 'mutation',
          children: [],
          proccode: 'do %s',
          argumentids: '["argument"]',
        },
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts[0]?.blocks[0]?.mutation).toEqual({
      type: 'procedure-call',
      proccode: 'do %s',
      argumentIds: ['argument'],
      warp: false,
      returnType: 'statement',
    });
    expect((serializeSb3Blocks(scripts)['call'] as { mutation: object }).mutation).toEqual({
      tagName: 'mutation',
      children: [],
      proccode: 'do %s',
      argumentids: '["argument"]',
      warp: 'false',
    });
  });
});

describe('errors', () => {
  it('requires every serialized opcode to exist in the registry', () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: 'extension_missing',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
    };
    expect(() => deserializeSb3Blocks(blocks, createBlockSpecRegistry())).toThrow(
      MissingBlockSpecError,
    );
  });

  it('does not allocate missing IDs', () => {
    const block: Block = { kind: 'block', opcode: 'motion_movesteps', inputs: {}, fields: {} };
    const script: Script = { kind: 'script', blocks: [block] };
    expect(() => serializeSb3Blocks([script])).toThrow(MissingBlockIdError);
  });

  it('rejects distinct blocks with duplicate IDs', () => {
    const makeBlock = (): Block => ({
      kind: 'block',
      opcode: 'event_whenflagclicked',
      inputs: {},
      fields: {},
      metadata: { scratch: { id: 'same' } },
    });
    expect(() =>
      serializeSb3Blocks([
        { kind: 'script', blocks: [makeBlock()] },
        { kind: 'script', blocks: [makeBlock()] },
      ]),
    ).toThrow(DuplicateBlockIdError);
  });
});

describe('independent script provenance', () => {
  const splitFixture = (): Sb3Blocks => ({
    first: {
      opcode: 'looks_hide',
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: true,
      x: 1,
      y: 2,
    },
    second: {
      opcode: 'motion_movesteps',
      next: null,
      parent: null,
      inputs: { STEPS: [3, 'score', [4, '10']] },
      fields: {},
      shadow: false,
      topLevel: true,
      x: 3,
      y: 4,
    },
    score: [12, 'score', 'variable-id'],
  });

  it('serializes a filtered Script subset with its own obscured shadow', () => {
    const scripts = deserializeSb3Blocks(splitFixture(), createTurboWarpBlockRegistry());
    const steps = scripts[1]?.blocks[0]?.inputs['STEPS'];
    expect(steps).toMatchObject({
      type: 'block',
      value: { opcode: 'data_variable' },
      obscuredShadow: { type: 'number', value: '10' },
    });
    const serialized = serializeSb3Blocks(scripts.slice(1));
    expect(serialized['first']).toBeUndefined();
    expect((serialized['second'] as { inputs: object }).inputs).toEqual({
      STEPS: [3, 'score', [4, '10']],
    });
    expect(serialized['score']).toEqual({
      opcode: 'data_variable',
      next: null,
      parent: 'second',
      inputs: {},
      fields: { VARIABLE: ['score', 'variable-id'] },
      shadow: false,
      topLevel: false,
    });
  });

  it('keeps mode 3 shadow local when a Script is cloned and moved', () => {
    const script = JSON.parse(
      JSON.stringify(deserializeSb3Blocks(splitFixture(), createTurboWarpBlockRegistry())[1]!),
    ) as Script;
    script.metadata = { scratch: { x: 90, y: 120 } };
    const serialized = serializeSb3Blocks([script]);
    expect(serialized['second']).toMatchObject({
      x: 90,
      y: 120,
      inputs: { STEPS: [3, 'score', [4, '10']] },
    });
  });

  it('uses typed metadata.sb3 without raw graph snapshots', () => {
    const scripts = deserializeSb3Blocks(splitFixture(), createTurboWarpBlockRegistry());
    const block = scripts[1]!.blocks[0]!;
    expect(getSb3BlockMetadata(block)).toBeUndefined();
    const json = JSON.stringify(scripts);
    expect(json).not.toContain('sourceBlocks');
    expect(json).not.toContain('representedIds');
    expect(json).not.toContain('"source":');
    expect(json).not.toContain('"scratch":{"sb3"');
  });

  it('keeps provenance size incremental instead of snapshot-sized', () => {
    const blocks = splitFixture();
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(JSON.stringify(scripts).length).toBeLessThan(JSON.stringify(blocks).length * 3);
  });
});

describe('tree validation and hacked-but-editable inputs', () => {
  it('uses procedure-call semantic return shape instead of its command base spec', () => {
    const blocks: Sb3Blocks = {
      say: {
        opcode: 'looks_say',
        next: null,
        parent: null,
        inputs: { MESSAGE: [2, 'call'] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      call: {
        opcode: 'procedures_call',
        next: null,
        parent: 'say',
        inputs: {},
        fields: {},
        shadow: false,
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
    };
    expect(
      deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry())[0]?.blocks[0],
    ).toMatchObject({ inputs: { MESSAGE: { value: { mutation: { returnType: 'reporter' } } } } });
  });

  it('preserves a number reporter connected to a declared boolean slot', () => {
    const blocks: Sb3Blocks = {
      not: {
        opcode: 'operator_not',
        next: null,
        parent: null,
        inputs: { OPERAND: [2, 'sum'] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      sum: {
        opcode: 'operator_add',
        next: null,
        parent: 'not',
        inputs: { NUM1: [1, [4, '1']], NUM2: [1, [4, '2']] },
        fields: {},
        shadow: false,
        topLevel: false,
      },
    };
    const scripts = deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry());
    expect(scripts[0]?.blocks[0]?.inputs['OPERAND']).toMatchObject({
      type: 'block',
      value: { opcode: 'operator_add' },
    });
    expect(serializeSb3Blocks(scripts)).toEqual(blocks);
  });

  it('rejects shared blocks', () => {
    const blocks: Sb3Blocks = {
      add: {
        opcode: 'operator_add',
        next: null,
        parent: null,
        inputs: { NUM1: [2, 'value'], NUM2: [2, 'value'] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      value: {
        opcode: 'operator_random',
        next: null,
        parent: 'add',
        inputs: { FROM: [1, [4, '1']], TO: [1, [4, '10']] },
        fields: {},
        shadow: false,
        topLevel: false,
      },
    };
    expect(() => deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry())).toThrow(
      InvalidBlockGraphError,
    );
  });

  it('rejects cycles', () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: 'looks_hide',
        next: 'b',
        parent: 'b',
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      },
      b: {
        opcode: 'looks_show',
        next: 'a',
        parent: 'a',
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      },
    };
    expect(() => deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry())).toThrow(
      InvalidBlockGraphError,
    );
  });

  it('rejects command blocks in value inputs', () => {
    const blocks: Sb3Blocks = {
      move: {
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: [2, 'hide'] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      hide: {
        opcode: 'looks_hide',
        next: null,
        parent: 'move',
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      },
    };
    expect(() => deserializeSb3Blocks(blocks, createTurboWarpBlockRegistry())).toThrow(
      InvalidBlockGraphError,
    );
  });
});
