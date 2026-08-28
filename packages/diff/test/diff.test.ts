import type { Block, Input, Script } from '@scratch-code/ast';
import { describe, expect, it } from 'vitest';

import { diffScripts, InvalidDiffInputError, type DiffChange } from '../src/index.js';

const block = (
  opcode: string,
  options: {
    readonly id?: string;
    readonly shadow?: true;
    readonly fields?: Block['fields'];
    readonly inputs?: Block['inputs'];
    readonly mutation?: Block['mutation'];
  } = {},
): Block => ({
  kind: 'block',
  opcode,
  fields: options.fields ?? {},
  inputs: options.inputs ?? {},
  ...(options.id === undefined ? {} : { metadata: { scratch: { id: options.id } } }),
  ...(options.shadow === undefined ? {} : { shadow: options.shadow }),
  ...(options.mutation === undefined ? {} : { mutation: options.mutation }),
});

const script = (...blocks: Block[]): Script => ({ kind: 'script', blocks });

const field = (value: string, id?: string): Block['fields'][string] => ({
  kind: 'field',
  type: id === undefined ? 'text' : 'variable',
  value,
  ...(id === undefined ? {} : { id }),
});

const stringInput = (value: string): Input => ({ kind: 'input', type: 'string', value });

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const changesOf = (changes: readonly DiffChange[], type: DiffChange['type']): DiffChange[] =>
  changes.filter((change) => change.type === type);

describe('semantic additions, removals, and modifications', () => {
  it('reports Script additions and removals at the highest unmatched root', () => {
    const before = [script(block('event_whenflagclicked'))];
    const after = [...before, script(block('unknownExtension_run'))];
    const added = diffScripts(before, after);
    expect(changesOf(added.changes, 'add')).toEqual([
      expect.objectContaining({ target: { kind: 'script', path: ['scripts', 1] } }),
    ]);
    expect(changesOf(added.changes, 'remove')).toHaveLength(0);

    const removed = diffScripts(after, before);
    expect(changesOf(removed.changes, 'remove')).toEqual([
      expect.objectContaining({ target: { kind: 'script', path: ['scripts', 1] } }),
    ]);
    expect(changesOf(removed.changes, 'add')).toHaveLength(0);
  });

  it('aligns an ID-less stack across a middle insertion and deletion', () => {
    const before = [script(block('a'), block('c'))];
    const after = [script(block('a'), block('b'), block('c'))];
    const added = diffScripts(before, after);
    expect(changesOf(added.changes, 'add')).toEqual([
      expect.objectContaining({ target: { kind: 'block', path: ['scripts', 0, 'blocks', 1] } }),
    ]);
    expect(added.relations).toHaveLength(0);
    expect(added.pairs.filter((pair) => pair.kind === 'block').map((pair) => pair.basis)).toEqual([
      'ordered',
      'ordered',
    ]);

    const removed = diffScripts(after, before);
    expect(changesOf(removed.changes, 'remove')).toHaveLength(1);
    expect(removed.relations).toHaveLength(0);
  });

  it('compares block, field, input, and mutation properties', () => {
    const before = [
      script(
        block('procedures_call', {
          id: 'call',
          fields: { VARIABLE: field('score', 'variable-before') },
          inputs: { VALUE: stringInput('before') },
          mutation: {
            type: 'procedure-call',
            proccode: 'do %s',
            argumentIds: ['arg'],
            warp: false,
            returnType: 'statement',
          },
        }),
      ),
    ];
    const after = [
      script(
        block('procedures_call_changed', {
          id: 'call',
          shadow: true,
          fields: { VARIABLE: field('points', 'variable-after') },
          inputs: { VALUE: stringInput('after'), EMPTY: { kind: 'input', type: 'empty' } },
          mutation: {
            type: 'procedure-call',
            proccode: 'do %s',
            argumentIds: ['renamed'],
            warp: true,
            returnType: 'reporter',
          },
        }),
      ),
    ];
    const result = diffScripts(before, after);
    const modifiedKinds = changesOf(result.changes, 'modify').map((change) =>
      change.type === 'modify' ? change.kind : '',
    );
    expect(modifiedKinds).toEqual(['block', 'mutation', 'field', 'input']);
    expect(changesOf(result.changes, 'add')).toEqual([
      expect.objectContaining({ target: expect.objectContaining({ kind: 'input' }) }),
    ]);
    expect(JSON.stringify(result)).toContain('argumentIds');
    expect(JSON.stringify(result)).toContain('variable-after');
  });

  it('keeps a missing input distinct from an explicit EmptyInput', () => {
    const before = [script(block('test', { id: 'root' }))];
    const after = [
      script(
        block('test', {
          id: 'root',
          inputs: { VALUE: { kind: 'input', type: 'empty' } },
        }),
      ),
    ];
    const result = diffScripts(before, after);
    expect(changesOf(result.changes, 'add')).toEqual([
      expect.objectContaining({
        target: { kind: 'input', path: ['scripts', 0, 'blocks', 0, 'inputs', 'VALUE'] },
      }),
    ]);
  });
});

