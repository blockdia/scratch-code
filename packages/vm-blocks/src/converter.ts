import {
  assertJsonValue,
  walk,
  type Block,
  type Field,
  type FieldType,
  type Input,
  type JsonObject,
  type JsonValue,
  type NumericKind,
  type ObscuredShadow,
  type ProcedureArgumentDefault,
  type ProcedureCallMutation,
  type ProcedurePrototypeMutation,
  type Script,
} from '@scratch-code/ast';
import type { BlockSpecRegistry, InputSpec } from '@scratch-code/block-spec';

import { DuplicateVmBlockIdError, InvalidVmBlocksError, MissingVmBlockIdError } from './errors.js';
import { getVmBlocksBlockMetadata } from './metadata.js';
import type {
  VmBlock,
  VmBlockField,
  VmBlockInput,
  VmBlocksBlockMetadata,
  VmVariableType,
} from './types.js';

const scalarOpcodes = new Set([
  'math_number',
  'math_positive_number',
  'math_whole_number',
  'math_integer',
  'math_angle',
  'colour_picker',
  'text',
  'matrix',
  'note',
]);

const numericKinds: Readonly<Record<string, NumericKind>> = {
  math_number: 'number',
  math_positive_number: 'positive-number',
  math_whole_number: 'whole-number',
  math_integer: 'integer',
  math_angle: 'angle',
};

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const invalid = (message: string): never => {
  throw new InvalidVmBlocksError(message);
};

const jsonValue = (value: unknown, path: string): JsonValue => {
  try {
    assertJsonValue(value);
  } catch {
    return invalid(`${path} must be JSON-safe.`);
  }
  return cloneJson(value);
};

const jsonObject = (value: unknown, path: string): JsonObject => {
  if (!isRecord(value)) return invalid(`${path} must be a JSON object.`);
  const checked = jsonValue(value, path);
  if (!isRecord(checked)) return invalid(`${path} must be a JSON object.`);
  return checked as JsonObject;
};

const jsonString = (value: JsonValue | undefined): string => {
  if (typeof value === 'string') return value;
  if (value === undefined) return '';
  return JSON.stringify(value);
};

const parseJsonArray = (value: JsonValue | undefined): JsonValue[] | undefined => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as JsonValue[]) : undefined;
  } catch {
    return undefined;
  }
};

const parseBoolean = (value: JsonValue | undefined): boolean => value === true || value === 'true';

interface NormalizedVmInput {
  readonly block: string | null;
  readonly shadow: string | null;
}

interface NormalizedVmField {
  readonly value: JsonValue;
  readonly id?: string | null;
  readonly variableType?: VmVariableType;
}

interface NormalizedVmBlock {
  readonly id: string;
  readonly opcode: string;
  readonly next: string | null;
  readonly parent?: string | null;
  readonly inputs: Readonly<Record<string, NormalizedVmInput>>;
  readonly fields: Readonly<Record<string, NormalizedVmField>>;
  readonly shadow?: boolean;
  readonly topLevel?: boolean;
  readonly x?: number;
  readonly y?: number;
  readonly mutation?: JsonObject;
  readonly comment?: string;
}

const optionalReference = (value: unknown, path: string): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return invalid(`${path} must be a string, null, or omitted.`);
  return value;
};

const optionalBoolean = (value: unknown, path: string): boolean | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') return invalid(`${path} must be a boolean or omitted.`);
  return value;
};

const optionalNumber = (value: unknown, path: string): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return invalid(`${path} must be a finite number or omitted.`);
  }
  return value;
};

const optionalRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (value === undefined) return {};
  if (!isRecord(value)) return invalid(`${path} must be an object or omitted.`);
  return value;
};

const normalizeInput = (value: unknown, path: string): NormalizedVmInput => {
  if (!isRecord(value)) return invalid(`${path} must be an input object.`);
  return {
    block: optionalReference(value['block'], `${path}.block`),
    shadow: optionalReference(value['shadow'], `${path}.shadow`),
  };
};

