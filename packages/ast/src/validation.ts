import type {
  FieldType,
  NumericKind,
  ProcedureArgumentDefault,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script,
} from './types.js';

export type AstPathSegment = string | number;
export type AstDiagnosticSeverity = 'error' | 'warning';

export type AstDiagnosticCode =
  | 'INVALID_JSON_VALUE'
  | 'INVALID_SCRIPTS'
  | 'INVALID_NODE_TYPE'
  | 'INVALID_NODE_KIND'
  | 'MISSING_PROPERTY'
  | 'INVALID_PROPERTY_TYPE'
  | 'INVALID_METADATA'
  | 'INVALID_MUTATION'
  | 'INVALID_OBSCURED_SHADOW'
  | 'SHARED_AST_NODE'
  | 'CYCLIC_AST_NODE'
  | 'MISSING_BLOCK_SPEC'
  | 'MISSING_FIELD'
  | 'UNEXPECTED_FIELD'
  | 'FIELD_TYPE_MISMATCH'
  | 'MISSING_INPUT'
  | 'UNEXPECTED_INPUT'
  | 'INPUT_CONNECTION_MISMATCH'
  | 'INPUT_TYPE_MISMATCH'
  | 'BLOCK_SHAPE_MISMATCH'
  | 'INVALID_PROCEDURE_MUTATION'
  | 'PROCEDURE_SIGNATURE_MISMATCH'
  | 'INVALID_PROCEDURE_DEFINITION'
  | 'INVALID_SHADOW_PLACEMENT';

export interface AstDiagnostic {
  readonly code: AstDiagnosticCode;
  readonly severity: AstDiagnosticSeverity;
  readonly path: readonly AstPathSegment[];
  /** The nearest owning Block's `metadata.scratch.id`, when one is available. */
  readonly nodeId?: string;
  readonly message: string;
}

type ValidationInputValueType =
  'string' | 'number' | 'boolean' | 'color' | 'matrix' | 'note' | 'any';

interface ValidationInputSpec {
  readonly connection: 'value' | 'statement';
  readonly accepts?: ValidationInputValueType | readonly ValidationInputValueType[];
  readonly default?: unknown;
}

interface ValidationFieldSpec {
  readonly type: FieldType;
}

interface ValidationBlockSpec {
  readonly opcode: string;
  readonly shape: 'command' | 'terminal' | 'hat' | 'reporter' | 'boolean';
  readonly inputs: Readonly<Record<string, ValidationInputSpec>>;
  readonly fields: Readonly<Record<string, ValidationFieldSpec>>;
}

/** The structural subset of `BlockSpecRegistry` consumed by this package. */
export interface BlockSpecRegistryLike {
  get(opcode: string): unknown;
}

export interface ValidateScriptsOptions {
  /** Supplying a registry opts into semantic validation and missing-spec errors. */
  readonly registry?: BlockSpecRegistryLike;
}

export class AstValidationError extends TypeError {
  readonly diagnostics: readonly AstDiagnostic[];

  constructor(diagnostics: readonly AstDiagnostic[]) {
    super(`AST validation failed with ${String(diagnostics.length)} error(s).`);
    this.name = 'AstValidationError';
    this.diagnostics = diagnostics;
  }
}

type ExpectedNodeKind = 'script' | 'block' | 'input' | 'field';
type RecordValue = Record<string, unknown>;

interface SeenNode {
  readonly path: readonly AstPathSegment[];
  active: boolean;
}

interface ValidationState {
  readonly diagnostics: AstDiagnostic[];
  readonly nodes: WeakMap<object, SeenNode>;
  readonly registry?: BlockSpecRegistryLike;
}

interface NodeContext {
  readonly path: readonly AstPathSegment[];
  readonly nodeId?: string;
  readonly blockPosition?: 'script' | 'input';
}

const inputTypes = new Set([
  'string',
  'number',
  'color',
  'matrix',
  'note',
  'block',
  'script',
  'empty',
]);
const fieldTypes = new Set<FieldType>(['text', 'dropdown', 'variable', 'list', 'broadcast']);
const numericKinds = new Set<NumericKind>([
  'number',
  'integer',
  'whole-number',
  'positive-number',
  'angle',
]);
const procedureReturnTypes = new Set(['statement', 'reporter', 'boolean']);

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value: RecordValue, key: string): boolean => Object.hasOwn(value, key);

const childPath = (
  path: readonly AstPathSegment[],
  ...segments: readonly AstPathSegment[]
): readonly AstPathSegment[] => [...path, ...segments];