describe('nested inputs and shadows', () => {
  const nestedFixture = (message: string, count: string): Script[] => [
    script(
      block('control_repeat', {
        id: 'repeat',
        inputs: {
          CONDITION: {
            kind: 'input',
            type: 'block',
            value: block('operator_not', {
              id: 'reporter',
              inputs: { OPERAND: stringInput(message) },
            }),
            obscuredShadow: { kind: 'input', type: 'number', value: count },
          },
          SUBSTACK: {
            kind: 'input',
            type: 'script',
            value: script(
              block('looks_say', {
                id: 'say',
                inputs: { MESSAGE: stringInput(message) },
              }),
            ),
          },
        },
      }),
    ),
  ];

  it('diffs nested reporters, substacks, and obscured shadows by path', () => {
    const result = diffScripts(nestedFixture('before', '10'), nestedFixture('after', '20'));
    const paths = changesOf(result.changes, 'modify').flatMap((change) =>
      change.type === 'modify' ? [change.before.path.join('.')] : [],
    );
    expect(paths).toContain('scripts.0.blocks.0.inputs.CONDITION.value.inputs.OPERAND');
    expect(paths).toContain('scripts.0.blocks.0.inputs.CONDITION.obscuredShadow');
    expect(paths).toContain('scripts.0.blocks.0.inputs.SUBSTACK.value.blocks.0.inputs.MESSAGE');
  });

  it('reports shadow replacement and obscuredShadow add/remove without expanding subtrees', () => {
    const before = [
      script(
        block('root', {
          id: 'root',
          inputs: {
            VALUE: {
              kind: 'input',
              type: 'block',
              value: block('menu', { id: 'menu-before', shadow: true }),
            },
          },
        }),
      ),
    ];
    const after = [
      script(
        block('root', {
          id: 'root',
          inputs: {
            VALUE: {
              kind: 'input',
              type: 'block',
              value: block('reporter', { id: 'reporter-after' }),
              obscuredShadow: {
                kind: 'input',
                type: 'block',
                value: block('menu', { id: 'menu-shadow', shadow: true }),
              },
            },
          },
        }),
      ),
    ];
    const result = diffScripts(before, after);
    expect(changesOf(result.changes, 'remove')).toHaveLength(1);
    expect(changesOf(result.changes, 'add')).toHaveLength(2);
  });
});

describe('matching strategies', () => {
  it('uses a unique Scratch ID before opcode or structure', () => {
    const result = diffScripts(
      [script(block('before_opcode', { id: 'same' }))],
      [script(block('after_opcode', { id: 'same' }))],
    );
    expect(result.pairs).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'block', basis: 'scratch-id' })]),
    );
    expect(changesOf(result.changes, 'modify')).toHaveLength(1);
  });

  it('supports ordered-only matching', () => {
    const result = diffScripts(
      [script(block('a'), block('c'))],
      [script(block('a'), block('b'), block('c'))],
      {
        matching: [{ kind: 'ordered' }],
      },
    );
    expect(result.pairs.every((pair) => pair.basis === 'ordered')).toBe(true);
    expect(changesOf(result.changes, 'add')).toHaveLength(1);
  });

  it('honors strategy order for local matches', () => {
    const before = [script(block('same', { id: 'same' }))];
    const after = [script(block('same', { id: 'same' }))];
    const result = diffScripts(before, after, {
      matching: [{ kind: 'ordered' }, { kind: 'scratch-id' }],
    });
    expect(result.pairs.every((pair) => pair.basis === 'ordered')).toBe(true);
  });

  it('uses conservative similarity when IDs disappear or change', () => {
    const result = diffScripts(
      [script(block('looks_say', { id: 'before', fields: { LABEL: field('before') } }))],
      [script(block('looks_say', { id: 'after', fields: { LABEL: field('after') } }))],
    );
    expect(result.pairs).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'block', basis: 'similarity' })]),
    );
    expect(changesOf(result.changes, 'modify')).toHaveLength(1);
    expect(changesOf(result.changes, 'add')).toHaveLength(0);
    expect(changesOf(result.changes, 'remove')).toHaveLength(0);
  });

  it('does not similarity-match ambiguous duplicate candidates', () => {
    const body = (left: string, right: string): Script[] => [
      script(
        block('root', {
          id: 'root',
          inputs: {
            BODY: {
              kind: 'input',
              type: 'script',
              value: script(
                block('looks_say', { fields: { LABEL: field(left) } }),
                block('looks_say', { fields: { LABEL: field(right) } }),
              ),
            },
          },
        }),
      ),
    ];
    const result = diffScripts(body('a', 'b'), body('c', 'd'), {
      matching: [{ kind: 'scratch-id' }, { kind: 'similarity' }],
    });
    expect(result.pairs.filter((pair) => pair.kind === 'block')).toHaveLength(1);
    expect(changesOf(result.changes, 'remove')).toHaveLength(2);
    expect(changesOf(result.changes, 'add')).toHaveLength(2);
  });

  it('does not treat duplicate Scratch IDs as unambiguous ID matches', () => {
    const before = [script(block('a', { id: 'duplicate' }), block('b', { id: 'duplicate' }))];
    const after = [script(block('a', { id: 'duplicate' }), block('b', { id: 'duplicate' }))];
    const result = diffScripts(before, after);
    expect(result.pairs.filter((pair) => pair.basis === 'scratch-id')).toHaveLength(0);
    expect(result.changes).toHaveLength(0);
  });
});

