import type {
  Block,
  BlockInput,
  Field,
  FieldType,
  Input,
  JsonObject,
  JsonValue,
  NumericKind,
  ObscuredShadow,
  ProcedureArgumentDefault,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script,
} from "@scratch-code/ast"
import type {BlockSpecRegistry, InputSpec} from "@scratch-code/block-spec"

import {
  DuplicateBlockIdError,
  InvalidBlockGraphError,
  InvalidSb3BlocksError,
  MissingBlockIdError,
} from "./errors.js"
import {getSb3BlockMetadata} from "./metadata.js"
import type {
  Sb3Block,
  Sb3BlockEntry,
  Sb3BlockMetadata,
  Sb3Blocks,
  Sb3Field,
  Sb3Input,
  Sb3InputValue,
  Sb3Primitive,
} from "./types.js"

const scalarOpcodes = new Set([
  "math_number", "math_positive_number", "math_whole_number", "math_integer",
  "math_angle", "colour_picker", "text", "matrix", "note",
])

const numericKinds: Readonly<Record<string, NumericKind>> = {
  math_number: "number",
  math_positive_number: "positive-number",
  math_whole_number: "whole-number",
  math_integer: "integer",
  math_angle: "angle",
}

const primitiveOpcodes: Readonly<Record<number, string>> = {
  4: "math_number", 5: "math_positive_number", 6: "math_whole_number",
  7: "math_integer", 8: "math_angle", 9: "colour_picker", 10: "text",
  11: "event_broadcast_menu", 12: "data_variable", 13: "data_listcontents",
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
  isObject(value) && typeof value["opcode"] === "string" &&
  isObject(value["inputs"]) && isObject(value["fields"])

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

const parseBoolean = (value: JsonValue | undefined): boolean => value === true || value === "true"

const fieldTypeFallback = (name: string, raw: Sb3Field): FieldType => {
  if (name === "BROADCAST_OPTION") return "broadcast"
  if (name === "LIST") return "list"
  if (name === "VARIABLE") return "variable"
  return raw.length > 1 ? "dropdown" : "text"
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
    return {
      type: "procedure-call",
      proccode: jsonString(mutation["proccode"]),
      argumentIds: argumentIds as string[],
      warp: parseBoolean(mutation["warp"]),
      returnType: returnValue === 1 || returnValue === "1"
        ? "reporter"
        : returnValue === 2 || returnValue === "2" ? "boolean" : "statement",
    }
  }
  return undefined
}

const setSb3Metadata = <T extends {metadata?: Record<string, unknown>}>(
  node: T,
  metadata: Sb3BlockMetadata,
): void => {
  node.metadata = {...(node.metadata ?? {}), sb3: metadata}
}

const dynamicInputSpec = (raw: Sb3Block, _name: string): InputSpec | undefined => {
  if (raw.opcode === "procedures_call" || raw.opcode === "procedures_prototype") {
    return {connection: "value", accepts: "any"}
  }
  return undefined
}

interface GraphEdge {
  readonly childId: string
  readonly parentId: string
  readonly kind: "next" | "input" | "shadow"
  readonly inputName?: string
}

const inputReferences = (parentId: string, inputName: string, input: Sb3Input): GraphEdge[] => {
  if (!Array.isArray(input) || (input[0] !== 1 && input[0] !== 2 && input[0] !== 3)) {
    throw new InvalidSb3BlocksError(`Invalid input "${inputName}" on block "${parentId}".`)
  }
  const result: GraphEdge[] = []
  if (typeof input[1] === "string") result.push({childId: input[1], parentId, kind: "input", inputName})
  if (input[0] === 3 && typeof input[2] === "string") {
    result.push({childId: input[2], parentId, kind: "shadow", inputName})
  }
  return result
}

