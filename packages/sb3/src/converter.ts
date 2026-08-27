import type {
  Block,
  BlockInput,
  Field,
  FieldType,
  Input,
  JsonObject,
  JsonValue,
  NumericKind,
  ProcedureArgumentDefault,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script,
} from "@scratch-code/ast"
import type {BlockSpec, BlockSpecRegistry, InputSpec} from "@scratch-code/block-spec"

import {
  DuplicateBlockIdError,
  InvalidSb3BlocksError,
  MissingBlockIdError,
} from "./errors.js"
import type {
  Sb3Block,
  Sb3BlockEntry,
  Sb3Blocks,
  Sb3Field,
  Sb3Input,
  Sb3InputValue,
  Sb3Primitive,
} from "./types.js"

const scalarOpcodes = new Set([
  "math_number",
  "math_positive_number",
  "math_whole_number",
  "math_integer",
  "math_angle",
  "colour_picker",
  "text",
  "matrix",
  "note",
])

const numericKinds: Readonly<Record<string, NumericKind>> = {
  math_number: "number",
  math_positive_number: "positive-number",
  math_whole_number: "whole-number",
  math_integer: "integer",
  math_angle: "angle",
}

const primitiveOpcodes: Readonly<Record<number, string>> = {
  4: "math_number",
  5: "math_positive_number",
  6: "math_whole_number",
  7: "math_integer",
  8: "math_angle",
  9: "colour_picker",
  10: "text",
  11: "event_broadcast_menu",
  12: "data_variable",
  13: "data_listcontents",
}

const opcodePrimitiveCodes: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(primitiveOpcodes).map(([code, opcode]) => [opcode, Number(code)]),
)

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isPrimitive = (value: unknown): value is Sb3Primitive =>
  Array.isArray(value) && typeof value[0] === "number" && value[0] >= 4 && value[0] <= 13

const isSb3Block = (value: unknown): value is Sb3Block =>
  isObject(value) && typeof value["opcode"] === "string" && isObject(value["inputs"]) && isObject(value["fields"])

const nodeSb3 = (node: {metadata?: {scratch?: {sb3?: JsonObject}}}): JsonObject | undefined =>
  node.metadata?.scratch?.sb3

const setBlockAstParent = (block: Block, parent: string | null | undefined): void => {
  const metadata = nodeSb3(block)
  if (metadata === undefined || Object.prototype.hasOwnProperty.call(metadata, "astParent")) return
  metadata["astParent"] = parent ?? null
}

const jsonEqual = (left: JsonValue | undefined, right: JsonValue | undefined): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const jsonString = (value: JsonValue | undefined): string => {
  if (typeof value === "string") return value
  if (value === undefined) return ""
  return JSON.stringify(value)
}

const parseJsonArray = (value: JsonValue | undefined): JsonValue[] | undefined => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return undefined
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as JsonValue[] : undefined
  } catch {
    return undefined
  }
}

const parseBoolean = (value: JsonValue | undefined): boolean =>
  value === true || value === "true"

const fieldTypeFallback = (name: string, raw: Sb3Field): FieldType => {
  if (name === "BROADCAST_OPTION") return "broadcast"
  if (name === "LIST") return "list"
  if (name === "VARIABLE") return "variable"
  return raw.length > 1 ? "dropdown" : "text"
}

const fieldSnapshot = (field: Field): JsonObject => ({
  type: field.type,
  value: field.value,
  ...("id" in field && field.id !== undefined ? {id: field.id} : {}),
})

const inputSnapshot = (input: Input): JsonObject => {
  switch (input.type) {
    case "empty":
      return {type: "empty"}
    case "block":
      return {
        type: "block",
        opcode: input.value.opcode,
        id: input.value.metadata?.scratch?.id ?? null,
      }
    case "script":
      return {
        type: "script",
        id: input.value.blocks[0]?.metadata?.scratch?.id ?? null,
      }
    case "number":
      return {
        type: "number",
        value: input.value,
        numericKind: input.metadata?.scratch?.numericKind ?? null,
      }
    default:
      return {type: input.type, value: input.value}
  }
}

