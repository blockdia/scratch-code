import type {
  Block as AstBlock,
  Field,
  Input as AstInput,
  ProcedureArgumentDefault,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script as AstScript,
} from '@scratch-code/ast';
import type {
  BlockSpec,
  BlockSpecRegistry,
  FieldSpec,
  InputSpec,
  InputValueType,
} from '@scratch-code/block-spec';
import {
  Block as ScratchBlockConstructor,
  Comment as ScratchCommentConstructor,
  Document as ScratchDocumentConstructor,
  Glow as ScratchGlowConstructor,
  Icon as ScratchIconConstructor,
  Input as ScratchInputConstructor,
  Label as ScratchLabelConstructor,
  Matrix as ScratchMatrixConstructor,
  Script as ScratchScriptConstructor,
  allLanguages,
  blockName,
} from 'scratchblocks-plus/syntax';
import type {
  Block as ScratchBlock,
  BlockChild as ScratchBlockChild,
  BlockInfo,
  Document as ScratchDocument,
  Glow as ScratchGlow,
  Input as ScratchInput,
  LanguageData,
  Script as ScratchScript,
} from 'scratchblocks-plus/syntax';

import {
  AmbiguousScratchblocksBlockError,
  InvalidScratchblocksAstError,
  MissingScratchblocksSpecMetadataError,
  ScratchblocksTypeMismatchError,
  UnknownScratchblocksBlockError,
} from './errors.js';
import type {
  DeserializeScratchblocksOptions,
  ProcedureArgumentIdContext,
  ScratchblocksCoercion,
  ScratchblocksBlockMetadata,
  ScratchblocksMetadata,
  SerializeScratchblocksOptions,
} from './types.js';

type UnknownRecord = Record<string, unknown>;
type ScratchblocksMetadataContent = {
  comment?: string;
  diff?: '+' | '-';
  glow?: boolean;
};

type OrderedSlot =
  | { readonly kind: 'field'; readonly name: string; readonly spec: FieldSpec }
  | { readonly kind: 'input'; readonly name: string; readonly spec: InputSpec };

interface ProcedureArgument {
  readonly id: string;
  readonly name: string;
  readonly type: 'number' | 'string' | 'boolean';
  readonly defaultValue: ProcedureArgumentDefault;
}

interface ProcedureDescriptor {
  readonly procedureCode: string;
  readonly arguments: readonly ProcedureArgument[];
}

interface DeserializeState<TContext> {
  readonly registry: BlockSpecRegistry<TContext>;
  readonly coercion: ScratchblocksCoercion;
  readonly index: RegistryIndex;
  readonly procedures: ReadonlyMap<string, ProcedureDescriptor>;
  readonly createProcedureArgumentId: (context: ProcedureArgumentIdContext) => string;
}

interface SerializeState<TContext> {
  readonly registry: BlockSpecRegistry<TContext>;
  readonly coercion: ScratchblocksCoercion;
  readonly english: LanguageData;
  readonly language: LanguageData;
}