const normalizeField = (value: unknown, path: string): NormalizedVmField => {
  if (!isRecord(value)) return invalid(`${path} must be a field object.`);
  if (!('value' in value)) return invalid(`${path}.value must be present and JSON-safe.`);
  const id = value['id'];
  if (id !== undefined && id !== null && typeof id !== 'string') {
    return invalid(`${path}.id must be a string, null, or omitted.`);
  }
  const variableType = value['variableType'];
  if (
    variableType !== undefined &&
    variableType !== '' &&
    variableType !== 'list' &&
    variableType !== 'broadcast_msg'
  ) {
    return invalid(`${path}.variableType must be "", "list", "broadcast_msg", or omitted.`);
  }
  return {
    value: jsonValue(value['value'], `${path}.value`),
    ...(id === undefined ? {} : { id: id as string | null }),
    ...(variableType === undefined ? {} : { variableType }),
  };
};

const normalizeVmBlocks = (blocks: readonly VmBlock[]): readonly NormalizedVmBlock[] => {
  if (!Array.isArray(blocks)) return invalid('blocks must be an array.');
  const result: NormalizedVmBlock[] = [];
  const ids = new Set<string>();
  for (let index = 0; index < blocks.length; index += 1) {
    const raw: unknown = blocks[index];
    const path = `blocks[${index}]`;
    if (!isRecord(raw)) return invalid(`${path} must be a block object.`);
    const id = raw['id'];
    const opcode = raw['opcode'];
    if (typeof id !== 'string' || id.length === 0) {
      return invalid(`${path}.id must be a non-empty string.`);
    }
    if (ids.has(id)) throw new DuplicateVmBlockIdError(id);
    ids.add(id);
    if (typeof opcode !== 'string' || opcode.length === 0) {
      return invalid(`${path}.opcode must be a non-empty string.`);
    }

    const inputs = Object.fromEntries(
      Object.entries(optionalRecord(raw['inputs'], `${path}.inputs`)).map(([name, input]) => [
        name,
        normalizeInput(input, `${path}.inputs.${name}`),
      ]),
    );
    const fields = Object.fromEntries(
      Object.entries(optionalRecord(raw['fields'], `${path}.fields`)).map(([name, field]) => [
        name,
        normalizeField(field, `${path}.fields.${name}`),
      ]),
    );
    const block: NormalizedVmBlock = {
      id,
      opcode,
      next: optionalReference(raw['next'], `${path}.next`),
      inputs,
      fields,
      ...(Object.prototype.hasOwnProperty.call(raw, 'parent')
        ? { parent: optionalReference(raw['parent'], `${path}.parent`) }
        : {}),
      ...(raw['shadow'] === undefined
        ? {}
        : { shadow: optionalBoolean(raw['shadow'], `${path}.shadow`)! }),
      ...(raw['topLevel'] === undefined
        ? {}
        : { topLevel: optionalBoolean(raw['topLevel'], `${path}.topLevel`)! }),
    };
    const x = optionalNumber(raw['x'], `${path}.x`);
    const y = optionalNumber(raw['y'], `${path}.y`);
    if (x !== undefined) (block as { x?: number }).x = x;
    if (y !== undefined) (block as { y?: number }).y = y;
    if (raw['mutation'] !== undefined) {
      (block as { mutation?: JsonObject }).mutation = jsonObject(
        raw['mutation'],
        `${path}.mutation`,
      );
    }
    if (raw['comment'] !== undefined) {
      if (typeof raw['comment'] !== 'string') {
        return invalid(`${path}.comment must be a string or omitted.`);
      }
      (block as { comment?: string }).comment = raw['comment'];
    }
    result.push(block);
  }
  return result;
};

const fieldTypeFallback = (name: string, field: NormalizedVmField): FieldType => {
  if (name === 'BROADCAST_OPTION') return 'broadcast';
  if (name === 'LIST') return 'list';
  if (name === 'VARIABLE') return 'variable';
  return field.id !== undefined ? 'dropdown' : 'text';
};

