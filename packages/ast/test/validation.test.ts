import { describe, expect, it } from 'vitest';

import {
  AstValidationError,
  assertValidScripts,
  validateScripts,
  type Block,
  type BlockSpecRegistryLike,
  type Script,
} from '../src/index.js';

class TestRegistry implements BlockSpecRegistryLike {
  readonly #specs = new Map<string, TestBlockSpec>();

  constructor(specs: readonly TestBlockSpec[]) {
    for (const spec of specs) this.#specs.set(spec.opcode, spec);
  }

  get(opcode: string): TestBlockSpec | undefined {
    return this.#specs.get(opcode);
  }
}

interface TestBlockSpec {
  readonly opcode: string;
  readonly shape: 'command' | 'terminal' | 'hat' | 'reporter' | 'boolean';
  readonly outputType?: 'string' | 'number' | 'color' | 'matrix' | 'note' | 'any';
  readonly fields: Readonly<Record<string, { readonly type: 'text' | 'dropdown' }>>;
  readonly inputs: Readonly<
    Record<
      string,
      {
        readonly connection: 'value' | 'statement';
        readonly accepts?: 'string' | 'number' | 'boolean' | 'color' | 'matrix' | 'note' | 'any';
        readonly default?: unknown;
      }
    >
  >;
}

const specs: readonly TestBlockSpec[] = [
  {
    opcode: 'test_root',
    shape: 'command',
    fields: { MODE: { type: 'dropdown' } },
    inputs: {
      VALUE: { connection: 'value', accepts: 'number' },
      BODY: { connection: 'statement' },
    },
  },
  {
    opcode: 'test_command',
    shape: 'command',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'test_reporter',
    shape: 'reporter',
    outputType: 'number',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'test_string_reporter',
    shape: 'reporter',
    outputType: 'string',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'test_boolean',
    shape: 'boolean',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'test_shadow_parent',
    shape: 'command',
    fields: {},
    inputs: {
      VALUE: {
        connection: 'value',
        accepts: 'string',
        default: {
          kind: 'input',
          type: 'block',
          value: { kind: 'block', opcode: 'test_menu', fields: {}, inputs: {} },
        },
      },
    },
  },
  {
    opcode: 'test_menu',
    shape: 'reporter',
    outputType: 'string',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'procedures_definition',
    shape: 'hat',
    fields: {},
    inputs: {
      custom_block: {
        connection: 'statement',
        default: {
          kind: 'input',
          type: 'block',
          value: { kind: 'block', opcode: 'procedures_prototype', fields: {}, inputs: {} },
        },
      },
    },
  },
  {
    opcode: 'procedures_prototype',
    shape: 'command',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'procedures_call',
    shape: 'command',
    fields: {},
    inputs: {},
  },
  {
    opcode: 'argument_reporter_string_number',
    shape: 'reporter',
    outputType: 'number',
    fields: { VALUE: { type: 'text' } },
    inputs: {},
  },
  {
    opcode: 'argument_reporter_boolean',
    shape: 'boolean',
    fields: { VALUE: { type: 'text' } },
    inputs: {},
  },
];

const registry = new TestRegistry(specs);

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const validSemanticScripts = (): Script[] => [
  {
    kind: 'script',
    blocks: [
      {
        kind: 'block',
        opcode: 'test_root',
        metadata: { scratch: { id: 'root-id' } },
        fields: { MODE: { kind: 'field', type: 'dropdown', value: 'normal' } },
        inputs: {
          VALUE: { kind: 'input', type: 'number', value: '0010' },
          BODY: {
            kind: 'input',
            type: 'script',
            value: {
              kind: 'script',
              blocks: [{ kind: 'block', opcode: 'test_command', fields: {}, inputs: {} }],
            },
          },
        },
      },
    ],
  },
];