interface RegistryIndex {
  readonly byBlockId: ReadonlyMap<string, readonly BlockSpec[]>;
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const scratchblocksMetadata = (node: {
  metadata?: Record<string, unknown>;
}): ScratchblocksMetadata | undefined => {
  const value = node.metadata?.['scratchblocks'];
  return isRecord(value) && value['version'] === 1
    ? (value as unknown as ScratchblocksMetadata)
    : undefined;
};

const setScratchblocksMetadata = (
  node: { metadata?: Record<string, unknown> },
  metadata: ScratchblocksMetadataContent,
): void => {
  if (Object.keys(metadata).length === 0) return;
  node.metadata = { ...(node.metadata ?? {}), scratchblocks: { version: 1, ...metadata } };
};

const orderedSlots = (spec: BlockSpec): OrderedSlot[] => {
  const slots: OrderedSlot[] = [];
  const seen = new Set<string>();
  for (const argument of spec.arguments) {
    const key = `${argument.kind}:${argument.name}`;
    if (seen.has(key))
      throw new MissingScratchblocksSpecMetadataError(
        spec.opcode,
        `deduplicate argument "${argument.name}"`,
      );
    seen.add(key);
    if (argument.kind === 'field') {
      const field = spec.fields[argument.name];
      if (field === undefined)
        throw new MissingScratchblocksSpecMetadataError(
          spec.opcode,
          `resolve field "${argument.name}"`,
        );
      slots.push({ kind: 'field', name: argument.name, spec: field });
    } else {
      const input = spec.inputs[argument.name];
      if (input === undefined)
        throw new MissingScratchblocksSpecMetadataError(
          spec.opcode,
          `resolve input "${argument.name}"`,
        );
      slots.push({ kind: 'input', name: argument.name, spec: input });
    }
  }
  for (const name of Object.keys(spec.fields)) {
    if (!seen.has(`field:${name}`))
      throw new MissingScratchblocksSpecMetadataError(spec.opcode, `order field "${name}"`);
  }
  for (const name of Object.keys(spec.inputs)) {
    if (!seen.has(`input:${name}`))
      throw new MissingScratchblocksSpecMetadataError(spec.opcode, `order input "${name}"`);
  }
  return slots;
};

const createRegistryIndex = <TContext>(registry: BlockSpecRegistry<TContext>): RegistryIndex => {
  const mutable = new Map<string, BlockSpec[]>();
  for (const opcode of registry.opcodes()) {
    const spec = registry.require(opcode);
    const blockId = spec.bindings?.scratchblocks?.blockId;
    if (blockId === undefined) continue;
    const entries = mutable.get(blockId) ?? [];
    entries.push(spec);
    mutable.set(blockId, entries);
  }
  return { byBlockId: mutable };
};

const unwrapScratchBlock = (
  block: ScratchBlock | ScratchGlow,
): { block: ScratchBlock; glow: boolean } => {
  if (block.isGlow) {
    if (!block.child.isBlock) {
      throw new InvalidScratchblocksAstError(
        'A script glow cannot be used where a single block is required.',
      );
    }
    return { block: block.child, glow: true };
  }
  return { block, glow: false };
};

const structuralChildren = (block: ScratchBlock): ScratchBlockChild[] =>
  block.children.filter((child) => !child.isLabel && !child.isIcon && !child.isComment);

const scratchShapeMatches = (spec: BlockSpec, block: ScratchBlock): boolean => {
  if (spec.shape === 'reporter') return block.isReporter;
  if (spec.shape === 'boolean') return block.isBoolean;
  if (spec.shape === 'hat') return block.isHat;
  if (spec.shape === 'terminal') return block.isFinal || block.isCommand;
  return block.isCommand || block.hasScript;
};

const candidateMatches = (spec: BlockSpec, block: ScratchBlock): boolean => {
  if (!scratchShapeMatches(spec, block)) return false;
  try {
    return orderedSlots(spec).length === structuralChildren(block).length;
  } catch {
    return false;
  }
};

const describeScratchBlock = (block: ScratchBlock): string => {
  if (block.info.id !== undefined) return `with id "${block.info.id}"`;
  if (block.info.selector !== undefined) return `with selector "${block.info.selector}"`;
  return `"${block.stringify()}"`;
};

const resolveOpcode = <TContext>(
  state: DeserializeState<TContext>,
  block: ScratchBlock,
): string => {
  const selector = block.info.selector;
  if (selector?.startsWith('sb3:')) {
    const opcode = selector.slice(4);
    state.registry.require(opcode);
    return opcode;
  }
  if (selector === 'readVariable') {
    state.registry.require('data_variable');
    return 'data_variable';
  }
  if (selector === 'contentsOfList:') {
    state.registry.require('data_listcontents');
    return 'data_listcontents';
  }
  if (selector === 'getParam') {
    const opcode = block.isBoolean
      ? 'argument_reporter_boolean'
      : 'argument_reporter_string_number';
    state.registry.require(opcode);
    return opcode;
  }

  const candidates: BlockSpec[] = [];
  if (block.info.id !== undefined) {
    candidates.push(...(state.index.byBlockId.get(block.info.id) ?? []));
  }
  const matching = candidates.filter((spec) => candidateMatches(spec, block));
  if (matching.length === 1) return matching[0]!.opcode;
  if (matching.length > 1) {
    throw new AmbiguousScratchblocksBlockError(
      describeScratchBlock(block),
      matching.map((spec) => spec.opcode),
    );
  }
  throw new UnknownScratchblocksBlockError(describeScratchBlock(block));
};

const optionPairs = (field: FieldSpec): Array<readonly [string, string]> =>
  field.bindings?.scratchblocks?.options?.map((option) => [option.label, option.value] as const) ??
  [];

const canonicalFieldValue = (
  input: ScratchInput,
  fieldSpec: FieldSpec,
  english: LanguageData,
): string => {
  const pairs = optionPairs(fieldSpec);
  for (const [label, value] of pairs) {
    if (typeof label === 'string' && input.menu === label) return String(value ?? '');
    if (typeof label === 'string' && english.dropdowns[label]?.value === input.value)
      return String(value ?? '');
  }
  return String(input.value ?? '');
};

const makeField = (
  input: ScratchInput | undefined,
  slot: Extract<OrderedSlot, { kind: 'field' }>,
  english: LanguageData,
): Field => {
  const fallback =
    slot.spec.default === undefined
      ? { kind: 'field' as const, type: slot.spec.type, value: '' }
      : (cloneJson(slot.spec.default) as Field);
  if (input === undefined) return fallback;
  const value = canonicalFieldValue(input, slot.spec, english);
  return {
    kind: 'field',
    type: slot.spec.type,
    value,
    ...('id' in fallback && fallback.id !== undefined ? { id: fallback.id } : {}),
  } as Field;
};

const acceptsList = (spec: InputSpec): readonly InputValueType[] => {
  if (spec.connection === 'statement') return [];
  return typeof spec.accepts === 'string' ? [spec.accepts] : spec.accepts;
};

const sourceValueType = (input: ScratchInput): InputValueType => {
  if (input.isBoolean) return 'boolean';
  if (input.isColor) return 'color';
  if (input.isMatrix || (isRecord(input.value) && input.value['isMatrix'] === true))
    return 'matrix';
  if (input.isRound) return 'number';
  return 'string';
};

const targetValueType = (input: ScratchInput, spec: InputSpec): InputValueType => {
  const source = sourceValueType(input);
  const accepts = acceptsList(spec);
  if (accepts.includes('any') || accepts.includes(source)) return source;
  return accepts[0] ?? source;
};

const matrixBits = (input: ScratchInput): string => {
  if (
    isRecord(input.value) &&
    input.value['isMatrix'] === true &&
    Array.isArray(input.value['rows'])
  ) {
    return input.value['rows']
      .flat()
      .map((value) => (value ? '1' : '0'))
      .join('');
  }
  return String(input.value ?? '').replace(/[^01]/g, '');
};

const literalInput = (
  opcode: string,
  name: string,
  input: ScratchInput,
  spec: InputSpec,
  coercion: ScratchblocksCoercion,
): AstInput => {
  if (spec.connection === 'statement') {
    throw new ScratchblocksTypeMismatchError(opcode, name, 'a script', `input ${input.shape}`);
  }
  const source = sourceValueType(input);
  const target = targetValueType(input, spec);
  if (coercion === 'strict' && target !== source && !acceptsList(spec).includes('any')) {
    throw new ScratchblocksTypeMismatchError(opcode, name, acceptsList(spec).join(' | '), source);
  }
  switch (target) {
    case 'number':
      return {
        kind: 'input',
        type: 'number',
        value: typeof input.value === 'number' ? input.value : String(input.value ?? ''),
        ...(spec.default?.type === 'number' &&
        spec.default.metadata?.scratch?.numericKind !== undefined
          ? { metadata: { scratch: { numericKind: spec.default.metadata.scratch.numericKind } } }
          : {}),
      };
    case 'color':
      return { kind: 'input', type: 'color', value: String(input.value ?? '') };
    case 'matrix':
      return { kind: 'input', type: 'matrix', value: matrixBits(input) };
    case 'note':
      return {
        kind: 'input',
        type: 'note',
        value: typeof input.value === 'number' ? input.value : String(input.value ?? ''),
      };
    case 'boolean':
      return { kind: 'input', type: 'empty' };
    case 'any':
    case 'string':
      return { kind: 'input', type: 'string', value: String(input.value ?? '') };
  }
};

const defaultMenuBlock = (spec: InputSpec): AstBlock | undefined =>
  spec.default?.type === 'block' ? (cloneJson(spec.default.value) as AstBlock) : undefined;

const menuBlockFromInput = <TContext>(
  state: DeserializeState<TContext>,
  input: ScratchInput,
  template: AstBlock,
): AstInput => {
  const nestedSpec = state.registry.require(template.opcode);
  const firstSlot = orderedSlots(nestedSpec).find((slot) => slot.kind === 'field');
  if (firstSlot === undefined || firstSlot.kind !== 'field') {
    throw new InvalidScratchblocksAstError(`Menu shadow "${template.opcode}" has no field.`);
  }
  template.fields[firstSlot.name] = makeField(input, firstSlot, allLanguages['en']!);
  return { kind: 'input', type: 'block', value: template };
};

const procedureTokens = (procedureCode: string): Array<'number' | 'string' | 'boolean'> =>
  [...procedureCode.matchAll(/%([nsb])/g)].map((match) =>
    match[1] === 'n' ? 'number' : match[1] === 'b' ? 'boolean' : 'string',
  );

const defaultArgumentId = (context: ProcedureArgumentIdContext): string =>
  `scratchblocks:${encodeURIComponent(context.procedureCode)}:${context.argumentIndex}`;

const procedureDefault = (type: ProcedureArgument['type']): ProcedureArgumentDefault =>
  type === 'boolean' ? false : '';

const definitionDescriptor = (
  block: ScratchBlock,
  path: string,
  createId: (context: ProcedureArgumentIdContext) => string,
): ProcedureDescriptor | undefined => {
  if (block.info.id !== 'PROCEDURES_DEFINITION' || block.info.call === undefined) return undefined;
  const procedureCode = block.info.call;
  const types = procedureTokens(procedureCode);
  const names = block.info.names ?? [];
  const args = types.map((type, argumentIndex): ProcedureArgument => {
    const argumentName = names[argumentIndex] ?? `argument ${argumentIndex + 1}`;
    const context: ProcedureArgumentIdContext = {
      procedureCode,
      procedurePath: path,
      argumentIndex,
      argumentName,
      argumentType: type,
    };
    return {
      id: createId(context),
      name: argumentName,
      type,
      defaultValue: procedureDefault(type),
    };
  });
  return { procedureCode, arguments: args };
};

const scanDefinitions = (
  document: ScratchDocument,
  createId: (context: ProcedureArgumentIdContext) => string,
): Map<string, ProcedureDescriptor> => {
  const result = new Map<string, ProcedureDescriptor>();
  const visitBlock = (candidate: ScratchBlock | ScratchGlow, path: string): void => {
    if (candidate.isGlow && candidate.child.isScript) {
      visitScript(candidate.child, `${path}.glow`);
      return;
    }
    const { block } = unwrapScratchBlock(candidate);
    const descriptor = definitionDescriptor(block, path, createId);
    if (descriptor !== undefined && !result.has(descriptor.procedureCode)) {
      result.set(descriptor.procedureCode, descriptor);
    }
    block.children.forEach((child, index) => {
      if (child.isBlock || child.isGlow) visitBlock(child, `${path}.${index}`);
      else if (child.isScript) visitScript(child, `${path}.${index}`);
    });
  };
  const visitScript = (script: ScratchScript, path: string): void => {
    script.blocks.forEach((block, index) => visitBlock(block, `${path}.${index}`));
  };
  document.scripts.forEach((script, index) => visitScript(script, String(index)));
  return result;
};

const argumentReporter = (argument: ProcedureArgument): AstBlock => ({
  kind: 'block',
  opcode:
    argument.type === 'boolean' ? 'argument_reporter_boolean' : 'argument_reporter_string_number',
  inputs: {},
  fields: { VALUE: { kind: 'field', type: 'text', value: argument.name } },
});

const convertProcedureDefinition = <TContext>(
  state: DeserializeState<TContext>,
  block: ScratchBlock,
  path: string,
): AstBlock => {
  state.registry.require('procedures_definition');
  state.registry.require('procedures_prototype');
  const procedureCode = block.info.call ?? '';
  const descriptor =
    state.procedures.get(procedureCode) ??
    definitionDescriptor(block, path, state.createProcedureArgumentId)!;
  const mutation: ProcedurePrototypeMutation = {
    type: 'procedure-prototype',
    proccode: descriptor.procedureCode,
    argumentIds: descriptor.arguments.map((argument) => argument.id),
    argumentNames: descriptor.arguments.map((argument) => argument.name),
    argumentDefaults: descriptor.arguments.map((argument) => argument.defaultValue),
    warp: false,
  };
  const prototype: AstBlock = {
    kind: 'block',
    opcode: 'procedures_prototype',
    inputs: Object.fromEntries(
      descriptor.arguments.map((argument) => [
        argument.id,
        {
          kind: 'input',
          type: 'block',
          value: argumentReporter(argument),
        },
      ]),
    ),
    fields: {},
    mutation,
  };
  return {
    kind: 'block',
    opcode: 'procedures_definition',
    inputs: { custom_block: { kind: 'input', type: 'block', value: prototype } },
    fields: {},
  };
};

const syntheticCallDescriptor = <TContext>(
  state: DeserializeState<TContext>,
  block: ScratchBlock,
  path: string,
): ProcedureDescriptor => {
  const procedureCode = block.info.call ?? '';
  const types = procedureTokens(procedureCode);
  const names = block.info.names ?? [];
  return {
    procedureCode,
    arguments: types.map((type, argumentIndex) => {
      const argumentName = names[argumentIndex] ?? `argument ${argumentIndex + 1}`;
      const context: ProcedureArgumentIdContext = {
        procedureCode,
        procedurePath: `${path}.call`,
        argumentIndex,
        argumentName,
        argumentType: type,
      };
      return {
        id: state.createProcedureArgumentId(context),
        name: argumentName,
        type,
        defaultValue: procedureDefault(type),
      };
    }),
  };
};

const argumentInputSpec = (type: ProcedureArgument['type']): InputSpec => ({
  connection: 'value',
  accepts: type,
});

const convertScratchScript = <TContext>(
  state: DeserializeState<TContext>,
  script: ScratchScript,
  path: string,
): AstScript => {
  const blocks: AstBlock[] = [];
  let wholeScriptGlow = false;
  script.blocks.forEach((candidate, index) => {
    if (candidate.isGlow && candidate.child.isScript) {
      const converted = convertScratchScript(state, candidate.child, `${path}.${index}.glow`);
      converted.blocks.forEach((block) => {
        setScratchblocksMetadata(block, { ...(scratchblocksMetadata(block) ?? {}), glow: true });
        blocks.push(block);
      });
      if (script.blocks.length === 1) wholeScriptGlow = true;
    } else {
      blocks.push(convertScratchBlock(state, candidate, `${path}.${index}`));
    }
  });
  const result: AstScript = { kind: 'script', blocks };
  if (wholeScriptGlow) setScratchblocksMetadata(result, { glow: true });
  return result;
};

const convertValueChild = <TContext>(
  state: DeserializeState<TContext>,
  opcode: string,
  slot: Extract<OrderedSlot, { kind: 'input' }>,
  child: ScratchBlockChild | undefined,
  path: string,
): AstInput => {
  if (child === undefined) return { kind: 'input', type: 'empty' };
  if (slot.spec.connection === 'statement') {
    if (child.isScript) {
      const script = convertScratchScript(state, child, path);
      return script.blocks.length === 0
        ? { kind: 'input', type: 'empty' }
        : { kind: 'input', type: 'script', value: script };
    }
    if (state.coercion === 'loose' && (child.isBlock || child.isGlow)) {
      return {
        kind: 'input',
        type: 'script',
        value: { kind: 'script', blocks: [convertScratchBlock(state, child, path)] },
      };
    }
    throw new ScratchblocksTypeMismatchError(
      opcode,
      slot.name,
      'a script',
      child.isInput ? `input ${child.shape}` : 'a value block',
    );
  }
  if (child.isBlock || child.isGlow) {
    return { kind: 'input', type: 'block', value: convertScratchBlock(state, child, path) };
  }
  if (!child.isInput) {
    throw new ScratchblocksTypeMismatchError(opcode, slot.name, 'a value', 'a script');
  }
  const menu = defaultMenuBlock(slot.spec);
  if (menu !== undefined && child.hasArrow) return menuBlockFromInput(state, child, menu);
  return literalInput(opcode, slot.name, child, slot.spec, state.coercion);
};

const convertProcedureCall = <TContext>(
  state: DeserializeState<TContext>,
  block: ScratchBlock,
  path: string,
): AstBlock => {
  state.registry.require('procedures_call');
  const descriptor =
    state.procedures.get(block.info.call ?? '') ?? syntheticCallDescriptor(state, block, path);
  const children = structuralChildren(block);
  const inputs: Record<string, AstInput> = {};
  descriptor.arguments.forEach((argument, index) => {
    inputs[argument.id] = convertValueChild(
      state,
      'procedures_call',
      { kind: 'input', name: argument.id, spec: argumentInputSpec(argument.type) },
      children[index],
      `${path}.${index}`,
    );
  });
  if (children.length > descriptor.arguments.length) {
    throw new InvalidScratchblocksAstError(
      `Procedure call "${descriptor.procedureCode}" has extra arguments.`,
    );
  }
  const returnType: ProcedureCallMutation['returnType'] = block.isBoolean
    ? 'boolean'
    : block.isReporter
      ? 'reporter'
      : 'statement';
  return {
    kind: 'block',
    opcode: 'procedures_call',
    inputs,
    fields: {},
    mutation: {
      type: 'procedure-call',
      proccode: descriptor.procedureCode,
      argumentIds: descriptor.arguments.map((argument) => argument.id),
      warp: false,
      returnType,
    },
  };
};

const simpleReporter = <TContext>(
  state: DeserializeState<TContext>,
  block: ScratchBlock,
  opcode:
    | 'data_variable'
    | 'data_listcontents'
    | 'argument_reporter_boolean'
    | 'argument_reporter_string_number',
): AstBlock => {
  const spec = state.registry.require(opcode);
  const fieldName = Object.keys(spec.fields)[0];
  if (fieldName === undefined)
    throw new InvalidScratchblocksAstError(`Reporter "${opcode}" has no field spec.`);
  const value =
    blockName(block) ??
    block.children.flatMap((child) => (child.isLabel ? [child.value] : [])).join(' ');
  return {
    kind: 'block',
    opcode,
    inputs: {},
    fields: {
      [fieldName]: { kind: 'field', type: spec.fields[fieldName]!.type, value },
    },
  };
};

const convertScratchBlock = <TContext>(
  state: DeserializeState<TContext>,
  candidate: ScratchBlock | ScratchGlow,
  path: string,
): AstBlock => {
  const { block, glow } = unwrapScratchBlock(candidate);
  let result: AstBlock;
  if (block.info.id === 'PROCEDURES_DEFINITION') {
    result = convertProcedureDefinition(state, block, path);
  } else if (block.info.id === 'PROCEDURES_CALL') {
    result = convertProcedureCall(state, block, path);
  } else {
    const opcode = resolveOpcode(state, block);
    if (
      opcode === 'data_variable' ||
      opcode === 'data_listcontents' ||
      opcode === 'argument_reporter_boolean' ||
      opcode === 'argument_reporter_string_number'
    ) {
      result = simpleReporter(state, block, opcode);
    } else {
      const spec = state.registry.require(opcode);
      const slots = orderedSlots(spec);
      const children = structuralChildren(block);
      if (children.length > slots.length) {
        throw new InvalidScratchblocksAstError(
          `Block "${opcode}" has ${children.length - slots.length} extra structural children.`,
        );
      }
      const inputs: Record<string, AstInput> = {};
      const fields: Record<string, Field> = {};
      slots.forEach((slot, index) => {
        const child = children[index];
        if (slot.kind === 'field') {
          if (child !== undefined && !child.isInput) {
            throw new ScratchblocksTypeMismatchError(
              opcode,
              slot.name,
              'a field input',
              child.isScript ? 'a script' : 'a block',
            );
          }
          fields[slot.name] = makeField(
            child?.isInput ? child : undefined,
            slot,
            allLanguages['en']!,
          );
        } else {
          inputs[slot.name] = convertValueChild(state, opcode, slot, child, `${path}.${index}`);
        }
      });
      result = { kind: 'block', opcode, inputs, fields };
    }
  }
  const metadata: ScratchblocksMetadataContent = {};
  if (block.comment !== null) metadata.comment = block.comment.label.value;
  if (block.diff === '+' || block.diff === '-') metadata.diff = block.diff;
  if (glow) metadata.glow = true;
  setScratchblocksMetadata(result, metadata);
  return result;
};

const englishLanguage = (): LanguageData => {
  const english = allLanguages['en'];
  if (english === undefined)
    throw new InvalidScratchblocksAstError(
      'scratchblocks-plus did not load its built-in English language.',
    );
  return english;
};

export const deserializeScratchblocks = <TContext>(
  document: ScratchDocument,
  registry: BlockSpecRegistry<TContext>,
  options: DeserializeScratchblocksOptions = {},
): AstScript[] => {
  if (!Array.isArray(document.scripts)) {
    throw new InvalidScratchblocksAstError('Document.scripts must be an array.');
  }
  englishLanguage();
  const createProcedureArgumentId = options.createProcedureArgumentId ?? defaultArgumentId;
  const state: DeserializeState<TContext> = {
    registry,
    coercion: options.coercion ?? 'loose',
    index: createRegistryIndex(registry),
    procedures: scanDefinitions(document, createProcedureArgumentId),
    createProcedureArgumentId,
  };
  return document.scripts.map((script, index) =>
    convertScratchScript(state, script, String(index)),
  );
};

const displayedField = (
  field: Field,
  fieldSpec: FieldSpec,
  state: SerializeState<unknown>,
): { value: string; menu?: string } => {
  const fieldValue = String(field.value ?? '');
  for (const [label, value] of optionPairs(fieldSpec)) {
    if (String(value ?? '') !== fieldValue || typeof label !== 'string') continue;
    return {
      value: state.english.dropdowns[label]?.value ?? label,
      menu: label,
    };
  }
  return { value: fieldValue };
};

const scratchFieldInput = (
  field: Field,
  slot: Extract<OrderedSlot, { kind: 'field' }>,
  state: SerializeState<unknown>,
): ScratchInput => {
  const displayed = displayedField(field, slot.spec, state);
  const shape =
    slot.spec.bindings?.scratchblocks?.shape ?? (slot.spec.type === 'text' ? 'string' : 'dropdown');
  const input = new ScratchInputConstructor(shape, displayed.value);
  if (displayed.menu !== undefined) input.menu = displayed.menu;
  return input;
};

const rowsFromMatrix = (value: string): boolean[][] => {
  const bits = value.replace(/[^01]/g, '').padEnd(25, '0').slice(0, 25);
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_unused, column) => bits[row * 5 + column] === '1'),
  );
};