const semanticMutation = (raw: NormalizedVmBlock): Block['mutation'] => {
  const mutation = raw.mutation;
  if (mutation === undefined) return undefined;
  if (raw.opcode === 'procedures_prototype') {
    const argumentIds = parseJsonArray(mutation['argumentids']);
    const argumentNames = parseJsonArray(mutation['argumentnames']);
    const argumentDefaults = parseJsonArray(mutation['argumentdefaults']);
    if (argumentIds === undefined || argumentNames === undefined || argumentDefaults === undefined)
      return undefined;
    if (!argumentIds.every((value) => typeof value === 'string')) return undefined;
    if (!argumentNames.every((value) => typeof value === 'string')) return undefined;
    if (
      !argumentDefaults.every(
        (value) =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
      )
    )
      return undefined;
    return {
      type: 'procedure-prototype',
      proccode: jsonString(mutation['proccode']),
      argumentIds: argumentIds as string[],
      argumentNames: argumentNames as string[],
      argumentDefaults: argumentDefaults as ProcedureArgumentDefault[],
      warp: parseBoolean(mutation['warp']),
    };
  }
  if (raw.opcode === 'procedures_call') {
    const argumentIds = parseJsonArray(mutation['argumentids']);
    if (argumentIds === undefined || !argumentIds.every((value) => typeof value === 'string'))
      return undefined;
    const returnValue = mutation['return'];
    return {
      type: 'procedure-call',
      proccode: jsonString(mutation['proccode']),
      argumentIds: argumentIds as string[],
      warp: parseBoolean(mutation['warp']),
      returnType:
        returnValue === 1 || returnValue === '1'
          ? 'reporter'
          : returnValue === 2 || returnValue === '2'
            ? 'boolean'
            : 'statement',
    };
  }
  return undefined;
};

const dynamicInputSpec = (block: NormalizedVmBlock, _name: string): InputSpec | undefined => {
  if (block.opcode === 'procedures_call' || block.opcode === 'procedures_prototype') {
    return { connection: 'value', accepts: 'any' };
  }
  return undefined;
};

interface GraphEdge {
  readonly childId: string;
  readonly parentId: string;
  readonly kind: 'next' | 'input' | 'shadow';
  readonly shadow: boolean;
  readonly inputName?: string;
}

const inputEdges = (parentId: string, name: string, input: NormalizedVmInput): GraphEdge[] => {
  if (input.block !== null && input.block === input.shadow) {
    return [{ childId: input.block, parentId, kind: 'shadow', shadow: true, inputName: name }];
  }
  return [
    ...(input.block === null
      ? []
      : [
          {
            childId: input.block,
            parentId,
            kind: 'input' as const,
            shadow: false,
            inputName: name,
          },
        ]),
    ...(input.shadow === null
      ? []
      : [
          {
            childId: input.shadow,
            parentId,
            kind: 'shadow' as const,
            shadow: true,
            inputName: name,
          },
        ]),
  ];
};

const validateConnection = <TContext>(
  registry: BlockSpecRegistry<TContext>,
  parent: NormalizedVmBlock,
  inputSpec: InputSpec,
  child: NormalizedVmBlock,
  edge: GraphEdge,
): void => {
  const childSpec = registry.require(child.opcode);
  const childMutation = semanticMutation(child);
  const childShape =
    childMutation?.type === 'procedure-call'
      ? childMutation.returnType === 'reporter'
        ? 'reporter'
        : childMutation.returnType === 'boolean'
          ? 'boolean'
          : 'command'
      : childSpec.shape;
  const isDeclaredBlockDefault =
    inputSpec.default?.type === 'block' && inputSpec.default.value.opcode === child.opcode;
  if (inputSpec.connection === 'statement') {
    if (!isDeclaredBlockDefault && childShape !== 'command' && childShape !== 'terminal') {
      invalid(
        `Statement input "${edge.inputName}" on "${parent.opcode}" cannot contain "${child.opcode}".`,
      );
    }
  } else if (childShape === 'command' || childShape === 'terminal' || childShape === 'hat') {
    invalid(
      `Value input "${edge.inputName}" on "${parent.opcode}" cannot contain "${child.opcode}".`,
    );
  }
};

