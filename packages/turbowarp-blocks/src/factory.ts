import type { Block, BlockInput, Field, Input, NumericKind } from '@scratch-code/ast';
import {
  createBlockSpecRegistry,
  type BlockSpec,
  type BlockSpecRegistry,
  type InputSpec,
} from '@scratch-code/block-spec';

import type {
  ProcedureCallResolveContext,
  ProcedurePrototypeArgumentContext,
  ProcedurePrototypeResolveContext,
  TurboWarpBlockResolveContext,
  TurboWarpProcedureArgumentType,
} from './context.js';
import { InvalidTurboWarpBlockContextError } from './errors.js';
import { turboWarpBlockSpecs } from './specs.js';

const requireContext = <TContext extends Exclude<TurboWarpBlockResolveContext, undefined>>(
  opcode: string,
  expectedKind: TContext['kind'],
  context: TurboWarpBlockResolveContext,
): TContext => {
  if (context?.kind !== expectedKind)
    throw new InvalidTurboWarpBlockContextError(opcode, expectedKind);
  return context as TContext;
};

const argumentTypes = new Set(['number', 'string', 'boolean']);
const validCallContext = (context: ProcedureCallResolveContext): boolean =>
  ['statement', 'reporter', 'boolean'].includes(context.returnType) &&
  Array.isArray(context.arguments) &&
  context.arguments.every(
    (argument) => typeof argument?.id === 'string' && argumentTypes.has(argument.type),
  );
const validPrototypeContext = (context: ProcedurePrototypeResolveContext): boolean =>
  Array.isArray(context.arguments) &&
  context.arguments.every(
    (argument) =>
      typeof argument?.id === 'string' &&
      typeof argument.name === 'string' &&
      argumentTypes.has(argument.type),
  );

const numericDefault = (value: number, numericKind: NumericKind): Input => ({
  kind: 'input',
  type: 'number',
  value,
  metadata: { scratch: { numericKind } },
});

const callInput = (type: TurboWarpProcedureArgumentType): InputSpec => {
  if (type === 'boolean') return { connection: 'value', accepts: 'boolean' };
  if (type === 'number')
    return { connection: 'value', accepts: 'number', default: numericDefault(1, 'number') };
  return {
    connection: 'value',
    accepts: 'string',
    default: { kind: 'input', type: 'string', value: '' },
  };
};

const reporterDefault = (argument: ProcedurePrototypeArgumentContext): BlockInput => {
  const field: Field = { kind: 'field', type: 'text', value: argument.name };
  const block: Block = {
    kind: 'block',
    opcode:
      argument.type === 'boolean' ? 'argument_reporter_boolean' : 'argument_reporter_string_number',
    inputs: {},
    fields: { VALUE: field },
  };
  return { kind: 'input', type: 'block', value: block };
};

const resolveControlStop = (
  baseSpec: BlockSpec,
  context: TurboWarpBlockResolveContext,
): BlockSpec => {
  const stop = requireContext<{ kind: 'control-stop'; readonly hasNext: boolean }>(
    baseSpec.opcode,
    'control-stop',
    context,
  );
  if (typeof stop.hasNext !== 'boolean')
    throw new InvalidTurboWarpBlockContextError(baseSpec.opcode, 'control-stop');
  if (!stop.hasNext) return baseSpec;
  return {
    opcode: baseSpec.opcode,
    shape: 'command',
    inputs: baseSpec.inputs,
    fields: baseSpec.fields,
    arguments: baseSpec.arguments,
    ...(baseSpec.bindings === undefined ? {} : { bindings: baseSpec.bindings }),
    ...(baseSpec.source === undefined ? {} : { source: baseSpec.source }),
  };
};

const resolveProcedureCall = (
  baseSpec: BlockSpec,
  context: TurboWarpBlockResolveContext,
): BlockSpec => {
  const call = requireContext<ProcedureCallResolveContext>(
    baseSpec.opcode,
    'procedure-call',
    context,
  );
  if (!validCallContext(call))
    throw new InvalidTurboWarpBlockContextError(baseSpec.opcode, 'procedure-call');
  const inputs = Object.fromEntries(
    call.arguments.map((argument) => [argument.id, callInput(argument.type)]),
  );
  const common = {
    opcode: baseSpec.opcode,
    inputs,
    fields: baseSpec.fields,
    arguments: call.arguments.map((argument) => ({ kind: 'input' as const, name: argument.id })),
    ...(baseSpec.bindings === undefined ? {} : { bindings: baseSpec.bindings }),
    ...(baseSpec.source === undefined ? {} : { source: baseSpec.source }),
  };
  if (call.returnType === 'boolean') return { ...common, shape: 'boolean' };
  if (call.returnType === 'reporter') return { ...common, shape: 'reporter', outputType: 'any' };
  return { ...common, shape: 'command' };
};

const resolveProcedurePrototype = (
  baseSpec: BlockSpec,
  context: TurboWarpBlockResolveContext,
): BlockSpec => {
  const prototype = requireContext<ProcedurePrototypeResolveContext>(
    baseSpec.opcode,
    'procedure-prototype',
    context,
  );
  if (!validPrototypeContext(prototype))
    throw new InvalidTurboWarpBlockContextError(baseSpec.opcode, 'procedure-prototype');
  const inputs = Object.fromEntries(
    prototype.arguments.map((argument) => [
      argument.id,
      {
        connection: 'value' as const,
        accepts: argument.type,
        default: reporterDefault(argument),
      },
    ]),
  );
  return {
    opcode: baseSpec.opcode,
    shape: 'command',
    inputs,
    fields: baseSpec.fields,
    arguments: prototype.arguments.map((argument) => ({
      kind: 'input' as const,
      name: argument.id,
    })),
    ...(baseSpec.bindings === undefined ? {} : { bindings: baseSpec.bindings }),
    ...(baseSpec.source === undefined ? {} : { source: baseSpec.source }),
  };
};

export const createTurboWarpBlockRegistry = (): BlockSpecRegistry<TurboWarpBlockResolveContext> => {
  const registry = createBlockSpecRegistry<TurboWarpBlockResolveContext>();
  for (const spec of turboWarpBlockSpecs) {
    if (spec.opcode === 'control_stop') registry.register(spec, resolveControlStop);
    else if (spec.opcode === 'procedures_call') registry.register(spec, resolveProcedureCall);
    else if (spec.opcode === 'procedures_prototype')
      registry.register(spec, resolveProcedurePrototype);
    else registry.register(spec);
  }
  return registry;
};