const validateConnection = <TContext>(
  registry: BlockSpecRegistry<TContext>,
  parent: Sb3Block,
  inputSpec: InputSpec,
  child: Sb3BlockEntry,
  edge: GraphEdge,
): void => {
  if (isPrimitive(child)) {
    if (inputSpec.connection === "statement") {
      throw new InvalidBlockGraphError(`Statement input "${edge.inputName}" cannot contain a primitive.`)
    }
    return
  }
  if (!isSb3Block(child)) return
  const childSpec = registry.require(child.opcode)
  const childMutation = semanticMutation(child)
  const childShape = childMutation?.type === "procedure-call"
    ? childMutation.returnType === "reporter" ? "reporter"
      : childMutation.returnType === "boolean" ? "boolean" : "command"
    : childSpec.shape
  const isDeclaredBlockDefault = inputSpec.default?.type === "block" && inputSpec.default.value.opcode === child.opcode
  if (inputSpec.connection === "statement") {
    if (!isDeclaredBlockDefault && childShape !== "command" && childShape !== "terminal") {
      throw new InvalidBlockGraphError(
        `Statement input "${edge.inputName}" on "${parent.opcode}" cannot contain "${child.opcode}".`,
      )
    }
  } else if (childShape === "command" || childShape === "terminal" || childShape === "hat") {
    throw new InvalidBlockGraphError(
      `Value input "${edge.inputName}" on "${parent.opcode}" cannot contain "${child.opcode}".`,
    )
  }
}

const validateGraph = <TContext>(blocks: Sb3Blocks, registry: BlockSpecRegistry<TContext>): readonly string[] => {
  if (!isObject(blocks)) throw new InvalidSb3BlocksError("SB3 target.blocks must be an object.")
  const edges: GraphEdge[] = []
  for (const [id, entry] of Object.entries(blocks)) {
    if (!isPrimitive(entry) && !isSb3Block(entry)) {
      throw new InvalidSb3BlocksError(`Block entry "${id}" is neither an SB3 block nor a supported primitive.`)
    }
    if (isPrimitive(entry)) {
      const opcode = primitiveOpcodes[entry[0]]
      if (opcode === undefined) throw new InvalidSb3BlocksError(`Unknown SB3 primitive code ${String(entry[0])}.`)
      registry.require(opcode)
      continue
    }
    const spec = registry.require(entry.opcode)
    if (typeof entry.next === "string") {
      if (spec.shape === "reporter" || spec.shape === "boolean") {
        throw new InvalidBlockGraphError(`Reporter block "${id}" cannot have a next connection.`)
      }
      edges.push({childId: entry.next, parentId: id, kind: "next"})
    } else if (entry.next !== null) throw new InvalidSb3BlocksError(`Block "${id}" has an invalid next value.`)
    for (const [name, rawInput] of Object.entries(entry.inputs)) {
      const inputSpec = spec.inputs[name] ?? dynamicInputSpec(entry, name)
      if (inputSpec === undefined) throw new InvalidBlockGraphError(`Block "${entry.opcode}" has undeclared input "${name}".`)
      for (const edge of inputReferences(id, name, rawInput)) {
        const child = blocks[edge.childId]
        if (child === undefined) {
          throw new InvalidBlockGraphError(`Input "${name}" on block "${id}" references missing block "${edge.childId}".`)
        }
        validateConnection(registry, entry, inputSpec, child, edge)
        edges.push(edge)
      }
    }
  }

  const owner = new Map<string, GraphEdge>()
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const existing = owner.get(edge.childId)
    if (existing !== undefined) {
      throw new InvalidBlockGraphError(`Block "${edge.childId}" is shared by "${existing.parentId}" and "${edge.parentId}".`)
    }
    owner.set(edge.childId, edge)
    adjacency.set(edge.parentId, [...(adjacency.get(edge.parentId) ?? []), edge.childId])
    const child = blocks[edge.childId]
    if (isSb3Block(child)) {
      if (child.topLevel) throw new InvalidBlockGraphError(`Referenced block "${edge.childId}" cannot be top-level.`)
      if (child.parent !== undefined && child.parent !== edge.parentId) {
        throw new InvalidBlockGraphError(
          `Block "${edge.childId}" has parent ${JSON.stringify(child.parent)}; expected "${edge.parentId}".`,
        )
      }
    }
  }

  const roots = Object.keys(blocks).filter(id => !owner.has(id))

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new InvalidBlockGraphError(`Cycle detected at block "${id}".`)
    if (visited.has(id)) return
    visiting.add(id)
    for (const child of adjacency.get(id) ?? []) visit(child)
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of Object.keys(blocks)) visit(id)
  return roots
}

const makeField = (raw: Sb3Field, type: FieldType): Field => {
  const value = raw[0] === undefined ? "" : cloneJson(raw[0])
  const id = raw[1]
  const base = {kind: "field" as const, type, value}
  return ((type === "variable" || type === "list" || type === "broadcast") && typeof id === "string"
    ? {...base, id}
    : base) as Field
}