interface ValidatedVmGraph<TContext> {
  readonly blocks: readonly NormalizedVmBlock[];
  readonly byId: ReadonlyMap<string, NormalizedVmBlock>;
  readonly roots: readonly string[];
  readonly shadowById: ReadonlyMap<string, boolean>;
  readonly registry: BlockSpecRegistry<TContext>;
}

const validateVmGraph = <TContext>(
  blocks: readonly NormalizedVmBlock[],
  registry: BlockSpecRegistry<TContext>,
): ValidatedVmGraph<TContext> => {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const edges: GraphEdge[] = [];
  for (const block of blocks) {
    const spec = registry.require(block.opcode);
    if (block.next !== null) {
      if (spec.shape === 'reporter' || spec.shape === 'boolean') {
        invalid(`Reporter block "${block.id}" cannot have a next connection.`);
      }
      edges.push({ childId: block.next, parentId: block.id, kind: 'next', shadow: false });
    }
    for (const [name, input] of Object.entries(block.inputs)) {
      const inputSpec =
        spec.inputs[name] ??
        dynamicInputSpec(block, name) ??
        invalid(`Block "${block.opcode}" has undeclared input "${name}".`);
      for (const edge of inputEdges(block.id, name, input)) {
        const child =
          byId.get(edge.childId) ??
          invalid(
            `Input "${name}" on block "${block.id}" references missing block "${edge.childId}".`,
          );
        validateConnection(registry, block, inputSpec, child, edge);
        edges.push(edge);
      }
    }
  }

  const owner = new Map<string, GraphEdge>();
  const adjacency = new Map<string, string[]>();
  const shadowById = new Map(blocks.map((block) => [block.id, block.shadow ?? false]));
  for (const edge of edges) {
    const child =
      byId.get(edge.childId) ??
      invalid(`Block "${edge.parentId}" references missing block "${edge.childId}".`);
    const existing = owner.get(edge.childId);
    if (existing !== undefined) {
      invalid(
        `Block "${edge.childId}" is shared by "${existing.parentId}" and "${edge.parentId}".`,
      );
    }
    owner.set(edge.childId, edge);
    adjacency.set(edge.parentId, [...(adjacency.get(edge.parentId) ?? []), edge.childId]);
    if (child.topLevel === true) invalid(`Referenced block "${edge.childId}" cannot be top-level.`);
    if (child.parent !== undefined && child.parent !== edge.parentId) {
      invalid(
        `Block "${edge.childId}" has parent ${JSON.stringify(child.parent)}; expected "${edge.parentId}".`,
      );
    }
    if (child.shadow !== undefined && child.shadow !== edge.shadow) {
      invalid(
        `Block "${edge.childId}" has shadow ${String(child.shadow)}; expected ${String(edge.shadow)}.`,
      );
    }
    shadowById.set(edge.childId, edge.shadow);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) invalid(`Cycle detected at block "${id}".`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const child of adjacency.get(id) ?? []) visit(child);
    visiting.delete(id);
    visited.add(id);
  };
  for (const block of blocks) visit(block.id);
  return {
    blocks,
    byId,
    roots: blocks.filter((block) => !owner.has(block.id)).map((block) => block.id),
    shadowById,
    registry,
  };
};

const makeField = (field: NormalizedVmField, type: FieldType): Field => {
  const base = { kind: 'field' as const, type, value: cloneJson(field.value) };
  return (
    (type === 'variable' || type === 'list' || type === 'broadcast') && typeof field.id === 'string'
      ? { ...base, id: field.id }
      : base
  ) as Field;
};

const scalarFieldName = (opcode: string): string =>
  opcode === 'colour_picker'
    ? 'COLOUR'
    : opcode === 'text'
      ? 'TEXT'
      : opcode === 'matrix'
        ? 'MATRIX'
        : opcode === 'note'
          ? 'NOTE'
          : 'NUM';