describe('structural AST validation', () => {
  it('accepts a JSON-safe tree without requiring specs or concrete IDs', () => {
    const scripts = [
      {
        kind: 'script',
        metadata: { scratch: { x: 1, y: 2 }, privateCodec: { version: 1 } },
        blocks: [
          {
            kind: 'block',
            opcode: 'extension_unknown',
            fields: {
              VALUE: { kind: 'field', type: 'text', value: ['legacy', { valid: true }] },
            },
            inputs: {
              VALUE: { kind: 'input', type: 'number', value: 'Infinity' },
            },
          },
        ],
      },
    ];
    const before = JSON.stringify(scripts);

    expect(validateScripts(deepFreeze(scripts))).toEqual([]);
    expect(JSON.stringify(scripts)).toBe(before);
  });

  it('reports required properties, value types, metadata, mutation, and JSON safety', () => {
    const scripts = [
      {
        kind: 'script',
        metadata: { scratch: { x: Number.NaN } },
        blocks: [
          {
            kind: 'block',
            opcode: 1,
            fields: {
              BAD: { kind: 'field', type: 'dropdown', value: () => undefined },
            },
            inputs: {
              BAD: { kind: 'input', type: 'number', value: true },
            },
            mutation: { type: 'procedure-call', proccode: 'x', argumentIds: [], warp: 'no' },
          },
        ],
      },
    ];
    const diagnostics = validateScripts(scripts);

    expect(diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'INVALID_JSON_VALUE',
        'INVALID_METADATA',
        'INVALID_PROPERTY_TYPE',
        'MISSING_PROPERTY',
        'INVALID_MUTATION',
      ]),
    );
  });

  it('detects shared nodes and cycles with the second precise path', () => {
    const shared = { kind: 'field', type: 'text', value: 'same' };
    const sharedScripts = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'test',
            fields: { FIRST: shared, SECOND: shared },
            inputs: {},
          },
        ],
      },
    ];
    expect(validateScripts(sharedScripts)).toContainEqual(
      expect.objectContaining({
        code: 'SHARED_AST_NODE',
        path: ['scripts', 0, 'blocks', 0, 'fields', 'SECOND'],
      }),
    );

    const cyclicBlock: Record<string, unknown> = {
      kind: 'block',
      opcode: 'cycle',
      fields: {},
      inputs: {},
    };
    cyclicBlock['inputs'] = {
      SELF: { kind: 'input', type: 'block', value: cyclicBlock },
    };
    const cycleDiagnostics = validateScripts([{ kind: 'script', blocks: [cyclicBlock] }]);
    expect(cycleDiagnostics).toContainEqual(
      expect.objectContaining({
        code: 'CYCLIC_AST_NODE',
        path: ['scripts', 0, 'blocks', 0, 'inputs', 'SELF', 'value'],
      }),
    );
  });

  it('rejects nested or misplaced obscured shadows structurally', () => {
    const diagnostics = validateScripts([
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'test',
            fields: {},
            inputs: {
              VALUE: {
                kind: 'input',
                type: 'string',
                value: 'active',
                obscuredShadow: {
                  kind: 'input',
                  type: 'number',
                  value: 1,
                  obscuredShadow: { kind: 'input', type: 'number', value: 2 },
                },
              },
            },
          },
        ],
      },
    ]);

    expect(
      diagnostics.filter(({ code }) => code === 'INVALID_OBSCURED_SHADOW').length,
    ).toBeGreaterThan(1);
  });
});