const setInputSb3 = (input: Input, sb3: JsonObject): void => {
  const scratch = input.metadata?.scratch ?? {}
  Object.assign(input, {
    metadata: {
      ...(input.metadata ?? {}),
      scratch: {...scratch, sb3},
    },
  })
}

const semanticMutation = (raw: Sb3Block): Block["mutation"] => {
  const mutation = raw.mutation
  if (mutation === undefined) return undefined

  if (raw.opcode === "procedures_prototype") {
    const argumentIds = parseJsonArray(mutation["argumentids"])
    const argumentNames = parseJsonArray(mutation["argumentnames"])
    const argumentDefaults = parseJsonArray(mutation["argumentdefaults"])
    if (argumentIds === undefined || argumentNames === undefined || argumentDefaults === undefined) return undefined
    if (!argumentIds.every(value => typeof value === "string")) return undefined
    if (!argumentNames.every(value => typeof value === "string")) return undefined
    if (!argumentDefaults.every(value =>
      typeof value === "string" || typeof value === "number" || typeof value === "boolean")) return undefined
    return {
      type: "procedure-prototype",
      proccode: jsonString(mutation["proccode"]),
      argumentIds: argumentIds as string[],
      argumentNames: argumentNames as string[],
      argumentDefaults: argumentDefaults as ProcedureArgumentDefault[],
      warp: parseBoolean(mutation["warp"]),
    }
  }

  if (raw.opcode === "procedures_call") {
    const argumentIds = parseJsonArray(mutation["argumentids"])
    if (argumentIds === undefined || !argumentIds.every(value => typeof value === "string")) return undefined
    const returnValue = mutation["return"]
    const returnType = returnValue === 1 || returnValue === "1"
      ? "reporter"
      : returnValue === 2 || returnValue === "2"
        ? "boolean"
        : "statement"
    return {
      type: "procedure-call",
      proccode: jsonString(mutation["proccode"]),
      argumentIds: argumentIds as string[],
      warp: parseBoolean(mutation["warp"]),
      returnType,
    }
  }
  return undefined
}

const mutationSnapshot = (mutation: Block["mutation"]): JsonValue =>
  mutation === undefined ? null : cloneJson(mutation) as unknown as JsonValue

interface DeserializeState<TContext> {
  readonly blocks: Sb3Blocks
  readonly registry: BlockSpecRegistry<TContext>
  readonly blockCache: Map<string, Block>
  readonly ownedIds: Set<string>
  readonly hiddenIds: Set<string>
  readonly buildingScripts: Set<string>
}

const rawBlockFor = (state: DeserializeState<unknown>, id: string): Sb3BlockEntry => {
  const raw = state.blocks[id]
  if (raw === undefined) throw new InvalidSb3BlocksError(`Input references missing block "${id}".`)
  return raw
}

const makeField = (name: string, raw: Sb3Field, type: FieldType): Field => {
  const value = jsonString(raw[0])
  const base = {
    kind: "field" as const,
    type,
    value,
    metadata: {
      scratch: {
        sb3: {
          source: cloneJson(raw) as unknown as JsonValue,
          semantic: {type, value} as JsonObject,
        },
      },
    },
  }
  const id = raw[1]
  if ((type === "variable" || type === "list" || type === "broadcast") && typeof id === "string") {
    const field = {...base, id} as Field
    field.metadata!.scratch!.sb3!["semantic"] = fieldSnapshot(field)
    return field
  }
  return base as Field
}

