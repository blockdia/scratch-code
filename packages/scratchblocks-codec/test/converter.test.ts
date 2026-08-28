import { describe, expect, it } from 'vitest';

import type { Block, Input, Script } from '@scratch-code/ast';
import { createBlockSpecRegistry } from '@scratch-code/block-spec';
import { deserializeSb3Blocks } from '@scratch-code/sb3';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import { Comment, Glow, allLanguages, parse } from 'scratchblocks-plus/syntax';

import {
  deserializeScratchblocks,
  MissingScratchblocksSpecMetadataError,
  ScratchblocksTypeMismatchError,
  serializeScratchblocks,
} from '../src/index.js';
import { corpusFragments } from './fixtures/corpus.js';

const registry = () => createTurboWarpBlockRegistry();

const semanticInput = (input: Input): unknown => {
  if (input.type === 'block') return { type: 'block', value: semanticBlock(input.value) };
  if (input.type === 'script') return { type: 'script', value: semanticScript(input.value) };
  if (input.type === 'empty') return { type: 'empty' };
  return { type: input.type, value: input.value };
};

const semanticBlock = (block: Block): unknown => ({
  opcode: block.opcode,
  inputs: Object.fromEntries(
    Object.entries(block.inputs).map(([name, input]) => [name, semanticInput(input)]),
  ),
  fields: Object.fromEntries(
    Object.entries(block.fields).map(([name, field]) => [
      name,
      {
        type: field.type,
        value: field.value,
      },
    ]),
  ),
  ...(block.mutation === undefined ? {} : { mutation: block.mutation }),
});

const semanticScript = (script: Script): unknown => ({ blocks: script.blocks.map(semanticBlock) });

describe('ordinary Scratch blocks', () => {
  it('uses BlockSpec arguments and explicit scratchblocks binding without block JSON', () => {
    const customRegistry = createBlockSpecRegistry();
    customRegistry.register({
      opcode: 'extension_move',
      shape: 'command',
      inputs: { VALUE: { connection: 'value', accepts: 'number' } },
      fields: {},
      arguments: [{ kind: 'input', name: 'VALUE' }],
      bindings: { scratchblocks: { blockId: 'MOTION_MOVESTEPS' } },
    });
    const scripts: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'extension_move',
            inputs: { VALUE: { kind: 'input', type: 'number', value: '7' } },
            fields: {},
          },
        ],
      },
    ];
    const document = serializeScratchblocks(scripts, customRegistry);
    expect(document.stringify()).toBe('move (7) steps');
    expect(deserializeScratchblocks(document, customRegistry)[0]?.blocks[0]).toMatchObject({
      opcode: 'extension_move',
      inputs: { VALUE: { type: 'number', value: '7' } },
    });
  });

  it('round-trips fields, nested reporters, C blocks, and menu shadows', () => {
    const source = [
      'set [score v] to ((x position) + (1))',
      'go to (random position v)',
      'if <(score) > (0)> then',
      '  say [yes]',
      'else',
      '  repeat (2)',
      '    move (10) steps',
      '  end',
      'end',
    ].join('\n');
    const first = deserializeScratchblocks(parse(source, { languages: ['en'] }), registry());
    expect(first[0]?.blocks.map((block) => block.opcode)).toEqual([
      'data_setvariableto',
      'motion_goto',
      'control_if_else',
    ]);
    expect(first[0]?.blocks[1]?.inputs['TO']).toMatchObject({
      type: 'block',
      value: { opcode: 'motion_goto_menu', fields: { TO: { value: '_random_' } } },
    });
    expect(first[0]?.blocks[0]?.inputs['VALUE']).toMatchObject({ type: 'block' });
    const repeat = first[0]?.blocks[2]?.inputs['SUBSTACK2'];
    if (repeat?.type !== 'script') throw new Error('Expected else script');
    const times = repeat.value.blocks[0]?.inputs['TIMES'];
    if (times?.type !== 'number') throw new Error('Expected numeric repeat count');
    expect(times.metadata?.scratch?.numericKind).toBe('whole-number');

    const document = serializeScratchblocks(first, registry());
    expect(document.stringify()).toBe(source.replace('(score) > (0)', '(score) > [0]'));
    const second = deserializeScratchblocks(document, registry());
    expect(second.map(semanticScript)).toEqual(first.map(semanticScript));
  });

  it('uses registry types for loose coercion and offers strict mode', () => {
    const document = parse('move [not a number] steps :: motion', { languages: ['en'] });
    const block = document.scripts[0]!.blocks[0]!;
    if (!block.isBlock) throw new Error('Expected a block');
    block.info.selector = 'sb3:motion_movesteps';
    const loose = deserializeScratchblocks(document, registry());
    expect(loose[0]?.blocks[0]?.inputs['STEPS']).toMatchObject({
      kind: 'input',
      type: 'number',
      value: 'not a number',
    });
    expect(() => deserializeScratchblocks(document, registry(), { coercion: 'strict' })).toThrow(
      ScratchblocksTypeMismatchError,
    );
  });

  it('rebuilds labels through scratchblocks translate', () => {
    const scripts = deserializeScratchblocks(
      parse('move (10) steps', { languages: ['en'] }),
      registry(),
    );
    const english = allLanguages['en']!;
    const language = {
      ...english,
      code: 'test',
      name: 'Test',
      commands: { ...english.commands, MOTION_MOVESTEPS: 'mover %1 pasos' },
    };
    expect(serializeScratchblocks(scripts, registry(), { language }).stringify()).toBe(
      'mover (10) pasos',
    );
  });

  it('keeps control_stop stack-shaped when a following block exists', () => {
    const source = 'stop [other scripts in sprite v]\nmove (1) steps';
    const scripts = deserializeScratchblocks(parse(source, { languages: ['en'] }), registry());
    const document = serializeScratchblocks(scripts, registry());
    const stop = document.scripts[0]?.blocks[0];
    expect(stop?.isBlock && stop.info.shape).toBe('stack');
    expect(document.stringify()).toBe(source);
  });
});