describe('registry semantic validation', () => {
  it('accepts matching fields, value and statement connections, and literal types', () => {
    expect(validateScripts(validSemanticScripts(), { registry })).toEqual([]);
  });

  it('reports missing/extra slots and field, connection, literal, and block-shape mismatches', () => {
    const scripts = validSemanticScripts();
    const root = scripts[0]!.blocks[0]!;
    root.fields['MODE'] = { kind: 'field', type: 'text', value: 'wrong' };
    root.fields['EXTRA'] = { kind: 'field', type: 'text', value: 'extra' };
    root.inputs['VALUE'] = { kind: 'input', type: 'color', value: '#fff' };
    root.inputs['BODY'] = {
      kind: 'input',
      type: 'block',
      value: { kind: 'block', opcode: 'test_reporter', fields: {}, inputs: {} },
    };
    root.inputs['EXTRA'] = { kind: 'input', type: 'empty' };

    const diagnostics = validateScripts(scripts, { registry });
    expect(diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'FIELD_TYPE_MISMATCH',
        'UNEXPECTED_FIELD',
        'INPUT_TYPE_MISMATCH',
        'INPUT_CONNECTION_MISMATCH',
        'BLOCK_SHAPE_MISMATCH',
        'UNEXPECTED_INPUT',
      ]),
    );

    delete root.fields['MODE'];
    delete root.inputs['VALUE'];
    expect(validateScripts(scripts, { registry }).map(({ code }) => code)).toEqual(
      expect.arrayContaining(['MISSING_FIELD', 'MISSING_INPUT']),
    );
  });

  it('accepts round reporters and rejects boolean blocks in number slots', () => {
    const scripts = validSemanticScripts();
    const root = scripts[0]!.blocks[0]!;
    root.inputs['VALUE'] = {
      kind: 'input',
      type: 'block',
      value: { kind: 'block', opcode: 'test_reporter', fields: {}, inputs: {} },
    };
    expect(validateScripts(scripts, { registry })).toEqual([]);

    root.inputs['VALUE'].value.opcode = 'test_boolean';
    expect(validateScripts(scripts, { registry })).toContainEqual(
      expect.objectContaining({ code: 'INPUT_TYPE_MISMATCH' }),
    );
  });

  it('keeps unknown opcodes structural by default and reports them only with a registry', () => {
    const scripts = [
      {
        kind: 'script',
        blocks: [{ kind: 'block', opcode: 'extension_unknown', fields: {}, inputs: {} }],
      },
    ];

    expect(validateScripts(scripts)).toEqual([]);
    expect(validateScripts(scripts, { registry })).toContainEqual(
      expect.objectContaining({
        code: 'MISSING_BLOCK_SPEC',
        path: ['scripts', 0, 'blocks', 0, 'opcode'],
      }),
    );
  });

  it('reports exact paths and the nearest concrete block ID', () => {
    const scripts = validSemanticScripts();
    scripts[0]!.blocks[0]!.inputs['VALUE'] = {
      kind: 'input',
      type: 'color',
      value: '#ff00aa',
    };

    expect(validateScripts(scripts, { registry })).toContainEqual({
      code: 'INPUT_TYPE_MISMATCH',
      severity: 'error',
      path: ['scripts', 0, 'blocks', 0, 'inputs', 'VALUE', 'type'],
      nodeId: 'root-id',
      message: 'Input type "color" is not accepted; expected number.',
    });
  });
});