const displayPath = (path: readonly AstPathSegment[]): string =>
  path
    .map((segment, index) =>
      typeof segment === 'number'
        ? `[${String(segment)}]`
        : index === 0
          ? segment
          : /^[A-Za-z_$][\w$]*$/.test(segment)
            ? `.${segment}`
            : `[${JSON.stringify(segment)}]`,
    )
    .join('');

const addDiagnostic = (
  state: ValidationState,
  context: NodeContext,
  code: AstDiagnosticCode,
  message: string,
  path: readonly AstPathSegment[] = context.path,
): void => {
  state.diagnostics.push({
    code,
    severity: 'error',
    path,
    ...(context.nodeId === undefined ? {} : { nodeId: context.nodeId }),
    message,
  });
};

const checkJsonValue = (
  state: ValidationState,
  value: unknown,
  path: readonly AstPathSegment[],
  active: WeakSet<object>,
  checked: WeakSet<object>,
): void => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      addDiagnostic(
        state,
        { path },
        'INVALID_JSON_VALUE',
        `Non-finite number at ${displayPath(path)} is not JSON-safe.`,
      );
    }
    return;
  }
  if (typeof value !== 'object' || value === undefined) {
    addDiagnostic(
      state,
      { path },
      'INVALID_JSON_VALUE',
      `Value at ${displayPath(path)} is not JSON-safe.`,
    );
    return;
  }
  if (checked.has(value)) return;
  if (active.has(value)) {
    addDiagnostic(
      state,
      { path },
      'INVALID_JSON_VALUE',
      `Cycle at ${displayPath(path)} is not JSON-safe.`,
    );
    return;
  }
  active.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      checkJsonValue(state, child, childPath(path, index), active, checked),
    );
  } else {
    for (const [key, child] of Object.entries(value)) {
      // This matches JsonObject, whose optional properties may be represented by undefined.
      if (child !== undefined) {
        checkJsonValue(state, child, childPath(path, key), active, checked);
      }
    }
  }
  active.delete(value);
  checked.add(value);
};

const required = (
  state: ValidationState,
  record: RecordValue,
  key: string,
  context: NodeContext,
): unknown => {
  if (hasOwn(record, key)) {
    const value = record[key];
    if (value === undefined) {
      addDiagnostic(
        state,
        context,
        'INVALID_PROPERTY_TYPE',
        `Required property "${key}" cannot be undefined.`,
        childPath(context.path, key),
      );
    }
    return value;
  }
  addDiagnostic(
    state,
    context,
    'MISSING_PROPERTY',
    `Required property "${key}" is missing.`,
    childPath(context.path, key),
  );
  return undefined;
};

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((child) => typeof child === 'string');

const procedureDefaultArray = (value: unknown): value is ProcedureArgumentDefault[] =>
  Array.isArray(value) &&
  value.every(
    (child) =>
      typeof child === 'string' ||
      typeof child === 'boolean' ||
      (typeof child === 'number' && Number.isFinite(child)),
  );

const validateMetadata = (
  state: ValidationState,
  metadata: unknown,
  context: NodeContext,
  kind: ExpectedNodeKind,
  subtype?: string,
): void => {
  if (metadata === undefined) return;
  const path = childPath(context.path, 'metadata');
  if (!isRecord(metadata)) {
    addDiagnostic(state, context, 'INVALID_METADATA', 'metadata must be an object.', path);
    return;
  }
  const scratch = metadata['scratch'];
  if (scratch === undefined) return;
  const scratchPath = childPath(path, 'scratch');
  if (!isRecord(scratch)) {
    addDiagnostic(
      state,
      context,
      'INVALID_METADATA',
      'metadata.scratch must be an object.',
      scratchPath,
    );
    return;
  }

  const allowed =
    kind === 'script'
      ? new Set(['x', 'y'])
      : kind === 'block'
        ? new Set(['id'])
        : kind === 'input' && subtype === 'number'
          ? new Set(['id', 'numericKind'])
          : kind === 'input' && ['string', 'color', 'matrix', 'note'].includes(subtype ?? '')
            ? new Set(['id'])
            : new Set<string>();
  for (const key of Object.keys(scratch)) {
    if (!allowed.has(key)) {
      addDiagnostic(
        state,
        context,
        'INVALID_METADATA',
        `metadata.scratch.${key} is not valid on this node.`,
        childPath(scratchPath, key),
      );
    }
  }

  if (kind === 'script') {
    for (const coordinate of ['x', 'y'] as const) {
      const value = scratch[coordinate];
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
        addDiagnostic(
          state,
          context,
          'INVALID_METADATA',
          `metadata.scratch.${coordinate} must be a finite number.`,
          childPath(scratchPath, coordinate),
        );
      }
    }
  } else if (kind === 'block' || kind === 'input') {
    const id = scratch['id'];
    if (id !== undefined && typeof id !== 'string') {
      addDiagnostic(
        state,
        context,
        'INVALID_METADATA',
        'metadata.scratch.id must be a string.',
        childPath(scratchPath, 'id'),
      );
    }
    const numericKind = scratch['numericKind'];
    if (
      kind === 'input' &&
      subtype === 'number' &&
      numericKind !== undefined &&
      (typeof numericKind !== 'string' || !numericKinds.has(numericKind as NumericKind))
    ) {
      addDiagnostic(
        state,
        context,
        'INVALID_METADATA',
        'metadata.scratch.numericKind is invalid.',
        childPath(scratchPath, 'numericKind'),
      );
    }
  }
};