const expectedScratchShape = (spec: InputSpec, input: AstInput): string => {
  if (spec.connection === 'statement') return 'stack';
  const accepts = acceptsList(spec);
  if (accepts.includes('boolean') && !accepts.includes('any')) return 'boolean';
  if (accepts.includes('color')) return 'color';
  if (accepts.includes('matrix')) return 'number-dropdown';
  if (accepts.includes('note')) return 'number-dropdown';
  if (accepts.includes('number') && !accepts.includes('string') && !accepts.includes('any'))
    return 'number';
  if (input.type === 'number') return 'number';
  if (input.type === 'color') return 'color';
  return 'string';
};

const astLiteralType = (input: AstInput): InputValueType | undefined => {
  if (input.type === 'block' || input.type === 'script' || input.type === 'empty') return undefined;
  return input.type;
};

const scratchLiteralInput = (
  opcode: string,
  name: string,
  input: AstInput,
  spec: InputSpec,
  state: SerializeState<unknown>,
): ScratchInput => {
  if (input.type === 'block' || input.type === 'script') {
    throw new ScratchblocksTypeMismatchError(opcode, name, 'a literal', input.type);
  }
  const actual = astLiteralType(input);
  const accepts = acceptsList(spec);
  if (
    state.coercion === 'strict' &&
    actual !== undefined &&
    !accepts.includes('any') &&
    !accepts.includes(actual)
  ) {
    throw new ScratchblocksTypeMismatchError(opcode, name, accepts.join(' | '), actual);
  }
  const shape = expectedScratchShape(spec, input);
  if (input.type === 'empty') return new ScratchInputConstructor(shape, undefined);
  if (input.type === 'matrix') {
    return new ScratchInputConstructor(
      shape,
      new ScratchMatrixConstructor(rowsFromMatrix(input.value)),
    );
  }
  return new ScratchInputConstructor(shape, input.value);
};

