import { describe, expect, it } from 'vitest';

import type { BlockSpec, InputValueType } from '@scratch-code/block-spec';
import { createTurboWarpBlockRegistry, turboWarpBlockSpecs } from '@scratch-code/turbowarp-blocks';

interface AuditFailure {
  readonly opcode: string;
  readonly path: string;
  readonly expected: unknown;
  readonly actual: unknown;
}

const literalType = (type: string): InputValueType | undefined =>
  type === 'string' || type === 'number' || type === 'color' || type === 'matrix' || type === 'note'
    ? type
    : undefined;

const auditSpec = (spec: BlockSpec, knownOpcodes: ReadonlySet<string>): AuditFailure[] => {
  const failures: AuditFailure[] = [];
  const fail = (path: string, expected: unknown, actual: unknown): void => {
    failures.push({ opcode: spec.opcode, path, expected, actual });
  };
  const arguments_ = new Set<string>();
  spec.arguments.forEach((argument, index) => {
    const key = `${argument.kind}:${argument.name}`;
    if (arguments_.has(key)) fail(`arguments.${index}`, 'unique field/input reference', key);
    arguments_.add(key);
    const collection = argument.kind === 'field' ? spec.fields : spec.inputs;
    if (!(argument.name in collection))
      fail(`arguments.${index}.name`, `key in ${argument.kind}s`, argument.name);
  });
  for (const name of Object.keys(spec.inputs)) {
    if (!arguments_.has(`input:${name}`))
      fail(`inputs.${name}`, 'ordered argument reference', 'missing');
  }
  for (const name of Object.keys(spec.fields)) {
    if (!arguments_.has(`field:${name}`))
      fail(`fields.${name}`, 'ordered argument reference', 'missing');
  }

  for (const [name, input] of Object.entries(spec.inputs)) {
    const runtimeInput = input as unknown as { readonly accepts?: unknown };
    if (input.connection === 'statement' && runtimeInput.accepts !== undefined) {
      fail(`inputs.${name}.accepts`, 'omitted for statement connection', runtimeInput.accepts);
    }
    if (input.connection === 'value' && runtimeInput.accepts === undefined) {
      fail(`inputs.${name}.accepts`, 'semantic accepted type', runtimeInput.accepts);
    }
    const default_ = input.default;
    if (default_?.type === 'script' && input.connection !== 'statement') {
      fail(`inputs.${name}.default.type`, 'non-script value default', default_.type);
    }
    if (default_?.type === 'block' && !knownOpcodes.has(default_.value.opcode)) {
      fail(`inputs.${name}.default.value.opcode`, 'registered opcode', default_.value.opcode);
    }
    const defaultLiteral = default_ === undefined ? undefined : literalType(default_.type);
    if (input.connection === 'value' && defaultLiteral !== undefined) {
      const accepts = Array.isArray(input.accepts) ? input.accepts : [input.accepts];
      if (!accepts.includes('any') && !accepts.includes(defaultLiteral)) {
        fail(`inputs.${name}.default.type`, input.accepts, defaultLiteral);
      }
    }
  }

  for (const [name, field] of Object.entries(spec.fields)) {
    if (field.default !== undefined && field.default.type !== field.type) {
      fail(`fields.${name}.default.type`, field.type, field.default.type);
    }
    if (
      field.default !== undefined &&
      (field.type === 'variable' || field.type === 'list' || field.type === 'broadcast')
    ) {
      const id = 'id' in field.default ? field.default.id : undefined;
      if (id !== undefined && typeof id !== 'string')
        fail(`fields.${name}.default.id`, 'string or omitted', id);
    }
  }

  const runtimeSpec = spec as unknown as {
    readonly hatStyle?: unknown;
    readonly outputType?: unknown;
  };
  if (
    spec.shape === 'hat' &&
    runtimeSpec.hatStyle !== 'standard' &&
    runtimeSpec.hatStyle !== 'define'
  ) {
    fail('hatStyle', 'standard or define', runtimeSpec.hatStyle);
  }
  if (spec.shape !== 'hat' && runtimeSpec.hatStyle !== undefined)
    fail('hatStyle', 'omitted for non-hat', runtimeSpec.hatStyle);
  if (
    spec.shape === 'reporter' &&
    (typeof runtimeSpec.outputType !== 'string' ||
      !['string', 'number', 'color', 'matrix', 'note', 'any'].includes(runtimeSpec.outputType))
  ) {
    fail('outputType', 'valid reporter output type', runtimeSpec.outputType);
  }
  if (spec.shape !== 'reporter' && runtimeSpec.outputType !== undefined) {
    fail('outputType', 'omitted for non-reporter', runtimeSpec.outputType);
  }
  return failures;
};

describe('machine-readable TurboWarp catalog audit', () => {
  it('satisfies schema, ordering, default, reference, and shape invariants', () => {
    const opcodes = new Set(turboWarpBlockSpecs.map((spec) => spec.opcode));
    const failures = turboWarpBlockSpecs.flatMap((spec) => auditSpec(spec, opcodes));
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  it('has unique scratchblocks identities or an explicit structural ambiguity strategy', () => {
    const byId = new Map<string, BlockSpec[]>();
    for (const spec of turboWarpBlockSpecs) {
      const id = spec.bindings?.scratchblocks?.blockId;
      if (id === undefined) continue;
      byId.set(id, [...(byId.get(id) ?? []), spec]);
    }
    const ambiguous = [...byId.entries()].filter(([, specs]) => specs.length > 1);
    expect(
      ambiguous.map(([id, specs]) => ({ id, opcodes: specs.map((spec) => spec.opcode) })),
    ).toEqual([{ id: 'CONTROL_IF', opcodes: ['control_if', 'control_if_else'] }]);
    const controlIf = byId.get('CONTROL_IF')!;
    expect(new Set(controlIf.map((spec) => spec.arguments.length))).toEqual(new Set([2, 3]));
  });

  it('keeps resolver opcode and all resolved schema invariants', () => {
    const registry = createTurboWarpBlockRegistry();
    const resolved = [
      registry.resolveRequired('control_stop', { kind: 'control-stop', hasNext: true }),
      registry.resolveRequired('procedures_call', {
        kind: 'procedure-call',
        returnType: 'reporter',
        arguments: [
          { id: 'n', type: 'number' },
          { id: 's', type: 'string' },
          { id: 'b', type: 'boolean' },
        ],
      }),
      registry.resolveRequired('procedures_prototype', {
        kind: 'procedure-prototype',
        arguments: [
          { id: 'n', name: 'count', type: 'number' },
          { id: 's', name: 'label', type: 'string' },
          { id: 'b', name: 'ready?', type: 'boolean' },
        ],
      }),
    ];
    const opcodes = new Set(turboWarpBlockSpecs.map((spec) => spec.opcode));
    const failures = resolved.flatMap((spec) => auditSpec(spec, opcodes));
    expect(resolved.map((spec) => spec.opcode)).toEqual([
      'control_stop',
      'procedures_call',
      'procedures_prototype',
    ]);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });
});