const validateMutationStructure = (
  state: ValidationState,
  value: unknown,
  context: NodeContext,
): ProcedurePrototypeMutation | ProcedureCallMutation | undefined => {
  if (value === undefined) return undefined;
  const path = childPath(context.path, 'mutation');
  if (!isRecord(value)) {
    addDiagnostic(state, context, 'INVALID_MUTATION', 'mutation must be an object.', path);
    return undefined;
  }
  const type = required(state, value, 'type', { ...context, path });
  if (type !== 'procedure-prototype' && type !== 'procedure-call') {
    addDiagnostic(
      state,
      context,
      'INVALID_MUTATION',
      'mutation.type must be "procedure-prototype" or "procedure-call".',
      childPath(path, 'type'),
    );
    return undefined;
  }

  const proccode = required(state, value, 'proccode', { ...context, path });
  const argumentIds = required(state, value, 'argumentIds', { ...context, path });
  const warp = required(state, value, 'warp', { ...context, path });
  let valid = true;
  if (typeof proccode !== 'string') {
    addDiagnostic(
      state,
      context,
      'INVALID_MUTATION',
      'mutation.proccode must be a string.',
      childPath(path, 'proccode'),
    );
    valid = false;
  }
  if (!stringArray(argumentIds)) {
    addDiagnostic(
      state,
      context,
      'INVALID_MUTATION',
      'mutation.argumentIds must be an array of strings.',
      childPath(path, 'argumentIds'),
    );
    valid = false;
  }
  if (typeof warp !== 'boolean') {
    addDiagnostic(
      state,
      context,
      'INVALID_MUTATION',
      'mutation.warp must be a boolean.',
      childPath(path, 'warp'),
    );
    valid = false;
  }

  if (type === 'procedure-prototype') {
    const argumentNames = required(state, value, 'argumentNames', { ...context, path });
    const argumentDefaults = required(state, value, 'argumentDefaults', { ...context, path });
    if (!stringArray(argumentNames)) {
      addDiagnostic(
        state,
        context,
        'INVALID_MUTATION',
        'mutation.argumentNames must be an array of strings.',
        childPath(path, 'argumentNames'),
      );
      valid = false;
    }
    if (!procedureDefaultArray(argumentDefaults)) {
      addDiagnostic(
        state,
        context,
        'INVALID_MUTATION',
        'mutation.argumentDefaults must contain only finite numbers, strings, or booleans.',
        childPath(path, 'argumentDefaults'),
      );
      valid = false;
    }
    return valid ? (value as unknown as ProcedurePrototypeMutation) : undefined;
  }

  const returnType = required(state, value, 'returnType', { ...context, path });
  if (typeof returnType !== 'string' || !procedureReturnTypes.has(returnType)) {
    addDiagnostic(
      state,
      context,
      'INVALID_MUTATION',
      'mutation.returnType must be "statement", "reporter", or "boolean".',
      childPath(path, 'returnType'),
    );
    valid = false;
  }
  return valid ? (value as unknown as ProcedureCallMutation) : undefined;
};

const blockIdFrom = (record: RecordValue, fallback: string | undefined): string | undefined => {
  const metadata = record['metadata'];
  if (!isRecord(metadata)) return fallback;
  const scratch = metadata['scratch'];
  if (!isRecord(scratch)) return fallback;
  return typeof scratch['id'] === 'string' ? scratch['id'] : fallback;
};