describe('procedure and shadow semantics', () => {
  const validProcedures = (): Script[] => [
    {
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
                inputs: {
                  number: {
                    kind: 'input',
                    type: 'block',
                    value: {
                      kind: 'block',
                      opcode: 'argument_reporter_string_number',
                      fields: { VALUE: { kind: 'field', type: 'text', value: 'number' } },
                      inputs: {},
                    },
                  },
                  condition: {
                    kind: 'input',
                    type: 'block',
                    value: {
                      kind: 'block',
                      opcode: 'argument_reporter_boolean',
                      fields: { VALUE: { kind: 'field', type: 'text', value: 'condition' } },
                      inputs: {},
                    },
                  },
                },
                mutation: {
                  type: 'procedure-prototype',
                  proccode: 'test %n %b',
                  argumentIds: ['number', 'condition'],
                  argumentNames: ['number', 'condition'],
                  argumentDefaults: ['', false],
                  warp: false,
                },
              },
            },
          },
        },
        {
          kind: 'block',
          opcode: 'procedures_call',
          fields: {},
          inputs: {
            number: { kind: 'input', type: 'number', value: 1 },
            condition: {
              kind: 'input',
              type: 'block',
              value: { kind: 'block', opcode: 'test_boolean', fields: {}, inputs: {} },
            },
          },
          mutation: {
            type: 'procedure-call',
            proccode: 'test %n %b',
            argumentIds: ['number', 'condition'],
            warp: false,
            returnType: 'statement',
          },
        },
      ],
    },
  ];

  it('accepts self-consistent procedure definitions, prototypes, and calls', () => {
    expect(validateScripts(validProcedures(), { registry })).toEqual([]);
  });

  it('reports mutation/opcode, signature, dynamic input, and definition mismatches', () => {
    const scripts = validProcedures();
    const definition = scripts[0]!.blocks[0]!;
    const customBlock = definition.inputs['custom_block'];
    if (customBlock?.type !== 'block') throw new Error('invalid test fixture');
    const prototype = customBlock.value;
    if (prototype.mutation?.type !== 'procedure-prototype') throw new Error('invalid test fixture');
    prototype.mutation.argumentIds[1] = 'number';
    const call = scripts[0]!.blocks[1]!;
    if (call.mutation?.type !== 'procedure-call') throw new Error('invalid test fixture');
    call.mutation.argumentIds.pop();
    definition.inputs['custom_block'] = { kind: 'input', type: 'empty' };

    const diagnostics = validateScripts(scripts, { registry });
    expect(diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['PROCEDURE_SIGNATURE_MISMATCH', 'INVALID_PROCEDURE_DEFINITION']),
    );

    call.mutation = {
      type: 'procedure-prototype',
      proccode: 'wrong',
      argumentIds: [],
      argumentNames: [],
      argumentDefaults: [],
      warp: false,
    };
    expect(validateScripts(scripts, { registry })).toContainEqual(
      expect.objectContaining({ code: 'INVALID_PROCEDURE_MUTATION' }),
    );
  });

  it('validates shadow placement and obscured block flags', () => {
    const valid: Script[] = [
      {
        kind: 'script',
        blocks: [
          {
            kind: 'block',
            opcode: 'test_shadow_parent',
            fields: {},
            inputs: {
              VALUE: {
                kind: 'input',
                type: 'block',
                value: { kind: 'block', opcode: 'test_string_reporter', fields: {}, inputs: {} },
                obscuredShadow: {
                  kind: 'input',
                  type: 'block',
                  value: {
                    kind: 'block',
                    opcode: 'test_menu',
                    shadow: true,
                    fields: {},
                    inputs: {},
                  },
                },
              },
            },
          },
        ],
      },
    ];
    expect(validateScripts(valid, { registry })).toEqual([]);

    const input = valid[0]!.blocks[0]!.inputs['VALUE'];
    if (input?.type !== 'block') throw new Error('invalid test fixture');
    input.value.shadow = true;
    expect(validateScripts(valid, { registry })).toContainEqual(
      expect.objectContaining({ code: 'INVALID_SHADOW_PLACEMENT' }),
    );

    const topShadow: Block = {
      kind: 'block',
      opcode: 'test_menu',
      shadow: true,
      fields: {},
      inputs: {},
    };
    expect(validateScripts([{ kind: 'script', blocks: [topShadow] }], { registry })).toContainEqual(
      expect.objectContaining({ code: 'INVALID_SHADOW_PLACEMENT' }),
    );
  });
});

describe('assertValidScripts', () => {
  it('returns normally for valid input and throws a diagnostic-carrying error for errors', () => {
    expect(() => assertValidScripts(validSemanticScripts(), { registry })).not.toThrow();

    let caught: unknown;
    try {
      assertValidScripts([{ kind: 'script', blocks: [{}] }]);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AstValidationError);
    expect((caught as AstValidationError).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'INVALID_NODE_KIND' }),
    );
  });
});