const serializeSimpleReporter = <TContext>(
  state: SerializeState<TContext>,
  block: AstBlock,
): ScratchBlock => {
  const spec = state.registry.require(block.opcode);
  const field = block.fields[Object.keys(spec.fields)[0] ?? ''];
  const value = String(field?.value ?? '');
  const isArgument = block.opcode.startsWith('argument_reporter_');
  const info: BlockInfo = isArgument
    ? {
        shape: block.opcode === 'argument_reporter_boolean' ? 'boolean' : 'reporter',
        category: 'custom-arg',
        categoryIsDefault: true,
        selector: 'getParam',
        argument: block.opcode === 'argument_reporter_boolean' ? 'boolean' : 'string',
      }
    : {
        shape: 'reporter',
        category: block.opcode === 'data_listcontents' ? 'list' : 'variables',
        categoryIsDefault: true,
        selector: block.opcode === 'data_listcontents' ? 'contentsOfList:' : 'readVariable',
      };
  return new ScratchBlockConstructor(info, [new ScratchLabelConstructor(value)]);
};

const categoryFor = (spec: BlockSpec): string => {
  if (spec.opcode.startsWith('data_')) {
    return Object.values(spec.fields).some((field) => field.type === 'list') ||
      spec.opcode.includes('list')
      ? 'list'
      : 'variables';
  }
  if (spec.opcode.startsWith('event_')) return 'events';
  if (spec.opcode.startsWith('operator_')) return 'operators';
  if (spec.opcode.startsWith('procedures_')) return 'custom';
  return spec.opcode.split(/[_.]/, 1)[0] ?? 'obsolete';
};