const blockFromPrimitive = (
  primitive: Sb3Primitive,
  id: string | undefined,
  registry?: BlockSpecRegistry<unknown>,
): Block => {
  const opcode = primitiveOpcodes[primitive[0]]
  if (opcode === undefined) throw new InvalidSb3BlocksError(`Unknown SB3 primitive code ${String(primitive[0])}.`)
  registry?.require(opcode)
  let fieldName: string
  let fieldType: FieldType
  if (primitive[0] === 11) {
    fieldName = "BROADCAST_OPTION"
    fieldType = "broadcast"
  } else if (primitive[0] === 12) {
    fieldName = "VARIABLE"
    fieldType = "variable"
  } else if (primitive[0] === 13) {
    fieldName = "LIST"
    fieldType = "list"
  } else {
    throw new InvalidSb3BlocksError(`Primitive ${primitive[0]} cannot be represented as a standalone AST block.`)
  }
  const rawField: Sb3Field = primitive.length > 2
    ? [primitive[1] ?? "", primitive[2] ?? null]
    : [primitive[1] ?? ""]
  return {
    kind: "block",
    opcode,
    inputs: {},
    fields: {[fieldName]: makeField(fieldName, rawField, fieldType)},
    metadata: {
      scratch: {
        ...(id === undefined ? {} : {id}),
        sb3: {
          source: cloneJson(primitive) as unknown as JsonValue,
          semanticMutation: null,
        },
      },
    },
  }
}

const literalFromPrimitive = (primitive: Sb3Primitive): Input => {
  const value = primitive[1]
  switch (primitive[0]) {
    case 4:
    case 5:
    case 6:
    case 7:
    case 8: {
      const numericKind = numericKinds[primitiveOpcodes[primitive[0]]!]!
      return {
        kind: "input",
        type: "number",
        value: typeof value === "number" || typeof value === "string" ? value : jsonString(value),
        metadata: {scratch: {numericKind}},
      }
    }
    case 9:
      return {kind: "input", type: "color", value: jsonString(value)}
    case 10:
      return {kind: "input", type: "string", value: jsonString(value)}
    case 11:
    case 12:
    case 13:
      return {kind: "input", type: "block", value: blockFromPrimitive(primitive, undefined)}
  }
}

const literalFromScalarBlock = (raw: Sb3Block, id: string): Input => {
  const fieldName = raw.opcode === "colour_picker"
    ? "COLOUR"
    : raw.opcode === "text"
      ? "TEXT"
      : raw.opcode === "matrix"
        ? "MATRIX"
        : raw.opcode === "note"
          ? "NOTE"
          : "NUM"
  const value = raw.fields[fieldName]?.[0]
  let input: Input
  if (raw.opcode in numericKinds) {
    input = {
      kind: "input",
      type: "number",
      value: typeof value === "number" || typeof value === "string" ? value : jsonString(value),
      metadata: {scratch: {numericKind: numericKinds[raw.opcode]!}},
    }
  } else if (raw.opcode === "colour_picker") {
    input = {kind: "input", type: "color", value: jsonString(value)}
  } else if (raw.opcode === "matrix") {
    input = {kind: "input", type: "matrix", value: jsonString(value)}
  } else if (raw.opcode === "note") {
    input = {
      kind: "input",
      type: "note",
      value: typeof value === "number" || typeof value === "string" ? value : jsonString(value),
    }
  } else {
    input = {kind: "input", type: "string", value: jsonString(value)}
  }
  setInputSb3(input, {
    sourceScalarId: id,
    sourceScalarBlock: cloneJson(raw) as unknown as JsonValue,
  })
  return input
}

const dynamicInputSpec = (raw: Sb3Block, name: string): InputSpec | undefined => {
  if (raw.opcode === "procedures_call" || raw.opcode === "procedures_prototype") {
    return {connection: "value", accepts: "any"}
  }
  return undefined
}