const beginNode = (
  state: ValidationState,
  value: unknown,
  expectedKind: ExpectedNodeKind,
  context: NodeContext,
): RecordValue | undefined => {
  if (!isRecord(value)) {
    addDiagnostic(state, context, 'INVALID_NODE_TYPE', `Expected an AST ${expectedKind} object.`);
    return undefined;
  }
  const seen = state.nodes.get(value);
  if (seen !== undefined) {
    addDiagnostic(
      state,
      context,
      seen.active ? 'CYCLIC_AST_NODE' : 'SHARED_AST_NODE',
      `${seen.active ? 'Cyclic' : 'Shared'} AST node also appears at ${displayPath(seen.path)}.`,
    );
    return undefined;
  }
  state.nodes.set(value, { path: context.path, active: true });
  if (value['kind'] !== expectedKind) {
    const actual = value['kind'];
    addDiagnostic(
      state,
      context,
      'INVALID_NODE_KIND',
      `Expected kind "${expectedKind}", received ${JSON.stringify(actual)}.`,
      childPath(context.path, 'kind'),
    );
  }
  return value;
};

const endNode = (state: ValidationState, value: RecordValue): void => {
  const seen = state.nodes.get(value);
  if (seen !== undefined) seen.active = false;
};

const validateScript = (state: ValidationState, value: unknown, context: NodeContext): void => {
  const record = beginNode(state, value, 'script', context);
  if (record === undefined) return;
  validateMetadata(state, record['metadata'], context, 'script');
  const blocks = required(state, record, 'blocks', context);
  if (!Array.isArray(blocks)) {
    if (blocks !== undefined) {
      addDiagnostic(
        state,
        context,
        'INVALID_PROPERTY_TYPE',
        'Script.blocks must be an array.',
        childPath(context.path, 'blocks'),
      );
    }
  } else {
    blocks.forEach((block, index) =>
      validateBlock(state, block, {
        path: childPath(context.path, 'blocks', index),
        ...(context.nodeId === undefined ? {} : { nodeId: context.nodeId }),
        blockPosition: 'script',
      }),
    );
  }
  endNode(state, record);
};

const validateRecordChildren = (
  state: ValidationState,
  value: unknown,
  property: 'fields' | 'inputs',
  context: NodeContext,
  visit: (child: unknown, context: NodeContext) => void,
): RecordValue | undefined => {
  if (!isRecord(value)) {
    if (value !== undefined) {
      addDiagnostic(
        state,
        context,
        'INVALID_PROPERTY_TYPE',
        `Block.${property} must be an object.`,
        childPath(context.path, property),
      );
    }
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    visit(child, {
      path: childPath(context.path, property, key),
      ...(context.nodeId === undefined ? {} : { nodeId: context.nodeId }),
    });
  }
  return value;
};

const validateBlock = (state: ValidationState, value: unknown, context: NodeContext): void => {
  const record = beginNode(state, value, 'block', context);
  if (record === undefined) return;
  const nodeId = blockIdFrom(record, context.nodeId);
  const blockContext: NodeContext = {
    ...context,
    ...(nodeId === undefined ? {} : { nodeId }),
  };
  validateMetadata(state, record['metadata'], blockContext, 'block');
  const opcode = required(state, record, 'opcode', blockContext);
  if (typeof opcode !== 'string') {
    if (opcode !== undefined) {
      addDiagnostic(
        state,
        blockContext,
        'INVALID_PROPERTY_TYPE',
        'Block.opcode must be a string.',
        childPath(context.path, 'opcode'),
      );
    }
  }
  const shadow = record['shadow'];
  if (shadow !== undefined && shadow !== true) {
    addDiagnostic(
      state,
      blockContext,
      'INVALID_PROPERTY_TYPE',
      'Block.shadow may only be the literal true or be omitted.',
      childPath(context.path, 'shadow'),
    );
  }
  const mutation = validateMutationStructure(state, record['mutation'], blockContext);
  const fieldsValue = required(state, record, 'fields', blockContext);
  const fields = validateRecordChildren(
    state,
    fieldsValue,
    'fields',
    blockContext,
    (child, childContext) => validateField(state, child, childContext),
  );
  const inputsValue = required(state, record, 'inputs', blockContext);
  const inputs = validateRecordChildren(
    state,
    inputsValue,
    'inputs',
    blockContext,
    (child, childContext) => validateInput(state, child, childContext),
  );

  if (state.registry !== undefined && typeof opcode === 'string') {
    validateBlockSemantics(state, record, opcode, fields, inputs, mutation, blockContext);
  }
  endNode(state, record);
};