const scratchShape = (spec: BlockSpec): string => {
  if (spec.shape === 'reporter') return 'reporter';
  if (spec.shape === 'boolean') return 'boolean';
  if (spec.shape === 'terminal') return 'cap';
  if (spec.shape === 'hat') return spec.hatStyle === 'define' ? 'define-hat' : 'hat';
  return Object.values(spec.inputs).some((input) => input.connection === 'statement')
    ? 'c-block'
    : 'stack';
};

const translationId = (spec: BlockSpec, english: LanguageData): string => {
  const blockId = spec.bindings?.scratchblocks?.blockId;
  if (blockId !== undefined && english.commands[blockId] !== undefined) {
    return blockId;
  }
  throw new MissingScratchblocksSpecMetadataError(
    spec.opcode,
    'find an English scratchblocks translation',
  );
};

const menuInputFromBlock = <TContext>(
  state: SerializeState<TContext>,
  block: AstBlock,
): ScratchInput => {
  const spec = state.registry.require(block.opcode);
  const firstSlot = orderedSlots(spec).find((slot) => slot.kind === 'field');
  if (firstSlot === undefined || firstSlot.kind !== 'field') {
    throw new InvalidScratchblocksAstError(`Menu shadow "${block.opcode}" has no field.`);
  }
  const field =
    block.fields[firstSlot.name] ??
    (firstSlot.spec.default === undefined
      ? undefined
      : (cloneJson(firstSlot.spec.default) as Field));
  if (field === undefined) return new ScratchInputConstructor('number-dropdown', '');
  const displayed = displayedField(field, firstSlot.spec, state as SerializeState<unknown>);
  const result = new ScratchInputConstructor('number-dropdown', displayed.value);
  if (displayed.menu !== undefined) result.menu = displayed.menu;
  return result;
};