const convertBlock = <TContext>(state: DeserializeState<TContext>, id: string): Block => {
  const cached = state.blockCache.get(id)
  if (cached !== undefined) return cached
  const entry = rawBlockFor(state as DeserializeState<unknown>, id)
  state.ownedIds.add(id)
  if (isPrimitive(entry)) {
    const block = blockFromPrimitive(entry, id, state.registry as BlockSpecRegistry<unknown>)
    state.blockCache.set(id, block)
    return block
  }
  if (!isSb3Block(entry)) throw new InvalidSb3BlocksError(`Block "${id}" is not a valid SB3 block.`)
  const spec = state.registry.require(entry.opcode)
  const mutation = semanticMutation(entry)
  const block: Block = {
    kind: "block",
    opcode: entry.opcode,
    inputs: {},
    fields: {},
    ...(mutation === undefined ? {} : {mutation}),
    metadata: {
      scratch: {
        id,
        sb3: {
          source: cloneJson(entry) as unknown as JsonValue,
          semanticMutation: mutationSnapshot(mutation),
          parentPresent: Object.prototype.hasOwnProperty.call(entry, "parent"),
        },
      },
    },
  }
  state.blockCache.set(id, block)

  for (const [name, rawField] of Object.entries(entry.fields)) {
    if (!Array.isArray(rawField)) continue
    const type = spec.fields[name]?.type ?? fieldTypeFallback(name, rawField)
    block.fields[name] = makeField(name, rawField, type)
  }

  const inputNames = new Set([...Object.keys(spec.inputs), ...Object.keys(entry.inputs)])
  for (const name of inputNames) {
    const rawInput = entry.inputs[name]
    const inputSpec = spec.inputs[name] ?? dynamicInputSpec(entry, name)
    if (inputSpec === undefined) {
      throw new InvalidSb3BlocksError(`Block "${entry.opcode}" has input "${name}" which is not declared by its spec.`)
    }
    block.inputs[name] = rawInput === undefined
      ? {kind: "input", type: "empty"}
      : convertInput(state, id, name, rawInput, inputSpec)
  }
  return block
}

const convertInputValue = <TContext>(
  state: DeserializeState<TContext>,
  parentId: string,
  value: Sb3InputValue,
  inputSpec: InputSpec,
): Input => {
  if (value === null) return {kind: "input", type: "empty"}
  if (isPrimitive(value)) {
    if (value[0] >= 11) {
      return {
        kind: "input",
        type: "block",
        value: blockFromPrimitive(value, undefined, state.registry as BlockSpecRegistry<unknown>),
      }
    }
    return literalFromPrimitive(value)
  }
  if (typeof value !== "string") throw new InvalidSb3BlocksError(`Invalid input on block "${parentId}".`)
  const child = rawBlockFor(state as DeserializeState<unknown>, value)
  if (isPrimitive(child)) {
    if (child[0] >= 11) {
      state.ownedIds.add(value)
      return {
        kind: "input",
        type: "block",
        value: blockFromPrimitive(child, value, state.registry as BlockSpecRegistry<unknown>),
      }
    }
    state.ownedIds.add(value)
    return literalFromPrimitive(child)
  }
  if (!isSb3Block(child)) throw new InvalidSb3BlocksError(`Input references invalid block "${value}".`)
  if (scalarOpcodes.has(child.opcode) && child.shadow) {
    state.registry.require(child.opcode)
    state.ownedIds.add(value)
    return literalFromScalarBlock(child, value)
  }
  const childBlock = convertBlock(state, value)
  setBlockAstParent(childBlock, parentId)
  const blockDefault = inputSpec.default?.type === "block"
  if (inputSpec.connection === "statement" && !blockDefault) {
    return {kind: "input", type: "script", value: convertScript(state, value, false, parentId)}
  }
  return {kind: "input", type: "block", value: childBlock}
}