const blockFromPrimitive = (
  primitive: Sb3Primitive,
  id: string | undefined,
  registry?: BlockSpecRegistry<unknown>,
): Block => {
  const opcode = primitiveOpcodes[primitive[0]]
  if (opcode === undefined) throw new InvalidSb3BlocksError(`Unknown SB3 primitive code ${String(primitive[0])}.`)
  registry?.require(opcode)
  if (primitive[0] < 11) {
    throw new InvalidSb3BlocksError(`Primitive ${primitive[0]} cannot be represented as a standalone AST block.`)
  }
  const fieldName = primitive[0] === 11 ? "BROADCAST_OPTION" : primitive[0] === 12 ? "VARIABLE" : "LIST"
  const fieldType: FieldType = primitive[0] === 11 ? "broadcast" : primitive[0] === 12 ? "variable" : "list"
  const rawField: Sb3Field = primitive.length > 2
    ? [primitive[1] ?? "", primitive[2] ?? null]
    : [primitive[1] ?? ""]
  return {
    kind: "block", opcode, inputs: {}, fields: {[fieldName]: makeField(rawField, fieldType)},
    ...(id === undefined ? {} : {metadata: {scratch: {id}}}),
  }
}

const literalFromPrimitive = (primitive: Sb3Primitive): ObscuredShadow => {
  const value = primitive[1]
  switch (primitive[0]) {
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return {
        kind: "input", type: "number",
        value: typeof value === "number" || typeof value === "string" ? value : jsonString(value),
        metadata: {scratch: {numericKind: numericKinds[primitiveOpcodes[primitive[0]]!]!}},
      }
    case 9: return {kind: "input", type: "color", value: jsonString(value)}
    case 10: return {kind: "input", type: "string", value: jsonString(value)}
    case 11:
    case 12:
    case 13: return {kind: "input", type: "block", value: blockFromPrimitive(primitive, undefined)}
  }
}

const scalarFieldName = (opcode: string): string => opcode === "colour_picker"
  ? "COLOUR"
  : opcode === "text" ? "TEXT" : opcode === "matrix" ? "MATRIX" : opcode === "note" ? "NOTE" : "NUM"

const literalFromScalarBlock = (raw: Sb3Block, id: string): ObscuredShadow => {
  const value = raw.fields[scalarFieldName(raw.opcode)]?.[0]
  let input: ObscuredShadow
  if (raw.opcode in numericKinds) {
    input = {
      kind: "input", type: "number",
      value: typeof value === "number" || typeof value === "string" ? value : jsonString(value),
      metadata: {scratch: {numericKind: numericKinds[raw.opcode]!}},
    }
  } else if (raw.opcode === "colour_picker") input = {kind: "input", type: "color", value: jsonString(value)}
  else if (raw.opcode === "matrix") input = {kind: "input", type: "matrix", value: jsonString(value)}
  else if (raw.opcode === "note") {
    input = {
      kind: "input", type: "note",
      value: typeof value === "number" || typeof value === "string" ? value : jsonString(value),
    }
  } else input = {kind: "input", type: "string", value: jsonString(value)}
  input.metadata = {
    ...(input.metadata ?? {}),
    scratch: {...(input.metadata?.scratch ?? {}), id},
  }
  return input
}

interface DeserializeState<TContext> {
  readonly blocks: Sb3Blocks
  readonly registry: BlockSpecRegistry<TContext>
  readonly blockCache: Map<string, Block>
}

const rawBlockFor = (state: DeserializeState<unknown>, id: string): Sb3BlockEntry => {
  const raw = state.blocks[id]
  if (raw === undefined) throw new InvalidBlockGraphError(`Missing block "${id}".`)
  return raw
}