const literalFromScalarBlock = (raw: NormalizedVmBlock): ObscuredShadow => {
  const value = raw.fields[scalarFieldName(raw.opcode)]?.value;
  let input: ObscuredShadow;
  if (raw.opcode in numericKinds) {
    input = {
      kind: 'input',
      type: 'number',
      value: typeof value === 'number' || typeof value === 'string' ? value : jsonString(value),
      metadata: { scratch: { id: raw.id, numericKind: numericKinds[raw.opcode]! } },
    };
  } else if (raw.opcode === 'colour_picker') {
    input = {
      kind: 'input',
      type: 'color',
      value: jsonString(value),
      metadata: { scratch: { id: raw.id } },
    };
  } else if (raw.opcode === 'matrix') {
    input = {
      kind: 'input',
      type: 'matrix',
      value: jsonString(value),
      metadata: { scratch: { id: raw.id } },
    };
  } else if (raw.opcode === 'note') {
    input = {
      kind: 'input',
      type: 'note',
      value: typeof value === 'number' || typeof value === 'string' ? value : jsonString(value),
      metadata: { scratch: { id: raw.id } },
    };
  } else {
    input = {
      kind: 'input',
      type: 'string',
      value: jsonString(value),
      metadata: { scratch: { id: raw.id } },
    };
  }
  return input;
};

interface DeserializeState<TContext> extends ValidatedVmGraph<TContext> {
  readonly blockCache: Map<string, Block>;
}

const rawBlockFor = (state: DeserializeState<unknown>, id: string): NormalizedVmBlock => {
  return state.byId.get(id) ?? invalid(`Missing block "${id}".`);
};

const convertBlock = <TContext>(state: DeserializeState<TContext>, id: string): Block => {
  const cached = state.blockCache.get(id);
  if (cached !== undefined) return cached;
  const raw = rawBlockFor(state as DeserializeState<unknown>, id);
  const spec = state.registry.require(raw.opcode);
  const mutation = semanticMutation(raw);
  const metadata: NonNullable<Block['metadata']> = { scratch: { id } };
  const vmMetadata: VmBlocksBlockMetadata = {
    version: 1,
    ...(raw.comment === undefined ? {} : { comment: raw.comment }),
    ...(mutation === undefined && raw.mutation !== undefined
      ? { mutation: cloneJson(raw.mutation) }
      : {}),
  };
  if (Object.keys(vmMetadata).length > 1) {
    metadata['vmBlocks'] = vmMetadata as unknown as JsonObject;
  }
  const block: Block = {
    kind: 'block',
    opcode: raw.opcode,
    fields: {},
    inputs: {},
    ...(state.shadowById.get(id) === true ? { shadow: true as const } : {}),
    ...(mutation === undefined ? {} : { mutation }),
    metadata,
  };
  state.blockCache.set(id, block);
  for (const [name, rawField] of Object.entries(raw.fields)) {
    block.fields[name] = makeField(
      rawField,
      spec.fields[name]?.type ?? fieldTypeFallback(name, rawField),
    );
  }
  const mutationInputNames =
    mutation?.type === 'procedure-call' || mutation?.type === 'procedure-prototype'
      ? mutation.argumentIds
      : [];
  const inputNames = new Set([
    ...Object.keys(spec.inputs),
    ...Object.keys(raw.inputs),
    ...mutationInputNames,
  ]);
  for (const name of inputNames) {
    const rawInput = raw.inputs[name];
    const inputSpec =
      spec.inputs[name] ??
      dynamicInputSpec(raw, name) ??
      invalid(`Block "${raw.opcode}" has undeclared input "${name}".`);
    block.inputs[name] =
      rawInput === undefined
        ? { kind: 'input', type: 'empty' }
        : convertInput(state, rawInput, inputSpec);
  }
  return block;
};

const convertInputValue = <TContext>(
  state: DeserializeState<TContext>,
  id: string | null,
  inputSpec: InputSpec,
): Input => {
  if (id === null) return { kind: 'input', type: 'empty' };
  const child = rawBlockFor(state as DeserializeState<unknown>, id);
  if (scalarOpcodes.has(child.opcode) && state.shadowById.get(id) === true) {
    state.registry.require(child.opcode);
    return literalFromScalarBlock(child);
  }
  const childBlock = convertBlock(state, id);
  const blockDefault = inputSpec.default?.type === 'block';
  if (inputSpec.connection === 'statement' && !blockDefault) {
    return { kind: 'input', type: 'script', value: convertScript(state, id) };
  }
  return { kind: 'input', type: 'block', value: childBlock };
};