const validateInput = (state: ValidationState, value: unknown, context: NodeContext): void => {
  const record = beginNode(state, value, 'input', context);
  if (record === undefined) return;
  const type = required(state, record, 'type', context);
  validateMetadata(
    state,
    record['metadata'],
    context,
    'input',
    typeof type === 'string' ? type : '',
  );
  if (typeof type !== 'string' || !inputTypes.has(type)) {
    addDiagnostic(
      state,
      context,
      'INVALID_PROPERTY_TYPE',
      'Input.type is invalid.',
      childPath(context.path, 'type'),
    );
  } else {
    switch (type) {
      case 'string':
      case 'color':
      case 'matrix': {
        const child = required(state, record, 'value', context);
        if (typeof child !== 'string') {
          addDiagnostic(
            state,
            context,
            'INVALID_PROPERTY_TYPE',
            `A ${type} input value must be a string.`,
            childPath(context.path, 'value'),
          );
        }
        break;
      }
      case 'number':
      case 'note': {
        const child = required(state, record, 'value', context);
        if (typeof child !== 'string' && (typeof child !== 'number' || !Number.isFinite(child))) {
          addDiagnostic(
            state,
            context,
            'INVALID_PROPERTY_TYPE',
            `A ${type} input value must be a string or finite number.`,
            childPath(context.path, 'value'),
          );
        }
        break;
      }
      case 'block':
        validateBlock(state, required(state, record, 'value', context), {
          path: childPath(context.path, 'value'),
          ...(context.nodeId === undefined ? {} : { nodeId: context.nodeId }),
          blockPosition: 'input',
        });
        break;
      case 'script':
        validateScript(state, required(state, record, 'value', context), {
          path: childPath(context.path, 'value'),
          ...(context.nodeId === undefined ? {} : { nodeId: context.nodeId }),
        });
        break;
      case 'empty':
        break;
    }
  }

  const obscuredShadow = record['obscuredShadow'];
  if (obscuredShadow !== undefined) {
    const shadowPath = childPath(context.path, 'obscuredShadow');
    if (type !== 'block' && type !== 'script') {
      addDiagnostic(
        state,
        context,
        'INVALID_OBSCURED_SHADOW',
        'Only a connected block or script input may have an obscuredShadow.',
        shadowPath,
      );
    }
    if (isRecord(obscuredShadow)) {
      const shadowType = obscuredShadow['type'];
      if (shadowType === 'script' || shadowType === 'empty') {
        addDiagnostic(
          state,
          context,
          'INVALID_OBSCURED_SHADOW',
          'obscuredShadow must be a scalar or block input.',
          shadowPath,
        );
      }
      if (obscuredShadow['obscuredShadow'] !== undefined) {
        addDiagnostic(
          state,
          context,
          'INVALID_OBSCURED_SHADOW',
          'An obscuredShadow cannot contain another obscuredShadow.',
          childPath(shadowPath, 'obscuredShadow'),
        );
      }
    }
    validateInput(state, obscuredShadow, {
      path: shadowPath,
      ...(context.nodeId === undefined ? {} : { nodeId: context.nodeId }),
    });
  }
  endNode(state, record);
};

const validateField = (state: ValidationState, value: unknown, context: NodeContext): void => {
  const record = beginNode(state, value, 'field', context);
  if (record === undefined) return;
  const type = required(state, record, 'type', context);
  validateMetadata(
    state,
    record['metadata'],
    context,
    'field',
    typeof type === 'string' ? type : '',
  );
  if (typeof type !== 'string' || !fieldTypes.has(type as FieldType)) {
    addDiagnostic(
      state,
      context,
      'INVALID_PROPERTY_TYPE',
      'Field.type is invalid.',
      childPath(context.path, 'type'),
    );
  }
  required(state, record, 'value', context);
  const id = record['id'];
  if (id !== undefined) {
    if (type !== 'variable' && type !== 'list' && type !== 'broadcast') {
      addDiagnostic(
        state,
        context,
        'INVALID_PROPERTY_TYPE',
        'Only variable, list, and broadcast fields may have an id.',
        childPath(context.path, 'id'),
      );
    } else if (typeof id !== 'string') {
      addDiagnostic(
        state,
        context,
        'INVALID_PROPERTY_TYPE',
        'Field.id must be a string.',
        childPath(context.path, 'id'),
      );
    }
  }
  endNode(state, record);
};

const procedureArgumentTypes = (proccode: string): ValidationInputValueType[] =>
  [...proccode.matchAll(/%([nsb])/g)].map((match) =>
    match[1] === 'n' ? 'number' : match[1] === 'b' ? 'boolean' : 'string',
  );