describe('custom procedures and scratchblocks metadata', () => {
  it('shares deterministic argument IDs and uses Scratch 3 defaults', () => {
    const source = 'define p (number) [text] <ok?>\np (1) [hello] <>';
    const scripts = deserializeScratchblocks(parse(source, { languages: ['en'] }), registry());
    const definition = scripts[0]!.blocks[0]!;
    const call = scripts[0]!.blocks[1]!;
    const prototypeInput = definition.inputs['custom_block']!;
    if (prototypeInput.type !== 'block') throw new Error('Expected prototype');
    const mutation = prototypeInput.value.mutation;
    expect(mutation).toMatchObject({
      type: 'procedure-prototype',
      argumentDefaults: ['', '', false],
      warp: false,
    });
    if (mutation?.type !== 'procedure-prototype' || call.mutation?.type !== 'procedure-call') {
      throw new Error('Expected procedure mutations');
    }
    expect(call.mutation.argumentIds).toEqual(mutation.argumentIds);
    expect(serializeScratchblocks(scripts, registry()).scripts[0]?.blocks).toHaveLength(2);
  });

  it('allows callers to replace the deterministic procedure ID allocator', () => {
    const scripts = deserializeScratchblocks(
      parse('define p (value)', { languages: ['en'] }),
      registry(),
      {
        createProcedureArgumentId: (context) => `custom-${context.argumentIndex}`,
      },
    );
    const definition = scripts[0]!.blocks[0]!;
    const prototype = definition.inputs['custom_block'];
    expect(prototype).toMatchObject({
      type: 'block',
      value: { mutation: { argumentIds: ['custom-0'] } },
    });
  });

  it('preserves comments, diff markers, and glow wrappers', () => {
    const document = parse('move (10) steps', { languages: ['en'] });
    const block = document.scripts[0]!.blocks[0]!;
    if (!block.isBlock) throw new Error('Expected a block');
    block.comment = new Comment('kept', true);
    block.diff = '-';
    document.scripts[0]!.blocks[0] = new Glow(block);
    const scripts = deserializeScratchblocks(document, registry());
    expect(scripts[0]?.blocks[0]?.metadata?.['scratchblocks']).toEqual({
      version: 1,
      comment: 'kept',
      diff: '-',
      glow: true,
    });
    const restored = serializeScratchblocks(scripts, registry()).scripts[0]!.blocks[0]!;
    expect(restored.isGlow).toBe(true);
    if (!restored.isGlow || !restored.child.isBlock) throw new Error('Expected a block glow');
    expect(restored.child.comment?.label.value).toBe('kept');
    expect(restored.child.diff).toBe('-');
  });
});

describe('real SB3 corpus fragments', () => {
  for (const fragment of corpusFragments) {
    it(`${fragment.name} from ${fragment.source}`, () => {
      const initial = deserializeSb3Blocks(fragment.blocks, registry());
      const document = serializeScratchblocks(initial, registry());
      const restored = deserializeScratchblocks(document, registry());
      expect(restored.map(semanticScript)).toEqual(initial.map(semanticScript));
    });
  }
});

describe('errors', () => {
  it('requires ordering metadata when a spec mixes multiple slots', () => {
    const customRegistry = createBlockSpecRegistry();
    customRegistry.register({
      opcode: 'extension_missing_metadata',
      shape: 'command',
      inputs: { VALUE: { connection: 'value', accepts: 'string' } },
      fields: { MODE: { type: 'dropdown' } },
      arguments: [],
    });
    const script: Script = {
      kind: 'script',
      blocks: [
        {
          kind: 'block',
          opcode: 'extension_missing_metadata',
          inputs: { VALUE: { kind: 'input', type: 'string', value: 'x' } },
          fields: { MODE: { kind: 'field', type: 'dropdown', value: 'mode' } },
        },
      ],
    };
    expect(() => serializeScratchblocks([script], customRegistry)).toThrow(
      MissingScratchblocksSpecMetadataError,
    );
  });
});