const convertInput = <TContext>(
  state: DeserializeState<TContext>,
  raw: NormalizedVmInput,
  inputSpec: InputSpec,
): Input => {
  if (raw.block !== null && raw.block !== raw.shadow && raw.shadow !== null) {
    const input = convertInputValue(state, raw.block, inputSpec);
    const obscured = convertInputValue(state, raw.shadow, inputSpec);
    if (obscured.type === 'script' || obscured.type === 'empty') {
      invalid(`Obscured shadow "${raw.shadow}" is not a scalar or block shadow.`);
    }
    input.obscuredShadow = obscured as ObscuredShadow;
    return input;
  }
  return convertInputValue(state, raw.block ?? raw.shadow, inputSpec);
};

const convertScript = <TContext>(state: DeserializeState<TContext>, rootId: string): Script => {
  const blocks: Block[] = [];
  let id: string | null = rootId;
  while (id !== null) {
    const raw = rawBlockFor(state as DeserializeState<unknown>, id);
    blocks.push(convertBlock(state, id));
    id = raw.next;
  }
  const root = rawBlockFor(state as DeserializeState<unknown>, rootId);
  return {
    kind: 'script',
    blocks,
    ...(root.x === undefined && root.y === undefined
      ? {}
      : {
          metadata: {
            scratch: {
              ...(root.x === undefined ? {} : { x: root.x }),
              ...(root.y === undefined ? {} : { y: root.y }),
            },
          },
        }),
  };
};

export const deserializeVmBlocks = <TContext>(
  blocks: readonly VmBlock[],
  registry: BlockSpecRegistry<TContext>,
): Script[] => {
  const graph = validateVmGraph(normalizeVmBlocks(blocks), registry);
  const state: DeserializeState<TContext> = { ...graph, blockCache: new Map() };
  return graph.roots.map((id) => convertScript(state, id));
};

type ScalarInput = Extract<Input, { type: 'string' | 'number' | 'color' | 'matrix' | 'note' }>;

const isScalarInput = (input: Input): input is ScalarInput =>
  input.type === 'string' ||
  input.type === 'number' ||
  input.type === 'color' ||
  input.type === 'matrix' ||
  input.type === 'note';

interface AstIdentityState {
  readonly ids: Set<string>;
}

const claimAstId = (state: AstIdentityState, id: unknown, source: string): string => {
  if (typeof id !== 'string' || id.length === 0) throw new MissingVmBlockIdError(source);
  if (state.ids.has(id)) throw new DuplicateVmBlockIdError(id);
  state.ids.add(id);
  return id;
};

const validateRequiredAstValue = (value: unknown, source: string): void => {
  try {
    assertJsonValue(value);
  } catch {
    invalid(`${source} must be JSON-safe.`);
  }
};

const validateAst = (scripts: readonly Script[]): void => {
  try {
    assertJsonValue(scripts);
  } catch {
    invalid('AST scripts must be JSON-safe.');
  }
  const state: AstIdentityState = { ids: new Set() };
  for (const script of scripts) {
    walk(script, {
      enter(node) {
        if (node.kind === 'block') {
          claimAstId(state, node.metadata?.scratch?.id, node.opcode);
          if (node.shadow !== undefined && node.shadow !== true) {
            invalid(`AST block "${node.opcode}" has an invalid shadow flag.`);
          }
          return;
        }
        if (node.kind === 'field') {
          validateRequiredAstValue(node.value, 'AST field value');
          return;
        }
        if (node.kind === 'input' && isScalarInput(node)) {
          validateRequiredAstValue(node.value, `${node.type} shadow value`);
          claimAstId(state, node.metadata?.scratch?.id, `${node.type} shadow`);
        }
      },
    });
  }
};