const validateProcedureMutation = (
  state: ValidationState,
  opcode: string,
  mutation: ProcedurePrototypeMutation | ProcedureCallMutation | undefined,
  context: NodeContext,
): readonly ValidationInputValueType[] | undefined => {
  const expected =
    opcode === 'procedures_prototype'
      ? 'procedure-prototype'
      : opcode === 'procedures_call'
        ? 'procedure-call'
        : undefined;
  if (expected === undefined) {
    if (mutation !== undefined) {
      addDiagnostic(
        state,
        context,
        'INVALID_PROCEDURE_MUTATION',
        `Mutation type "${mutation.type}" is not valid on opcode "${opcode}".`,
        childPath(context.path, 'mutation'),
      );
    }
    return undefined;
  }
  if (mutation?.type !== expected) {
    addDiagnostic(
      state,
      context,
      'INVALID_PROCEDURE_MUTATION',
      `Opcode "${opcode}" requires a ${expected} mutation.`,
      childPath(context.path, 'mutation'),
    );
    return undefined;
  }

  const types = procedureArgumentTypes(mutation.proccode);
  const arrays =
    mutation.type === 'procedure-prototype'
      ? [mutation.argumentIds, mutation.argumentNames, mutation.argumentDefaults]
      : [mutation.argumentIds];
  const lengthsMatch = arrays.every((array) => array.length === types.length);
  const idsUnique = new Set(mutation.argumentIds).size === mutation.argumentIds.length;
  if (!lengthsMatch || !idsUnique) {
    addDiagnostic(
      state,
      context,
      'PROCEDURE_SIGNATURE_MISMATCH',
      !idsUnique
        ? 'Procedure argument IDs must be unique.'
        : 'Procedure placeholders and argument arrays must have matching lengths.',
      childPath(context.path, 'mutation'),
    );
    return undefined;
  }
  return types;
};

const procedureSpec = (
  spec: ValidationBlockSpec,
  mutation: ProcedurePrototypeMutation | ProcedureCallMutation,
  argumentTypes: readonly ValidationInputValueType[],
): ValidationBlockSpec => ({
  ...spec,
  shape:
    mutation.type === 'procedure-call'
      ? mutation.returnType === 'statement'
        ? 'command'
        : mutation.returnType
      : spec.shape,
  inputs: Object.fromEntries(
    mutation.argumentIds.map((id, index) => [
      id,
      { connection: 'value' as const, accepts: argumentTypes[index] ?? 'any' },
    ]),
  ),
});

const isDeclaredBlockDefault = (spec: ValidationInputSpec, opcode: string): boolean => {
  const defaultValue = spec.default;
  return (
    isRecord(defaultValue) &&
    defaultValue['type'] === 'block' &&
    isRecord(defaultValue['value']) &&
    defaultValue['value']['opcode'] === opcode
  );
};

const effectiveShape = (
  block: RecordValue,
  spec: ValidationBlockSpec,
): ValidationBlockSpec['shape'] => {
  const mutation = block['mutation'];
  if (isRecord(mutation) && mutation['type'] === 'procedure-call') {
    if (mutation['returnType'] === 'reporter' || mutation['returnType'] === 'boolean') {
      return mutation['returnType'];
    }
    return 'command';
  }
  return spec.shape;
};

const acceptsList = (spec: ValidationInputSpec): readonly ValidationInputValueType[] => {
  const accepts = spec.accepts;
  return accepts === undefined ? [] : typeof accepts === 'string' ? [accepts] : accepts;
};

const getBlockSpec = (
  registry: BlockSpecRegistryLike | undefined,
  opcode: string,
): ValidationBlockSpec | undefined => registry?.get(opcode) as ValidationBlockSpec | undefined;

const validateValueType = (
  state: ValidationState,
  input: RecordValue,
  spec: ValidationInputSpec,
  context: NodeContext,
): void => {
  const type = input['type'];
  if (type === 'empty') return;
  if (spec.connection === 'statement') {
    if (type === 'script') return;
    if (
      type === 'block' &&
      isRecord(input['value']) &&
      typeof input['value']['opcode'] === 'string' &&
      isDeclaredBlockDefault(spec, input['value']['opcode'])
    ) {
      return;
    }
    addDiagnostic(
      state,
      context,
      'INPUT_CONNECTION_MISMATCH',
      'A statement connection requires a script input or its declared block default.',
    );
    return;
  }
  if (type === 'script') {
    addDiagnostic(
      state,
      context,
      'INPUT_CONNECTION_MISMATCH',
      'A value connection cannot contain a script input.',
    );
    return;
  }
  if (typeof type !== 'string' || type === 'block') return;
  const accepted = acceptsList(spec);
  const stringNumberCoercion =
    (type === 'string' || type === 'number') &&
    (accepted.includes('string') || accepted.includes('number'));
  if (
    !accepted.includes('any') &&
    !accepted.includes(type as ValidationInputValueType) &&
    !stringNumberCoercion
  ) {
    addDiagnostic(
      state,
      context,
      'INPUT_TYPE_MISMATCH',
      `Input type "${type}" is not accepted; expected ${accepted.join(' | ') || 'no literal type'}.`,
      childPath(context.path, 'type'),
    );
  }
};