const convertInput = <TContext>(
  state: DeserializeState<TContext>,
  parentId: string,
  name: string,
  rawInput: Sb3Input,
  inputSpec: InputSpec,
): Input => {
  if (!Array.isArray(rawInput) || (rawInput[0] !== 1 && rawInput[0] !== 2 && rawInput[0] !== 3)) {
    throw new InvalidSb3BlocksError(`Invalid input "${name}" on block "${parentId}".`)
  }
  const mode = rawInput[0]
  const active = rawInput[1] ?? null
  const semanticValue = mode === 3 && active === null ? rawInput[2] ?? null : active
  const input = convertInputValue(state, parentId, semanticValue, inputSpec)
  if (mode === 3) {
    const hidden = rawInput[2]
    if (typeof hidden === "string") state.hiddenIds.add(hidden)
  }
  setInputSb3(input, {
    ...(nodeSb3(input) ?? {}),
    source: cloneJson(rawInput) as unknown as JsonValue,
    semantic: inputSnapshot(input),
    sourceUsesShadow: mode === 3 && active === null,
  })
  return input
}

const convertScript = <TContext>(
  state: DeserializeState<TContext>,
  rootId: string,
  topLevel: boolean,
  parentId?: string,
): Script => {
  if (state.buildingScripts.has(rootId)) {
    throw new InvalidSb3BlocksError(`Cycle detected while building script at block "${rootId}".`)
  }
  state.buildingScripts.add(rootId)
  const blocks: Block[] = []
  const chainIds = new Set<string>()
  let id: string | null = rootId
  let previousId: string | null = null
  while (id !== null) {
    if (chainIds.has(id)) throw new InvalidSb3BlocksError(`Cycle detected in next chain at block "${id}".`)
    chainIds.add(id)
    const entry = rawBlockFor(state as DeserializeState<unknown>, id)
    const block = convertBlock(state, id)
    setBlockAstParent(
      block,
      previousId ?? (topLevel ? null : parentId ?? (isSb3Block(entry) ? entry.parent : null)),
    )
    blocks.push(block)
    previousId = id
    id = isSb3Block(entry) && typeof entry.next === "string" ? entry.next : null
  }
  state.buildingScripts.delete(rootId)
  const root = state.blocks[rootId]
  const x = isSb3Block(root) && typeof root.x === "number"
    ? root.x
    : isPrimitive(root) && typeof root[3] === "number"
      ? root[3]
      : undefined
  const y = isSb3Block(root) && typeof root.y === "number"
    ? root.y
    : isPrimitive(root) && typeof root[4] === "number"
      ? root[4]
      : undefined
  return {
    kind: "script",
    blocks,
    metadata: {
      scratch: {
        ...(topLevel && x !== undefined ? {x} : {}),
        ...(topLevel && y !== undefined ? {y} : {}),
        sb3: {
          rootId,
          topLevel,
          ...(parentId === undefined ? {} : {parentId}),
        },
      },
    },
  }
}

const validateBlocks = (blocks: Sb3Blocks): void => {
  if (!isObject(blocks)) throw new InvalidSb3BlocksError("SB3 target.blocks must be an object.")
  for (const [id, entry] of Object.entries(blocks)) {
    if (!isPrimitive(entry) && !isSb3Block(entry)) {
      throw new InvalidSb3BlocksError(`Block entry "${id}" is neither an SB3 block nor a supported primitive.`)
    }
  }
}

export const deserializeBlocks = <TContext>(
  blocks: Sb3Blocks,
  registry: BlockSpecRegistry<TContext>,
): Script[] => {
  validateBlocks(blocks)
  const source = cloneJson(blocks)
  for (const entry of Object.values(source)) {
    if (isSb3Block(entry)) registry.require(entry.opcode)
    else if (isPrimitive(entry)) {
      const opcode = primitiveOpcodes[entry[0]]
      if (opcode !== undefined) registry.require(opcode)
    }
  }
  const state: DeserializeState<TContext> = {
    blocks: source,
    registry,
    blockCache: new Map(),
    ownedIds: new Set(),
    hiddenIds: new Set(),
    buildingScripts: new Set(),
  }
  const scripts: Script[] = []
  for (const [id, entry] of Object.entries(source)) {
    if ((isPrimitive(entry) && entry.length > 3) || (isSb3Block(entry) && entry.topLevel)) {
      scripts.push(convertScript(state, id, true))
    }
  }
  for (const id of Object.keys(source)) {
    if (!state.ownedIds.has(id) && !state.hiddenIds.has(id)) {
      const entry = source[id]
      const parent = isSb3Block(entry) && typeof entry.parent === "string" ? entry.parent : undefined
      scripts.push(convertScript(state, id, false, parent))
    }
  }
  if (scripts[0] !== undefined) {
    const scratch = scripts[0].metadata!.scratch!
    scratch.sb3 = {
      ...(scratch.sb3 ?? {}),
      sourceBlocks: source as unknown as JsonObject,
      representedIds: [...state.ownedIds],
    }
  }
  return scripts
}