const variableTypeFor = (name: string, type: FieldType): VmVariableType | undefined => {
  if (type === 'variable' || name === 'VARIABLE') return '';
  if (type === 'list' || name === 'LIST') return 'list';
  if (type === 'broadcast' || name === 'BROADCAST_OPTION') return 'broadcast_msg';
  return undefined;
};

const serializeField = (name: string, field: Field): VmBlockField => {
  const variableType = variableTypeFor(name, field.type);
  return {
    name,
    value: cloneJson(field.value),
    ...('id' in field && field.id !== undefined ? { id: field.id } : {}),
    ...(variableType === undefined ? {} : { variableType }),
  };
};

const serializeProcedureMutation = (
  mutation: ProcedurePrototypeMutation | ProcedureCallMutation,
): JsonObject => {
  const common: JsonObject = {
    tagName: 'mutation',
    children: [],
    proccode: mutation.proccode,
    argumentids: JSON.stringify(mutation.argumentIds),
    warp: JSON.stringify(mutation.warp),
  };
  if (mutation.type === 'procedure-prototype') {
    common['argumentnames'] = JSON.stringify(mutation.argumentNames);
    common['argumentdefaults'] = JSON.stringify(mutation.argumentDefaults);
  } else if (mutation.returnType !== 'statement') {
    common['return'] = mutation.returnType === 'reporter' ? '1' : '2';
  }
  return common;
};

const scalarOpcode = (input: ScalarInput): string => {
  if (input.type === 'number') {
    return input.metadata?.scratch?.numericKind === 'positive-number'
      ? 'math_positive_number'
      : input.metadata?.scratch?.numericKind === 'whole-number'
        ? 'math_whole_number'
        : input.metadata?.scratch?.numericKind === 'integer'
          ? 'math_integer'
          : input.metadata?.scratch?.numericKind === 'angle'
            ? 'math_angle'
            : 'math_number';
  }
  if (input.type === 'color') return 'colour_picker';
  if (input.type === 'matrix') return 'matrix';
  if (input.type === 'note') return 'note';
  return 'text';
};

interface SerializeState {
  readonly result: VmBlock[];
  readonly emitted: Set<string>;
}

const beginBlock = (state: SerializeState, block: VmBlock): void => {
  if (state.emitted.has(block.id))
    invalid(`VM runtime block "${block.id}" was emitted more than once.`);
  state.emitted.add(block.id);
  state.result.push(block);
};

const serializeScalar = (
  state: SerializeState,
  input: ScalarInput,
  parent: string,
  shadow: boolean,
): string => {
  const id = input.metadata!.scratch!.id!;
  const opcode = scalarOpcode(input);
  const fieldName = scalarFieldName(opcode);
  beginBlock(state, {
    id,
    opcode,
    next: null,
    parent,
    inputs: {},
    fields: { [fieldName]: { name: fieldName, value: input.value } },
    shadow,
    topLevel: false,
  });
  return id;
};

const serializeObscuredShadow = (
  state: SerializeState,
  input: ObscuredShadow,
  parent: string,
): string => {
  if (input.obscuredShadow !== undefined) {
    invalid('An obscured shadow cannot itself have an obscured shadow.');
  }
  if (input.type === 'block') {
    return serializeSingleBlock(state, input.value, false, parent, null, undefined, true);
  }
  return serializeScalar(state, input, parent, true);
};

const serializeInputValue = (
  state: SerializeState,
  input: Exclude<Input, { kind: 'input'; type: 'empty' }>,
  parent: string,
  shadow: boolean,
): string | null => {
  if (input.type === 'script') {
    const first = input.value.blocks[0];
    if (first === undefined) return null;
    if (shadow) invalid('A statement stack cannot be a shadow.');
    serializeScript(state, input.value, false, parent);
    return first.metadata!.scratch!.id!;
  }
  if (input.type === 'block') {
    return serializeSingleBlock(state, input.value, false, parent, null, undefined, shadow);
  }
  return serializeScalar(state, input, parent, shadow);
};