const validateConnectedBlock = (
  state: ValidationState,
  input: RecordValue,
  spec: ValidationInputSpec,
  context: NodeContext,
): void => {
  if (input['type'] === 'script' && isRecord(input['value'])) {
    const blocks = input['value']['blocks'];
    if (!Array.isArray(blocks)) return;
    blocks.forEach((block, index) => {
      if (!isRecord(block) || typeof block['opcode'] !== 'string') return;
      const childSpec = getBlockSpec(state.registry, block['opcode']);
      if (childSpec === undefined) return;
      const shape = effectiveShape(block, childSpec);
      if (shape !== 'command' && shape !== 'terminal') {
        const nodeId = blockIdFrom(block, context.nodeId);
        addDiagnostic(
          state,
          {
            path: childPath(context.path, 'value', 'blocks', index),
            ...(nodeId === undefined ? {} : { nodeId }),
          },
          'BLOCK_SHAPE_MISMATCH',
          `Block "${block['opcode']}" cannot be connected in a statement stack.`,
        );
      }
    });
    return;
  }
  if (input['type'] !== 'block' || !isRecord(input['value'])) return;
  const block = input['value'];
  const opcode = block['opcode'];
  if (typeof opcode !== 'string') return;
  const childSpec = getBlockSpec(state.registry, opcode);
  if (childSpec === undefined) return;
  const shape = effectiveShape(block, childSpec);
  if (spec.connection === 'statement') {
    if (!isDeclaredBlockDefault(spec, opcode) && shape !== 'command' && shape !== 'terminal') {
      addDiagnostic(
        state,
        context,
        'BLOCK_SHAPE_MISMATCH',
        `Block "${opcode}" cannot be connected to a statement input.`,
        childPath(context.path, 'value'),
      );
    }
    return;
  }
  if (shape === 'command' || shape === 'terminal' || shape === 'hat') {
    addDiagnostic(
      state,
      context,
      'BLOCK_SHAPE_MISMATCH',
      `Block "${opcode}" cannot be connected to a value input.`,
      childPath(context.path, 'value'),
    );
    return;
  }
  const accepted = acceptsList(spec);
  const acceptsShape =
    accepted.includes('any') ||
    (shape === 'boolean'
      ? accepted.includes('boolean')
      : accepted.some((type) => type !== 'boolean'));
  if (!acceptsShape) {
    addDiagnostic(
      state,
      context,
      'INPUT_TYPE_MISMATCH',
      `${shape === 'boolean' ? 'Boolean' : 'Reporter'} block "${opcode}" is not accepted; expected ${accepted.join(' | ')}.`,
      childPath(context.path, 'value'),
    );
  }
};

const validateInputSemantics = (
  state: ValidationState,
  input: unknown,
  spec: ValidationInputSpec,
  context: NodeContext,
): void => {
  if (!isRecord(input)) return;
  validateValueType(state, input, spec, context);
  validateConnectedBlock(state, input, spec, context);
  const obscured = input['obscuredShadow'];
  if (isRecord(obscured)) {
    const shadowContext = { ...context, path: childPath(context.path, 'obscuredShadow') };
    validateValueType(state, obscured, spec, shadowContext);
    validateConnectedBlock(state, obscured, spec, shadowContext);
    if (
      input['type'] === 'block' &&
      isRecord(input['value']) &&
      input['value']['shadow'] === true
    ) {
      addDiagnostic(
        state,
        context,
        'INVALID_SHADOW_PLACEMENT',
        'An active shadow block cannot also obscure another shadow.',
        childPath(context.path, 'value', 'shadow'),
      );
    }
  }
};

const validateProcedureDefinition = (
  state: ValidationState,
  block: RecordValue,
  opcode: string,
  context: NodeContext,
): void => {
  if (opcode !== 'procedures_definition') return;
  const inputs = block['inputs'];
  const customBlock = isRecord(inputs) ? inputs['custom_block'] : undefined;
  if (
    !isRecord(customBlock) ||
    customBlock['type'] !== 'block' ||
    !isRecord(customBlock['value']) ||
    customBlock['value']['opcode'] !== 'procedures_prototype'
  ) {
    addDiagnostic(
      state,
      context,
      'INVALID_PROCEDURE_DEFINITION',
      'procedures_definition requires a procedures_prototype custom_block input.',
      childPath(context.path, 'inputs', 'custom_block'),
    );
  }
};