const convertBlock = <TContext>(state: DeserializeState<TContext>, id: string): Block => {
  const cached = state.blockCache.get(id)
  if (cached !== undefined) return cached
  const entry = rawBlockFor(state as DeserializeState<unknown>, id)
  if (isPrimitive(entry)) {
    const block = blockFromPrimitive(entry, id, state.registry as BlockSpecRegistry<unknown>)
    state.blockCache.set(id, block)
    return block
  }
  if (!isSb3Block(entry)) throw new InvalidSb3BlocksError(`Block "${id}" is not a valid SB3 block.`)
  const spec = state.registry.require(entry.opcode)
  const mutation = semanticMutation(entry)
  const block: Block = {
    kind: "block", opcode: entry.opcode, inputs: {}, fields: {},
    ...(entry.shadow ? {shadow: true as const} : {}),
    ...(mutation === undefined ? {} : {mutation}),
    metadata: {scratch: {id}},
  }
  const metadata: Sb3BlockMetadata = {
    version: 1,
    ...(entry.comment === undefined ? {} : {comment: entry.comment}),
    ...(mutation === undefined && entry.mutation !== undefined ? {mutation: cloneJson(entry.mutation)} : {}),
  }
  if (Object.keys(metadata).length > 1) setSb3Metadata(block, metadata)
  state.blockCache.set(id, block)
  for (const [name, rawField] of Object.entries(entry.fields)) {
    if (!Array.isArray(rawField)) continue
    block.fields[name] = makeField(rawField, spec.fields[name]?.type ?? fieldTypeFallback(name, rawField))
  }
  const mutationInputNames = mutation?.type === "procedure-call" || mutation?.type === "procedure-prototype"
    ? mutation.argumentIds
    : []
  const inputNames = new Set([...Object.keys(spec.inputs), ...Object.keys(entry.inputs), ...mutationInputNames])
  for (const name of inputNames) {
    const rawInput = entry.inputs[name]
    const inputSpec = spec.inputs[name] ?? dynamicInputSpec(entry, name)
    if (inputSpec === undefined) throw new InvalidBlockGraphError(`Block "${entry.opcode}" has undeclared input "${name}".`)
    block.inputs[name] = rawInput === undefined
      ? {kind: "input", type: "empty"}
      : convertInput(state, id, rawInput, inputSpec)
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
      return {kind: "input", type: "block", value: blockFromPrimitive(value, undefined, state.registry as BlockSpecRegistry<unknown>)}
    }
    return literalFromPrimitive(value)
  }
  if (typeof value !== "string") throw new InvalidSb3BlocksError(`Invalid input on block "${parentId}".`)
  const child = rawBlockFor(state as DeserializeState<unknown>, value)
  if (isPrimitive(child)) {
    if (child[0] >= 11) {
      return {kind: "input", type: "block", value: blockFromPrimitive(child, value, state.registry as BlockSpecRegistry<unknown>)}
    }
    return literalFromPrimitive(child)
  }
  if (!isSb3Block(child)) throw new InvalidSb3BlocksError(`Input references invalid block "${value}".`)
  if (scalarOpcodes.has(child.opcode) && child.shadow) {
    state.registry.require(child.opcode)
    return literalFromScalarBlock(child, value)
  }
  const childBlock = convertBlock(state, value)
  const blockDefault = inputSpec.default?.type === "block"
  if (inputSpec.connection === "statement" && !blockDefault) {
    return {kind: "input", type: "script", value: convertScript(state, value)}
  }
  return {kind: "input", type: "block", value: childBlock}
}

const convertInput = <TContext>(
  state: DeserializeState<TContext>, parentId: string, rawInput: Sb3Input, inputSpec: InputSpec,
): Input => {
  const active = rawInput[1] ?? null
  if (rawInput[0] === 3 && active !== null) {
    const input = convertInputValue(state, parentId, active, inputSpec)
    const hidden = rawInput[2] ?? null
    if (hidden !== null) {
      const obscured = convertInputValue(state, parentId, hidden, inputSpec)
      if (obscured.type === "script" || obscured.type === "empty") {
        throw new InvalidBlockGraphError(`Obscured shadow on block "${parentId}" is not a scalar or block shadow.`)
      }
      input.obscuredShadow = obscured
    }
    return input
  }
  return convertInputValue(state, parentId, rawInput[0] === 3 ? rawInput[2] ?? null : active, inputSpec)
}

const convertScript = <TContext>(state: DeserializeState<TContext>, rootId: string): Script => {
  const blocks: Block[] = []
  let id: string | null = rootId
  while (id !== null) {
    const entry = rawBlockFor(state as DeserializeState<unknown>, id)
    blocks.push(convertBlock(state, id))
    id = isSb3Block(entry) && typeof entry.next === "string" ? entry.next : null
  }
  const root = state.blocks[rootId]
  const x = isSb3Block(root) && typeof root.x === "number"
    ? root.x : isPrimitive(root) && typeof root[3] === "number" ? root[3] : undefined
  const y = isSb3Block(root) && typeof root.y === "number"
    ? root.y : isPrimitive(root) && typeof root[4] === "number" ? root[4] : undefined
  return {
    kind: "script", blocks,
    ...(x === undefined && y === undefined ? {} : {metadata: {scratch: {
      ...(x === undefined ? {} : {x}), ...(y === undefined ? {} : {y}),
    }}}),
  }
}

