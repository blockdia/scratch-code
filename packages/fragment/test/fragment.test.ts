import { describe, expect, it } from 'vitest';

import type { Block, Field, JsonValue, ProcedureReturnType, Script } from '@scratch-code/ast';

import {
  analyzeScripts,
  createScratchFragment,
  DuplicateProcedureDefinitionError,
} from '../src/index.js';

const field = (type: 'variable' | 'list' | 'broadcast', value: JsonValue, id?: string): Field => ({
  kind: 'field',
  type,
  value,
  ...(id === undefined ? {} : { id }),
});

const call = (proccode: string, returnType: ProcedureReturnType = 'statement'): Block => ({
  kind: 'block',
  opcode: 'procedures_call',
  inputs: {},
  fields: {},
  mutation: {
    type: 'procedure-call',
    proccode,
    argumentIds: [],
    warp: false,
    returnType,
  },
});

const command = (opcode: string, blocks: Block[] = []): Block => ({
  kind: 'block',
  opcode,
  fields: {},
  inputs:
    blocks.length === 0
      ? {}
      : {
          SUBSTACK: {
            kind: 'input',
            type: 'script',
            value: { kind: 'script', blocks },
          },
        },
});

const ordinaryScript = (...blocks: Block[]): Script => ({ kind: 'script', blocks });

const definitionScript = (
  proccode: string,
  body: Block[] = [],
  definitionId?: string,
  prototypeId?: string,
): Script => ({
  kind: 'script',
  blocks: [
    {
      kind: 'block',
      opcode: 'procedures_definition',
      fields: {},
      inputs: {
        custom_block: {
          kind: 'input',
          type: 'block',
          value: {
            kind: 'block',
            opcode: 'procedures_prototype',
            fields: {},
            inputs: {},
            mutation: {
              type: 'procedure-prototype',
              proccode,
              argumentIds: [],
              argumentNames: [],
              argumentDefaults: [],
              warp: false,
            },
            ...(prototypeId === undefined ? {} : { metadata: { scratch: { id: prototypeId } } }),
          },
        },
      },
      ...(definitionId === undefined ? {} : { metadata: { scratch: { id: definitionId } } }),
    },
    ...body,
  ],
});

describe('analyzeScripts', () => {
  it('deduplicates resource references by semantic identity without creating IDs', () => {
    const scripts: Script[] = [
      ordinaryScript({
        kind: 'block',
        opcode: 'data_setvariableto',
        inputs: {
          HIDDEN: {
            kind: 'input',
            type: 'string',
            value: 'active',
            obscuredShadow: {
              kind: 'input',
              type: 'block',
              value: {
                kind: 'block',
                opcode: 'data_variable',
                inputs: {},
                fields: { VARIABLE: field('variable', 'renamed', 'variable-id') },
              },
            },
          },
        },
        fields: {
          VARIABLE: field('variable', 'score', 'variable-id'),
          SAME_VALUE_A: field('variable', { b: 2, a: 1 }),
          SAME_VALUE_B: field('variable', { a: 1, b: 2 }),
          LIST: field('list', 'items'),
          BROADCAST: field('broadcast', 'message', 'broadcast-id'),
        },
      }),
    ];

    const analysis = analyzeScripts(scripts);
    expect(analysis.variables).toEqual([
      { value: 'score', id: 'variable-id' },
      { value: { b: 2, a: 1 } },
    ]);
    expect(analysis.lists).toEqual([{ value: 'items' }]);
    expect(analysis.broadcasts).toEqual([{ value: 'message', id: 'broadcast-id' }]);
    expect(analysis.variables.every((reference) => reference.id !== '')).toBe(true);
  });

  it('reads definitions only from top blocks and finds calls recursively', () => {
    const topDefinition = definitionScript('defined');
    const nonTopDefinition = definitionScript('not top').blocks[0]!;
    const scripts = [
      topDefinition,
      ordinaryScript(
        command('control_if', [
          call('defined', 'statement'),
          call('missing', 'reporter'),
          call('missing', 'boolean'),
        ]),
        nonTopDefinition,
      ),
    ];

    const analysis = analyzeScripts(scripts);
    expect(analysis.procedureDefinitions.map((definition) => definition.proccode)).toEqual([
      'defined',
    ]);
    expect(
      analysis.procedureCalls.map((procedureCall) => [
        procedureCall.proccode,
        procedureCall.returnType,
      ]),
    ).toEqual([
      ['defined', 'statement'],
      ['missing', 'reporter'],
      ['missing', 'boolean'],
    ]);
    expect(
      analysis.unresolvedProcedureCalls.map((procedureCall) => procedureCall.returnType),
    ).toEqual(['reporter', 'boolean']);
  });

  it('deduplicates exact calls while preserving reporter and boolean variants', () => {
    const scripts = [
      ordinaryScript(
        call('value', 'reporter'),
        call('value', 'reporter'),
        call('value', 'boolean'),
      ),
    ];
    expect(analyzeScripts(scripts).procedureCalls.map((item) => item.returnType)).toEqual([
      'reporter',
      'boolean',
    ]);
  });

  it('resolves statement, reporter, and boolean calls through one proccode identity', () => {
    const analysis = analyzeScripts([
      definitionScript('shared'),
      ordinaryScript(
        call('shared', 'statement'),
        call('shared', 'reporter'),
        call('shared', 'boolean'),
      ),
    ]);
    expect(analysis.procedureCalls.map((item) => item.returnType)).toEqual([
      'statement',
      'reporter',
      'boolean',
    ]);
    expect(analysis.unresolvedProcedureCalls).toEqual([]);
  });

  it('reports known and unknown extension IDs without a registry', () => {
    const analysis = analyzeScripts([
      ordinaryScript(
        command('motion_movesteps'),
        command('music_playNoteForBeats'),
        command('unknown-extension_doThing'),
        command('unknown-extension_menu_option'),
      ),
    ]);
    expect(analysis.extensions).toEqual(['music', 'unknown-extension']);
  });
});