const validateBlockSemantics = (
  state: ValidationState,
  block: RecordValue,
  opcode: string,
  fields: RecordValue | undefined,
  inputs: RecordValue | undefined,
  mutation: ProcedurePrototypeMutation | ProcedureCallMutation | undefined,
  context: NodeContext,
): void => {
  const argumentTypes = validateProcedureMutation(state, opcode, mutation, context);
  validateProcedureDefinition(state, block, opcode, context);
  const baseSpec = getBlockSpec(state.registry, opcode);
  if (baseSpec === undefined) {
    addDiagnostic(
      state,
      context,
      'MISSING_BLOCK_SPEC',
      `No BlockSpec is registered for opcode "${opcode}".`,
      childPath(context.path, 'opcode'),
    );
    return;
  }
  if (block['shadow'] === true && context.blockPosition !== 'input') {
    addDiagnostic(
      state,
      context,
      'INVALID_SHADOW_PLACEMENT',
      'A shadow block must be nested in an input.',
      childPath(context.path, 'shadow'),
    );
  }

  const spec =
    argumentTypes !== undefined && mutation !== undefined
      ? procedureSpec(baseSpec, mutation, argumentTypes)
      : baseSpec;
  if (fields !== undefined) {
    for (const [name, fieldSpec] of Object.entries(spec.fields)) {
      const field = fields[name];
      if (field === undefined) {
        addDiagnostic(
          state,
          context,
          'MISSING_FIELD',
          `Required field "${name}" is missing from "${opcode}".`,
          childPath(context.path, 'fields', name),
        );
      } else if (isRecord(field) && field['type'] !== fieldSpec.type) {
        addDiagnostic(
          state,
          context,
          'FIELD_TYPE_MISMATCH',
          `Field "${name}" has type ${JSON.stringify(field['type'])}; expected "${fieldSpec.type}".`,
          childPath(context.path, 'fields', name, 'type'),
        );
      }
    }
    for (const name of Object.keys(fields)) {
      if (!Object.hasOwn(spec.fields, name)) {
        addDiagnostic(
          state,
          context,
          'UNEXPECTED_FIELD',
          `Field "${name}" is not declared by the BlockSpec for "${opcode}".`,
          childPath(context.path, 'fields', name),
        );
      }
    }
  }

  if (inputs !== undefined) {
    for (const [name, inputSpec] of Object.entries(spec.inputs)) {
      const input = inputs[name];
      if (input === undefined) {
        addDiagnostic(
          state,
          context,
          'MISSING_INPUT',
          `Required input "${name}" is missing from "${opcode}".`,
          childPath(context.path, 'inputs', name),
        );
      } else {
        validateInputSemantics(state, input, inputSpec, {
          ...context,
          path: childPath(context.path, 'inputs', name),
        });
      }
    }
    for (const name of Object.keys(inputs)) {
      if (!Object.hasOwn(spec.inputs, name)) {
        addDiagnostic(
          state,
          context,
          'UNEXPECTED_INPUT',
          `Input "${name}" is not declared by the BlockSpec for "${opcode}".`,
          childPath(context.path, 'inputs', name),
        );
      }
    }
  }
};

/** Validate an untrusted script collection without modifying or materializing it. */
export const validateScripts = (
  scripts: unknown,
  options: ValidateScriptsOptions = {},
): AstDiagnostic[] => {
  const state: ValidationState = {
    diagnostics: [],
    nodes: new WeakMap(),
    ...(options.registry === undefined ? {} : { registry: options.registry }),
  };
  checkJsonValue(state, scripts, ['scripts'], new WeakSet(), new WeakSet());
  if (!Array.isArray(scripts)) {
    addDiagnostic(
      state,
      { path: ['scripts'] },
      'INVALID_SCRIPTS',
      'scripts must be an array of Script nodes.',
    );
    return state.diagnostics;
  }
  scripts.forEach((script, index) => validateScript(state, script, { path: ['scripts', index] }));
  return state.diagnostics;
};

/** Assert that a script collection has no validation errors. */
export function assertValidScripts(
  scripts: unknown,
  options: ValidateScriptsOptions = {},
): asserts scripts is readonly Script[] {
  const diagnostics = validateScripts(scripts, options);
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  if (errors.length > 0) throw new AstValidationError(errors);
}