interface SerializeState {
  readonly result: Sb3Blocks
  readonly blocksById: Map<string, Block>
}

const blockId = (block: Block): string | undefined => block.metadata?.scratch?.id

const requireBlockId = (block: Block): string => {
  const id = blockId(block)
  if (id === undefined) throw new MissingBlockIdError(block.opcode)
  return id
}

const primitiveForLiteral = (input: Exclude<Input, BlockInput | {kind: "input"; type: "script"; value: Script} | {kind: "input"; type: "empty"}>): Sb3Primitive => {
  switch (input.type) {
    case "number": {
      const code = input.metadata?.scratch?.numericKind === "positive-number" ? 5
        : input.metadata?.scratch?.numericKind === "whole-number" ? 6
          : input.metadata?.scratch?.numericKind === "integer" ? 7
            : input.metadata?.scratch?.numericKind === "angle" ? 8
              : 4
      return [code, input.value]
    }
    case "color":
      return [9, input.value]
    case "string":
      return [10, input.value]
    case "matrix":
    case "note":
      throw new MissingBlockIdError(input.type)
  }
}

const primitiveForBlock = (block: Block, topLevel = false, x = 0, y = 0): Sb3Primitive | undefined => {
  const code = opcodePrimitiveCodes[block.opcode]
  if (code === undefined) return undefined
  const fieldName = block.opcode === "event_broadcast_menu" ? "BROADCAST_OPTION"
    : block.opcode === "data_variable" ? "VARIABLE"
      : block.opcode === "data_listcontents" ? "LIST"
        : block.opcode === "colour_picker" ? "COLOUR"
          : block.opcode === "text" ? "TEXT"
            : "NUM"
  const field = block.fields[fieldName]
  if (field === undefined) return undefined
  const primitive: Sb3Primitive = [code as Sb3Primitive[0], field.value]
  if ("id" in field && field.id !== undefined) primitive.push(field.id)
  if (topLevel && (code === 12 || code === 13)) primitive.push(x, y)
  return primitive
}

const sourceInput = (input: Input): Sb3Input | undefined => {
  const source = nodeSb3(input)?.["source"]
  return Array.isArray(source) ? cloneJson(source) as Sb3Input : undefined
}

const serializeScalarObject = (state: SerializeState, input: Input, id: string): void => {
  const meta = nodeSb3(input)
  const raw = meta?.["sourceScalarBlock"]
  if (!isSb3Block(raw)) throw new InvalidSb3BlocksError(`Missing source scalar block for "${id}".`)
  const result = cloneJson(raw)
  const fieldName = result.opcode === "colour_picker" ? "COLOUR"
    : result.opcode === "text" ? "TEXT"
      : result.opcode === "matrix" ? "MATRIX"
        : result.opcode === "note" ? "NOTE"
          : "NUM"
  const field = result.fields[fieldName]
  if (field !== undefined && input.type !== "block" && input.type !== "script" && input.type !== "empty") {
    field[0] = input.value
  }
  state.result[id] = result
}