const serializeAstScript = <TContext>(
  state: SerializeState<TContext>,
  script: AstScript,
): ScratchScript => {
  const blocks = script.blocks.map((block, index) =>
    serializeAstBlock(state, block, index < script.blocks.length - 1),
  );
  const inner = new ScratchScriptConstructor(blocks);
  if (scratchblocksMetadata(script)?.glow === true) {
    return new ScratchScriptConstructor([new ScratchGlowConstructor(inner)]);
  }
  return inner;
};

const serializeValueChild = <TContext>(
  state: SerializeState<TContext>,
  opcode: string,
  name: string,
  input: AstInput | undefined,
  spec: InputSpec,
): ScratchBlockChild => {
  if (input === undefined || input.type === 'empty') {
    return spec.connection === 'statement'
      ? new ScratchScriptConstructor([])
      : scratchLiteralInput(
          opcode,
          name,
          { kind: 'input', type: 'empty' },
          spec,
          state as SerializeState<unknown>,
        );
  }
  if (spec.connection === 'statement') {
    if (input.type === 'script') return serializeAstScript(state, input.value);
    if (state.coercion === 'loose' && input.type === 'block') {
      return new ScratchScriptConstructor([serializeAstBlock(state, input.value)]);
    }
    throw new ScratchblocksTypeMismatchError(opcode, name, 'a script', input.type);
  }
  if (input.type === 'block') {
    const menu = defaultMenuBlock(spec);
    if (menu?.opcode === input.value.opcode) return menuInputFromBlock(state, input.value);
    return serializeAstBlock(state, input.value);
  }
  if (input.type === 'script') {
    throw new ScratchblocksTypeMismatchError(opcode, name, 'a value', 'script');
  }
  return scratchLiteralInput(opcode, name, input, spec, state as SerializeState<unknown>);
};