export const deserializeSb3Blocks = <TContext>(
  blocks: Readonly<Sb3Blocks>, registry: BlockSpecRegistry<TContext>,
): Script[] => {
  const source = cloneJson(blocks)
  const roots = validateGraph(source, registry)
  const state: DeserializeState<TContext> = {blocks: source, registry, blockCache: new Map()}
  return roots.map(id => convertScript(state, id))
}

interface SerializeState {
  readonly result: Sb3Blocks
  readonly claimedIds: Map<string, object>
}

const blockId = (block: Block): string | undefined => block.metadata?.scratch?.id
const requireBlockId = (block: Block): string => {
  const id = blockId(block)
  if (id === undefined) throw new MissingBlockIdError(block.opcode)
  return id
}
const claimId = (state: SerializeState, id: string, owner: object): void => {
  const previous = state.claimedIds.get(id)
  if (previous !== undefined && previous !== owner) throw new DuplicateBlockIdError(id)
  state.claimedIds.set(id, owner)
}

const primitiveForLiteral = (
  input: Exclude<Input, BlockInput | {kind: "input"; type: "script"; value: Script} | {kind: "input"; type: "empty"}>,
): Sb3Primitive => {
  switch (input.type) {
    case "number": {
      const code = input.metadata?.scratch?.numericKind === "positive-number" ? 5
        : input.metadata?.scratch?.numericKind === "whole-number" ? 6
          : input.metadata?.scratch?.numericKind === "integer" ? 7
            : input.metadata?.scratch?.numericKind === "angle" ? 8 : 4
      return [code, input.value]
    }
    case "color": return [9, input.value]
    case "string": return [10, input.value]
    case "matrix":
    case "note": throw new MissingBlockIdError(input.type)
  }
}

const primitiveForBlock = (block: Block, topLevel = false, x?: number, y?: number): Sb3Primitive | undefined => {
  const code = opcodePrimitiveCodes[block.opcode]
  if (code === undefined) return undefined
  const fieldName = block.opcode === "event_broadcast_menu" ? "BROADCAST_OPTION"
    : block.opcode === "data_variable" ? "VARIABLE" : block.opcode === "data_listcontents" ? "LIST"
      : block.opcode === "colour_picker" ? "COLOUR" : block.opcode === "text" ? "TEXT" : "NUM"
  const field = block.fields[fieldName]
  if (field === undefined) return undefined
  const primitive: Sb3Primitive = [code as Sb3Primitive[0], field.value]
  if ("id" in field && field.id !== undefined) primitive.push(field.id)
  if (topLevel && (code === 12 || code === 13) && x !== undefined && y !== undefined) primitive.push(x, y)
  return primitive
}

const serializeScalarObject = (state: SerializeState, input: ObscuredShadow, id: string): void => {
  claimId(state, id, input)
  if (state.result[id] !== undefined) return
  if (input.type === "block") throw new InvalidSb3BlocksError(`Block input "${id}" is not a scalar shadow.`)
  const opcode = input.type === "number"
    ? input.metadata?.scratch?.numericKind === "positive-number" ? "math_positive_number"
      : input.metadata?.scratch?.numericKind === "whole-number" ? "math_whole_number"
        : input.metadata?.scratch?.numericKind === "integer" ? "math_integer"
          : input.metadata?.scratch?.numericKind === "angle" ? "math_angle" : "math_number"
    : input.type === "color" ? "colour_picker" : input.type === "matrix" ? "matrix"
      : input.type === "note" ? "note" : "text"
  state.result[id] = {
    opcode, next: null, parent: null, inputs: {}, fields: {[scalarFieldName(opcode)]: [input.value]},
    shadow: true, topLevel: false,
  }
}