const serializeChild = (
  state: SerializeState,
  input: Input,
  parentId: string,
): Sb3InputValue => {
  if (input.type === "empty") return null
  if (input.type === "script") {
    const first = input.value.blocks[0]
    if (first === undefined) return null
    serializeScriptBlocks(state, input.value, false, parentId)
    return requireBlockId(first)
  }
  if (input.type === "block") {
    const primitive = primitiveForBlock(input.value)
    const id = blockId(input.value)
    if (id === undefined && primitive !== undefined) return primitive
    serializeSingleBlock(state, input.value, false, parentId, null)
    return requireBlockId(input.value)
  }
  const scalarId = nodeSb3(input)?.["sourceScalarId"]
  if (typeof scalarId === "string") {
    serializeScalarObject(state, input, scalarId)
    return scalarId
  }
  return primitiveForLiteral(input)
}

const serializeInput = (
  state: SerializeState,
  input: Input,
  parentId: string,
): Sb3Input | undefined => {
  if (input.type === "empty") return undefined
  const raw = sourceInput(input)
  const currentSnapshot = inputSnapshot(input)
  const originalSnapshot = nodeSb3(input)?.["semantic"]
  const value = serializeChild(state, input, parentId)
  if (raw !== undefined && jsonEqual(currentSnapshot, originalSnapshot)) return raw
  if (raw?.[0] === 3) {
    const sourceUsesShadow = nodeSb3(input)?.["sourceUsesShadow"] === true
    return [3, sourceUsesShadow ? null : value, cloneJson(raw[2])]
  }
  const mode = raw?.[0] === 1 ? 1 : 2
  return [mode, value]
}

const serializeField = (field: Field): Sb3Field => {
  const raw = nodeSb3(field)?.["source"]
  const original = nodeSb3(field)?.["semantic"]
  if (Array.isArray(raw) && jsonEqual(fieldSnapshot(field), original)) return cloneJson(raw) as Sb3Field
  const result: Sb3Field = [field.value]
  if ("id" in field && field.id !== undefined) result.push(field.id)
  return result
}

const serializeProcedureMutation = (mutation: ProcedurePrototypeMutation | ProcedureCallMutation): JsonObject => {
  const common: JsonObject = {
    tagName: "mutation",
    children: [],
    proccode: mutation.proccode,
    argumentids: JSON.stringify(mutation.argumentIds),
    warp: JSON.stringify(mutation.warp),
  }
  if (mutation.type === "procedure-prototype") {
    common["argumentnames"] = JSON.stringify(mutation.argumentNames)
    common["argumentdefaults"] = JSON.stringify(mutation.argumentDefaults)
  } else if (mutation.returnType !== "statement") {
    common["return"] = mutation.returnType === "reporter" ? "1" : "2"
  }
  return common
}

const serializeMutation = (block: Block, result: Sb3Block): void => {
  const rawSource = nodeSb3(block)?.["source"]
  const rawMutation = isSb3Block(rawSource) ? rawSource.mutation : undefined
  const originalSemantic = nodeSb3(block)?.["semanticMutation"]
  const currentSemantic = mutationSnapshot(block.mutation)
  if (jsonEqual(currentSemantic, originalSemantic)) {
    if (rawMutation === undefined) delete result.mutation
    else result.mutation = cloneJson(rawMutation)
    return
  }
  if (block.mutation === undefined) delete result.mutation
  else result.mutation = serializeProcedureMutation(block.mutation)
}