const procedureParts = (procedureCode: string): string[] =>
  procedureCode.split(/(%[nsb])/g).filter((part) => part.length > 0);

const prototypeFromDefinition = (block: AstBlock): AstBlock => {
  const input = block.inputs['custom_block'];
  if (input?.type !== 'block' || input.value.opcode !== 'procedures_prototype') {
    throw new InvalidScratchblocksAstError(
      'procedures_definition requires a procedures_prototype custom_block input.',
    );
  }
  return input.value;
};

const argumentTypeFromPrototype = (
  prototype: AstBlock,
  mutation: ProcedurePrototypeMutation,
  index: number,
): ProcedureArgument['type'] => {
  const id = mutation.argumentIds[index];
  const reporter = id === undefined ? undefined : prototype.inputs[id];
  if (reporter?.type === 'block' && reporter.value.opcode === 'argument_reporter_boolean')
    return 'boolean';
  const token = [...mutation.proccode.matchAll(/%([nsb])/g)][index]?.[1];
  return token === 'n' ? 'number' : token === 'b' ? 'boolean' : 'string';
};

const customArgumentBlock = (name: string, type: ProcedureArgument['type']): ScratchBlock =>
  new ScratchBlockConstructor(
    {
      shape: type === 'boolean' ? 'boolean' : 'reporter',
      category: 'custom-arg',
      categoryIsDefault: true,
      argument: type,
    },
    [new ScratchLabelConstructor(name)],
  );

const serializeProcedureDefinition = <TContext>(
  state: SerializeState<TContext>,
  block: AstBlock,
): ScratchBlock => {
  state.registry.require('procedures_definition');
  state.registry.require('procedures_prototype');
  const prototype = prototypeFromDefinition(block);
  if (prototype.mutation?.type !== 'procedure-prototype') {
    throw new InvalidScratchblocksAstError(
      'procedures_prototype requires a semantic prototype mutation.',
    );
  }
  const mutation = prototype.mutation;
  let argumentIndex = 0;
  const outlineChildren: ScratchBlockChild[] = [];
  for (const part of procedureParts(mutation.proccode)) {
    if (/^%[nsb]$/.test(part)) {
      const name = mutation.argumentNames[argumentIndex] ?? `argument ${argumentIndex + 1}`;
      outlineChildren.push(
        customArgumentBlock(name, argumentTypeFromPrototype(prototype, mutation, argumentIndex)),
      );
      argumentIndex += 1;
    } else {
      const label = part.trim();
      if (label.length > 0) outlineChildren.push(new ScratchLabelConstructor(label));
    }
  }
  const outline = new ScratchBlockConstructor(
    {
      shape: 'outline',
      category: 'custom',
      categoryIsDefault: true,
    },
    outlineChildren,
  );
  const result = new ScratchBlockConstructor(
    {
      id: 'PROCEDURES_DEFINITION',
      selector: 'procDef',
      call: mutation.proccode,
      names: mutation.argumentNames,
      shape: 'define-hat',
      category: 'custom',
      categoryIsDefault: true,
      language: state.english,
    },
    [outline],
  );
  result.translate(state.language);
  return result;
};