const serializeChild = (state: SerializeState, input: Input, parentId: string): Sb3InputValue => {
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
  const scalarId = input.metadata?.scratch?.id
  if (scalarId !== undefined) {
    serializeScalarObject(state, input, scalarId)
    const raw = state.result[scalarId]
    if (isSb3Block(raw)) raw.parent = parentId
    return scalarId
  }
  return primitiveForLiteral(input)
}

const inputUsesShadow = (input: Input): boolean => {
  if (input.type !== "block") return input.type !== "script" && input.type !== "empty"
  return input.value.shadow === true ||
    (blockId(input.value) === undefined && primitiveForBlock(input.value) !== undefined)
}

const serializeInput = (state: SerializeState, input: Input, parentId: string): Sb3Input | undefined => {
  if (input.type === "empty" && input.obscuredShadow === undefined) return undefined
  const value = serializeChild(state, input, parentId)
  if (input.obscuredShadow !== undefined) {
    if (input.obscuredShadow.obscuredShadow !== undefined) {
      throw new InvalidBlockGraphError("An obscured shadow cannot itself have an obscured shadow.")
    }
    return [3, value, serializeChild(state, input.obscuredShadow, parentId)]
  }
  return [inputUsesShadow(input) ? 1 : 2, value]
}

const serializeField = (field: Field): Sb3Field => {
  const result: Sb3Field = [field.value]
  if ("id" in field && field.id !== undefined) result.push(field.id)
  return result
}

const serializeProcedureMutation = (mutation: ProcedurePrototypeMutation | ProcedureCallMutation): JsonObject => {
  const common: JsonObject = {
    tagName: "mutation", children: [], proccode: mutation.proccode,
    argumentids: JSON.stringify(mutation.argumentIds), warp: JSON.stringify(mutation.warp),
  }
  if (mutation.type === "procedure-prototype") {
    common["argumentnames"] = JSON.stringify(mutation.argumentNames)
    common["argumentdefaults"] = JSON.stringify(mutation.argumentDefaults)
  } else if (mutation.returnType !== "statement") common["return"] = mutation.returnType === "reporter" ? "1" : "2"
  return common
}

const serializeSingleBlock = (
  state: SerializeState, block: Block, topLevel: boolean, parent: string | null,
  next: string | null, script?: Script,
): void => {
  const id = requireBlockId(block)
  const previous = state.claimedIds.get(id)
  if (previous !== undefined) {
    if (previous !== block) throw new DuplicateBlockIdError(id)
    return
  }
  claimId(state, id, block)
  const x = script?.metadata?.scratch?.x
  const y = script?.metadata?.scratch?.y
  const primitive = primitiveForBlock(block, topLevel, x, y)
  if (primitive !== undefined && topLevel) {
    state.result[id] = primitive
    return
  }
  const metadata = getSb3BlockMetadata(block)
  const result: Sb3Block = {
    opcode: block.opcode, next, parent, inputs: {},
    fields: Object.fromEntries(Object.entries(block.fields).map(([name, field]) => [name, serializeField(field)])),
    shadow: block.shadow === true, topLevel,
    ...(metadata?.comment === undefined ? {} : {comment: metadata.comment}),
  }
  if (topLevel) {
    if (x !== undefined) result.x = x
    if (y !== undefined) result.y = y
  }
  for (const [name, input] of Object.entries(block.inputs)) {
    const serialized = serializeInput(state, input, id)
    if (serialized !== undefined) result.inputs[name] = serialized
  }
  if (block.mutation !== undefined) result.mutation = serializeProcedureMutation(block.mutation)
  else if (metadata?.mutation !== undefined) result.mutation = cloneJson(metadata.mutation)
  state.result[id] = result
}

const serializeScriptBlocks = (
  state: SerializeState, script: Script, topLevel: boolean, parent: string | null,
): void => {
  for (let index = 0; index < script.blocks.length; index += 1) {
    const block = script.blocks[index]!
    const previous = script.blocks[index - 1]
    const next = script.blocks[index + 1]
    serializeSingleBlock(
      state, block, topLevel && index === 0, index === 0 ? parent : requireBlockId(previous!),
      next === undefined ? null : requireBlockId(next), index === 0 ? script : undefined,
    )
  }
}

export const serializeSb3Blocks = (scripts: readonly Script[]): Sb3Blocks => {
  const state: SerializeState = {result: {}, claimedIds: new Map()}
  for (const script of scripts) serializeScriptBlocks(state, script, true, null)
  return state.result
}