const serializeInput = (
  state: SerializeState,
  name: string,
  input: Input,
  parent: string,
): VmBlockInput | undefined => {
  if (input.type === 'empty') {
    if (input.obscuredShadow !== undefined)
      invalid(`Empty input "${name}" cannot have an obscured shadow.`);
    return undefined;
  }
  if (
    input.type === 'script' &&
    input.value.blocks.length === 0 &&
    input.obscuredShadow === undefined
  ) {
    return undefined;
  }
  if (input.obscuredShadow !== undefined) {
    if (input.type === 'block' && input.value.shadow === true) {
      invalid(`Active block in input "${name}" cannot also be marked as a shadow.`);
    }
    return {
      name,
      block: serializeInputValue(state, input, parent, false),
      shadow: serializeObscuredShadow(state, input.obscuredShadow, parent),
    };
  }
  const shadow = input.type !== 'script' && (input.type !== 'block' || input.value.shadow === true);
  const id = serializeInputValue(state, input, parent, shadow);
  return { name, block: id, shadow: shadow ? id : null };
};

const validatedVmMetadata = (block: Block): VmBlocksBlockMetadata | undefined => {
  const metadata = getVmBlocksBlockMetadata(block);
  if (metadata === undefined) return undefined;
  if (metadata.comment !== undefined && typeof metadata.comment !== 'string') {
    invalid(`metadata.vmBlocks.comment on "${block.opcode}" must be a string.`);
  }
  if (metadata.mutation !== undefined && !isRecord(metadata.mutation)) {
    invalid(`metadata.vmBlocks.mutation on "${block.opcode}" must be a JSON object.`);
  }
  return metadata;
};

const serializeSingleBlock = (
  state: SerializeState,
  block: Block,
  topLevel: boolean,
  parent: string | null,
  next: string | null,
  script?: Script,
  shadowOverride?: boolean,
): string => {
  const id = block.metadata!.scratch!.id!;
  if (shadowOverride === false && block.shadow === true) {
    invalid(`Block "${id}" is marked as a shadow but is connected as an active block.`);
  }
  const shadow = shadowOverride ?? block.shadow === true;
  const metadata = validatedVmMetadata(block);
  const result: VmBlock = {
    id,
    opcode: block.opcode,
    next,
    parent,
    inputs: {},
    fields: Object.fromEntries(
      Object.entries(block.fields).map(([name, field]) => [name, serializeField(name, field)]),
    ),
    shadow,
    topLevel,
    ...(topLevel && script?.metadata?.scratch?.x !== undefined
      ? { x: script.metadata.scratch.x }
      : {}),
    ...(topLevel && script?.metadata?.scratch?.y !== undefined
      ? { y: script.metadata.scratch.y }
      : {}),
    ...(block.mutation !== undefined
      ? { mutation: serializeProcedureMutation(block.mutation) }
      : metadata?.mutation === undefined
        ? {}
        : { mutation: cloneJson(metadata.mutation) }),
    ...(metadata?.comment === undefined ? {} : { comment: metadata.comment }),
  };
  beginBlock(state, result);
  for (const [name, input] of Object.entries(block.inputs)) {
    const serialized = serializeInput(state, name, input, id);
    if (serialized !== undefined) result.inputs![name] = serialized;
  }
  return id;
};

const serializeScript = (
  state: SerializeState,
  script: Script,
  topLevel: boolean,
  parent: string | null,
): void => {
  for (let index = 0; index < script.blocks.length; index += 1) {
    const block = script.blocks[index]!;
    const previous = script.blocks[index - 1];
    const next = script.blocks[index + 1];
    serializeSingleBlock(
      state,
      block,
      topLevel && index === 0,
      index === 0 ? parent : previous!.metadata!.scratch!.id!,
      next === undefined ? null : next.metadata!.scratch!.id!,
      index === 0 ? script : undefined,
      topLevel && index === 0 ? undefined : false,
    );
  }
};

export const serializeVmBlocks = (scripts: readonly Script[]): VmBlock[] => {
  validateAst(scripts);
  const state: SerializeState = { result: [], emitted: new Set() };
  for (const script of scripts) serializeScript(state, script, true, null);
  return state.result;
};