const serializeSingleBlock = (
  state: SerializeState,
  block: Block,
  topLevel: boolean,
  parent: string | null | undefined,
  next: string | null,
  script?: Script,
): void => {
  const id = requireBlockId(block)
  const previous = state.blocksById.get(id)
  if (previous !== undefined) {
    if (previous !== block) throw new DuplicateBlockIdError(id)
    const existing = state.result[id]
    const source = nodeSb3(block)?.["source"]
    if (topLevel && isSb3Block(existing) && isSb3Block(source)) {
      existing.topLevel = true
      if (source.parent === undefined) delete existing.parent
      else existing.parent = source.parent
      existing.x = script?.metadata?.scratch?.x ?? source.x ?? 0
      existing.y = script?.metadata?.scratch?.y ?? source.y ?? 0
    }
    return
  }
  state.blocksById.set(id, block)

  const source = nodeSb3(block)?.["source"]
  const x = script?.metadata?.scratch?.x ?? 0
  const y = script?.metadata?.scratch?.y ?? 0
  const primitive = primitiveForBlock(block, topLevel, x, y)
  if (primitive !== undefined && isPrimitive(source)) {
    state.result[id] = primitive
    return
  }
  const result: Sb3Block = isSb3Block(source)
    ? cloneJson(source)
    : {
        opcode: block.opcode,
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      }
  result.opcode = block.opcode
  result.next = next
  const parentPresent = nodeSb3(block)?.["parentPresent"]
  const originalAstParent = nodeSb3(block)?.["astParent"]
  const parentUnchanged = (parent ?? null) === (originalAstParent ?? null)
  if (parentUnchanged && isSb3Block(source)) {
    if (!Object.prototype.hasOwnProperty.call(source, "parent") || source.parent === undefined) delete result.parent
    else result.parent = source.parent
  } else if (parentPresent === false && parent === undefined) delete result.parent
  else if (parent !== undefined) result.parent = parent
  result.shadow = isSb3Block(source) ? source.shadow : false
  result.topLevel = topLevel
  if (topLevel) {
    result.x = x
    result.y = y
  } else {
    delete result.x
    delete result.y
  }
  result.fields = Object.fromEntries(
    Object.entries(block.fields).map(([name, field]) => [name, serializeField(field)]),
  )
  const inputs: Record<string, Sb3Input> = {}
  for (const [name, input] of Object.entries(block.inputs)) {
    const serialized = serializeInput(state, input, id)
    if (serialized !== undefined) inputs[name] = serialized
  }
  result.inputs = inputs
  serializeMutation(block, result)
  state.result[id] = result
}

const serializeScriptBlocks = (
  state: SerializeState,
  script: Script,
  topLevel: boolean,
  parent?: string,
): void => {
  for (let index = 0; index < script.blocks.length; index += 1) {
    const block = script.blocks[index]!
    const previous = index === 0 ? undefined : script.blocks[index - 1]
    const next = script.blocks[index + 1]
    const blockParent = index === 0
      ? topLevel
        ? null
        : parent ?? (isSb3Block(nodeSb3(block)?.["source"])
          ? (nodeSb3(block)!["source"] as unknown as Sb3Block).parent
          : undefined)
      : requireBlockId(previous!)
    serializeSingleBlock(
      state,
      block,
      topLevel && index === 0,
      blockParent,
      next === undefined ? null : requireBlockId(next),
      index === 0 ? script : undefined,
    )
  }
}

export const serializeBlocks = (scripts: readonly Script[]): Sb3Blocks => {
  const result: Sb3Blocks = {}
  const originalOwnedIds = new Set<string>()
  for (const script of scripts) {
    const meta = nodeSb3(script)
    const sourceBlocks = meta?.["sourceBlocks"]
    if (isObject(sourceBlocks)) Object.assign(result, cloneJson(sourceBlocks))
    const represented = meta?.["representedIds"]
    if (Array.isArray(represented)) {
      for (const id of represented) if (typeof id === "string") originalOwnedIds.add(id)
    }
  }
  for (const id of originalOwnedIds) delete result[id]
  const state: SerializeState = {
    result,
    blocksById: new Map(),
  }
  for (const script of scripts) {
    const meta = nodeSb3(script)
    const topLevel = meta?.["topLevel"] !== false
    const parent = typeof meta?.["parentId"] === "string" ? meta["parentId"] : undefined
    serializeScriptBlocks(state, script, topLevel, parent)
  }
  return result
}