const serializeProcedureCall = <TContext>(
  state: SerializeState<TContext>,
  block: AstBlock,
): ScratchBlock => {
  state.registry.require('procedures_call');
  if (block.mutation?.type !== 'procedure-call') {
    throw new InvalidScratchblocksAstError('procedures_call requires a semantic call mutation.');
  }
  const mutation = block.mutation;
  let argumentIndex = 0;
  const children: ScratchBlockChild[] = [];
  for (const part of procedureParts(mutation.proccode)) {
    if (/^%[nsb]$/.test(part)) {
      const id = mutation.argumentIds[argumentIndex];
      const token = part[1];
      const type = token === 'n' ? 'number' : token === 'b' ? 'boolean' : 'string';
      const input = id === undefined ? undefined : block.inputs[id];
      children.push(
        serializeValueChild(
          state,
          block.opcode,
          id ?? String(argumentIndex),
          input,
          argumentInputSpec(type),
        ),
      );
      argumentIndex += 1;
    } else {
      const label = part.trim();
      if (label.length > 0) children.push(new ScratchLabelConstructor(label));
    }
  }
  const shape =
    mutation.returnType === 'boolean'
      ? 'boolean'
      : mutation.returnType === 'reporter'
        ? 'reporter'
        : 'stack';
  const result = new ScratchBlockConstructor(
    {
      id: 'PROCEDURES_CALL',
      selector: 'call',
      call: mutation.proccode,
      shape,
      category: 'custom',
      categoryIsDefault: true,
      language: state.english,
    },
    children,
  );
  result.translate(state.language);
  return result;
};

const decorateScratchBlock = (block: ScratchBlock, ast: AstBlock): ScratchBlock | ScratchGlow => {
  const metadata = scratchblocksMetadata(ast) as ScratchblocksBlockMetadata | undefined;
  if (metadata?.comment !== undefined)
    block.comment = new ScratchCommentConstructor(metadata.comment, true);
  if (metadata?.diff === '+' || metadata?.diff === '-') block.diff = metadata.diff;
  return metadata?.glow === true ? new ScratchGlowConstructor(block) : block;
};

const serializeOrdinaryBlock = <TContext>(
  state: SerializeState<TContext>,
  block: AstBlock,
  hasNext: boolean,
): ScratchBlock => {
  const spec = state.registry.require(block.opcode);
  const slots = orderedSlots(spec);
  const children: ScratchBlockChild[] = slots.map((slot) => {
    if (slot.kind === 'field') {
      const field =
        block.fields[slot.name] ??
        (slot.spec.default === undefined
          ? ({ kind: 'field' as const, type: slot.spec.type, value: '' } as Field)
          : (cloneJson(slot.spec.default) as Field));
      return scratchFieldInput(field, slot, state as SerializeState<unknown>);
    }
    return serializeValueChild(state, block.opcode, slot.name, block.inputs[slot.name], slot.spec);
  });
  const hasLoopArrow = spec.bindings?.scratchblocks?.hasLoopArrow === true;
  const info: BlockInfo = {
    id: translationId(spec, state.english),
    selector: `sb3:${block.opcode}`,
    shape: block.opcode === 'control_stop' && hasNext ? 'stack' : scratchShape(spec),
    category: categoryFor(spec),
    categoryIsDefault: true,
    hasLoopArrow,
    language: state.english,
  };
  const result = new ScratchBlockConstructor(info, children);
  result.translate(state.language);
  if (
    hasLoopArrow &&
    !result.children.some((child) => child.isIcon && child.name === 'loopArrow')
  ) {
    const scriptIndex = result.children.findIndex((child) => child.isScript);
    result.children.splice(
      scriptIndex < 0 ? result.children.length : scriptIndex,
      0,
      new ScratchIconConstructor('loopArrow'),
    );
  }
  return result;
};

const serializeAstBlock = <TContext>(
  state: SerializeState<TContext>,
  block: AstBlock,
  hasNext = false,
): ScratchBlock | ScratchGlow => {
  let scratchBlock: ScratchBlock;
  if (block.opcode === 'procedures_definition')
    scratchBlock = serializeProcedureDefinition(state, block);
  else if (block.opcode === 'procedures_call') scratchBlock = serializeProcedureCall(state, block);
  else if (
    block.opcode === 'data_variable' ||
    block.opcode === 'data_listcontents' ||
    block.opcode === 'argument_reporter_boolean' ||
    block.opcode === 'argument_reporter_string_number'
  ) {
    scratchBlock = serializeSimpleReporter(state, block);
  } else scratchBlock = serializeOrdinaryBlock(state, block, hasNext);
  return decorateScratchBlock(scratchBlock, block);
};

export const serializeScratchblocks = <TContext>(
  scripts: readonly AstScript[],
  registry: BlockSpecRegistry<TContext>,
  options: SerializeScratchblocksOptions = {},
): ScratchDocument => {
  const english = englishLanguage();
  const state: SerializeState<TContext> = {
    registry,
    coercion: options.coercion ?? 'loose',
    english,
    language: options.language ?? english,
  };
  return new ScratchDocumentConstructor(scripts.map((script) => serializeAstScript(state, script)));
};