describe('move relations', () => {
  it('keeps a reorder correct as remove/add when move relations are ignored', () => {
    const before = [
      script(block('a', { id: 'a' }), block('b', { id: 'b' }), block('c', { id: 'c' })),
    ];
    const after = [
      script(block('b', { id: 'b' }), block('a', { id: 'a' }), block('c', { id: 'c' })),
    ];
    const result = diffScripts(before, after);
    expect(result.relations).toHaveLength(1);
    const relation = result.relations[0]!;
    expect(result.changes.find((change) => change.id === relation.removeChangeId)?.type).toBe(
      'remove',
    );
    expect(result.changes.find((change) => change.id === relation.addChangeId)?.type).toBe('add');
  });

  it('does not report moves for index shifts caused by an insertion', () => {
    const before = [script(block('a', { id: 'a' }), block('c', { id: 'c' }))];
    const after = [
      script(block('a', { id: 'a' }), block('b', { id: 'b' }), block('c', { id: 'c' })),
    ];
    expect(diffScripts(before, after).relations).toHaveLength(0);
  });

  it('annotates top-level Script reordering', () => {
    const before = [script(block('a', { id: 'a' })), script(block('b', { id: 'b' }))];
    const after = [script(block('b', { id: 'b' })), script(block('a', { id: 'a' }))];
    const result = diffScripts(before, after);
    expect(result.relations).toEqual([
      expect.objectContaining({
        type: 'move',
        before: expect.objectContaining({ kind: 'script' }),
      }),
    ]);
  });

  it('links unique Blocks moved between paired input containers', () => {
    const childInput = (value: Block): Input => ({ kind: 'input', type: 'block', value });
    const before = [
      script(
        block('root', {
          id: 'root',
          inputs: {
            LEFT: childInput(block('left', { id: 'left' })),
            RIGHT: childInput(block('right', { id: 'right' })),
          },
        }),
      ),
    ];
    const after = [
      script(
        block('root', {
          id: 'root',
          inputs: {
            LEFT: childInput(block('right', { id: 'right' })),
            RIGHT: childInput(block('left', { id: 'left' })),
          },
        }),
      ),
    ];
    const result = diffScripts(before, after);
    expect(result.relations).toHaveLength(2);
    expect(
      result.relations.every(
        (relation) =>
          result.changes.find((change) => change.id === relation.removeChangeId)?.type ===
            'remove' &&
          result.changes.find((change) => change.id === relation.addChangeId)?.type === 'add',
      ),
    ).toBe(true);
  });
});

describe('boundaries and determinism', () => {
  it('compares unknown opcodes without a registry and ignores metadata-only changes', () => {
    const before = [
      {
        ...script(block('unknownExtension_do', { id: 'before-id' })),
        metadata: { scratch: { x: 1, y: 2 }, source: { codec: 'before' } },
      },
    ];
    const after = [
      {
        ...script(block('unknownExtension_do', { id: 'after-id' })),
        metadata: { scratch: { x: 100, y: 200 }, source: { codec: 'after' } },
      },
    ];
    const result = diffScripts(before, after);
    expect(result.changes).toHaveLength(0);
    expect(result.pairs.some((pair) => pair.basis === 'scratch-id')).toBe(false);
  });

  it('does not mutate frozen inputs and returns a detached JSON-safe result', () => {
    const before = deepFreeze([script(block('test', { fields: { VALUE: field('before') } }))]);
    const after = deepFreeze([script(block('test', { fields: { VALUE: field('after') } }))]);
    const result = diffScripts(before, after);
    const json = JSON.stringify(result);
    expect(JSON.parse(json)).toEqual(result);
    expect(before[0]!.blocks[0]!.fields['VALUE']!.value).toBe('before');
  });

  it('is deterministic across runs and record insertion order', () => {
    const firstFields = { B: field('two'), A: field('one') };
    const secondFields = { A: field('one'), B: field('changed') };
    const before = [script(block('test', { fields: firstFields }))];
    const after = [script(block('test', { fields: secondFields }))];
    const one = diffScripts(before, after);
    const two = diffScripts(before, after);
    expect(two).toEqual(one);
    expect(
      diffScripts([script(block('test', { fields: { A: field('one'), B: field('two') } }))], after),
    ).toEqual(one);
  });

  it('reports invalid input diagnostics with their side', () => {
    const invalid = [
      { kind: 'script', blocks: [{ kind: 'block', opcode: 10 }] },
    ] as unknown as Script[];
    let thrown: unknown;
    try {
      diffScripts([], invalid);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(InvalidDiffInputError);
    expect((thrown as InvalidDiffInputError).inputs[0]?.side).toBe('after');
  });
});