describe('createScratchFragment', () => {
  it('adds the transitive closure in source order, not discovery order', () => {
    const selected = [ordinaryScript(call('A'))];
    const source = [
      ordinaryScript(command('source_resource_that_must_not_be_copied')),
      definitionScript('C', [], 'definition-c'),
      definitionScript('B', [call('C')], 'definition-b'),
      definitionScript('A', [call('B')], 'definition-a'),
    ];
    const selectedSnapshot = JSON.parse(JSON.stringify(selected)) as Script[];
    const sourceSnapshot = JSON.parse(JSON.stringify(source)) as Script[];

    const fragment = createScratchFragment(selected, { sourceScripts: source });
    expect(
      fragment.scripts.map(
        (script) => analyzeScripts([script]).procedureDefinitions[0]?.proccode ?? 'selected',
      ),
    ).toEqual(['selected', 'C', 'B', 'A']);
    expect(fragment.dependencies.procedures).toEqual([]);
    expect(selected).toEqual(selectedSnapshot);
    expect(source).toEqual(sourceSnapshot);
    expect(fragment.scripts[1]).not.toBe(source[1]);
  });

  it('terminates direct and mutual recursion without duplicating definitions', () => {
    const direct = createScratchFragment([ordinaryScript(call('A'))], {
      sourceScripts: [definitionScript('A', [call('A')], 'a')],
    });
    expect(direct.scripts).toHaveLength(2);

    const mutual = createScratchFragment([ordinaryScript(call('A'))], {
      sourceScripts: [
        definitionScript('A', [call('B')], 'a'),
        definitionScript('B', [call('A')], 'b'),
      ],
    });
    expect(mutual.scripts).toHaveLength(3);
    expect(mutual.dependencies.procedures).toEqual([]);
  });

  it('keeps transitive unresolved procedure dependencies minimal and unique', () => {
    const fragment = createScratchFragment([ordinaryScript(call('A'))], {
      sourceScripts: [
        definitionScript('A', [call('external', 'reporter'), call('external', 'boolean')], 'a'),
      ],
    });
    expect(
      analyzeScripts(fragment.scripts).unresolvedProcedureCalls.map((item) => item.returnType),
    ).toEqual(['reporter', 'boolean']);
    expect(fragment.dependencies.procedures).toEqual([{ proccode: 'external' }]);
  });

  it('does not append a selected definition again', () => {
    const selectedDefinition = definitionScript('A', [call('B')], 'selected-a');
    const sourceClone = JSON.parse(JSON.stringify(selectedDefinition)) as Script;
    const fragment = createScratchFragment([selectedDefinition], {
      sourceScripts: [sourceClone, definitionScript('B', [], 'b')],
    });
    expect(fragment.scripts).toHaveLength(2);
    expect(
      analyzeScripts(fragment.scripts).procedureDefinitions.map((item) => item.proccode),
    ).toEqual(['A', 'B']);
  });

  it('uses concrete definition IDs to recognize one reachable occurrence', () => {
    const first = definitionScript('A', [], 'same-definition');
    const clone = JSON.parse(JSON.stringify(first)) as Script;
    const fragment = createScratchFragment([ordinaryScript(call('A'))], {
      sourceScripts: [first, clone],
    });
    expect(fragment.scripts).toHaveLength(2);
  });

  it('falls back to prototype IDs when the definition top block has no ID', () => {
    const first = definitionScript('A', [], undefined, 'same-prototype');
    const clone = JSON.parse(JSON.stringify(first)) as Script;
    const fragment = createScratchFragment([ordinaryScript(call('A'))], {
      sourceScripts: [first, clone],
    });
    expect(fragment.scripts).toHaveLength(2);
  });

  it('rejects ambiguity in selected scripts or the reachable closure', () => {
    expect(() =>
      createScratchFragment([definitionScript('A', [], 'a-1'), definitionScript('A', [], 'a-2')]),
    ).toThrow(DuplicateProcedureDefinitionError);

    expect(() =>
      createScratchFragment([ordinaryScript(call('A'))], {
        sourceScripts: [definitionScript('A', [], 'a-1'), definitionScript('A', [], 'a-2')],
      }),
    ).toThrow(DuplicateProcedureDefinitionError);
  });

  it('ignores duplicate definitions which are outside the reachable closure', () => {
    const fragment = createScratchFragment([ordinaryScript(call('A'))], {
      sourceScripts: [
        definitionScript('A', [], 'a'),
        definitionScript('unused', [], 'unused-1'),
        definitionScript('unused', [], 'unused-2'),
      ],
    });
    expect(fragment.scripts).toHaveLength(2);
  });

  it('preserves selected order, dependencies, JSON round-trip, and input AST', () => {
    const selected = [
      ordinaryScript({
        kind: 'block',
        opcode: 'unknown_run',
        inputs: {},
        fields: {
          VARIABLE: field('variable', 'score'),
          LIST: field('list', 'items', 'list-id'),
          BROADCAST: field('broadcast', 'message'),
        },
      }),
      ordinaryScript(call('missing', 'reporter'), call('missing', 'boolean')),
    ];
    const snapshot = JSON.parse(JSON.stringify(selected)) as Script[];
    const fragment = createScratchFragment(selected);

    expect(selected).toEqual(snapshot);
    expect(fragment.scripts).not.toBe(selected);
    expect(fragment.scripts[0]).not.toBe(selected[0]);
    expect(fragment.scripts).toEqual(selected);
    expect(fragment.dependencies).toEqual({
      variables: [{ value: 'score' }],
      lists: [{ value: 'items', id: 'list-id' }],
      broadcasts: [{ value: 'message' }],
      procedures: [{ proccode: 'missing' }],
      extensions: ['unknown'],
    });
    expect(JSON.parse(JSON.stringify(fragment))).toEqual(fragment);
  });

  it('rejects non-JSON AST values instead of normalizing them during cloning', () => {
    const selected = [
      ordinaryScript({
        kind: 'block',
        opcode: 'test',
        inputs: { VALUE: { kind: 'input', type: 'number', value: Number.NaN } },
        fields: {},
      }),
    ];
    expect(() => createScratchFragment(selected)).toThrow(TypeError);
    expect((selected[0]!.blocks[0]!.inputs['VALUE'] as { value: number }).value).toBeNaN();
  });
});
