import type {Field, FieldType, Input, NumericKind} from "@scratch-code/ast"
import type {
  BlockArgumentRef,
  BlockSpec,
  FieldSpec,
  FieldSpecBindings,
  InputAccepts,
  InputSpec,
  ReporterOutputType,
} from "@scratch-code/block-spec"

import {sourceRecords, toolboxDefaults} from "../generated/catalog-data.js"

interface SourceArgument {
  readonly type?: string
  readonly name?: string
  readonly check?: string
  readonly value?: string | number
  readonly text?: string
  readonly colour?: string
  readonly options?: readonly (readonly unknown[])[]
}
interface SourceBlockJson {
  readonly message0?: string
  readonly args0?: readonly SourceArgument[]
  readonly args1?: readonly SourceArgument[]
  readonly args2?: readonly SourceArgument[]
  readonly args3?: readonly SourceArgument[]
  readonly extensions?: readonly string[]
  readonly output?: unknown
}
interface SourceRecord {
  readonly opcode: string
  readonly file: string
  readonly blockJson: SourceBlockJson | null
}
interface ShadowDefault {
  readonly opcode: string
  readonly fields: Readonly<Record<string, string>>
}

const records = sourceRecords as unknown as readonly SourceRecord[]
const defaults = toolboxDefaults as unknown as Readonly<Record<string, Readonly<Record<string, ShadowDefault>>>>
const recordsByOpcode = new Map(records.map(record => [record.opcode, record]))

const sourceArguments = (json: SourceBlockJson | null): readonly SourceArgument[] =>
  json === null ? [] : [json.args0, json.args1, json.args2, json.args3]
    .flatMap(argumentsForMessage => argumentsForMessage ?? [])

const numericKinds: Readonly<Record<string, NumericKind>> = {
  math_number: "number",
  math_integer: "integer",
  math_whole_number: "whole-number",
  math_positive_number: "positive-number",
  math_angle: "angle",
}

const literalDefault = (shadow: ShadowDefault): Input | undefined => {
  const value = Object.values(shadow.fields)[0]
  const numericKind = numericKinds[shadow.opcode]
  if (numericKind !== undefined) {
    return {
      kind: "input",
      type: "number",
      value: value ?? "0",
      metadata: {scratch: {numericKind}},
    }
  }
  if (shadow.opcode === "text") return {kind: "input", type: "string", value: value ?? ""}
  if (shadow.opcode === "colour_picker") return {kind: "input", type: "color", value: value ?? "#7dcc8a"}
  if (shadow.opcode === "matrix") return {kind: "input", type: "matrix", value: value ?? "0000000000000000000000000"}
  if (shadow.opcode === "note") return {kind: "input", type: "note", value: value ?? "60"}
  return undefined
}

const rawFieldType = (argument: SourceArgument): string => argument.type ?? "field_unknown"
const fieldBinding = (argument: SourceArgument): FieldSpecBindings => {
  const type = rawFieldType(argument)
  const shape = type === "field_colour" || type === "field_colour_slider"
    ? "color" as const
    : type === "field_dropdown" || type === "field_numberdropdown" || type.includes("variable")
      ? "dropdown" as const
      : "string" as const
  const options = argument.options?.flatMap(option => {
    const label = option[0]
    const value = option[1]
    return typeof label === "string" && (typeof value === "string" || typeof value === "number")
      ? [{label, value: String(value)}]
      : []
  })
  return {scratchblocks: {shape, ...(options === undefined || options.length === 0 ? {} : {options})}}
}
const semanticFieldType = (opcode: string, argument: SourceArgument): FieldType => {
  if (argument.name === "BROADCAST_OPTION") return "broadcast"
  if (argument.name === "LIST") return "list"
  if (rawFieldType(argument).includes("variable")) return "variable"
  if (rawFieldType(argument) === "field_dropdown" || rawFieldType(argument) === "field_numberdropdown") return "dropdown"
  return "text"
}
const initialFieldValue = (argument: SourceArgument): string => {
  if (argument.value !== undefined) return String(argument.value)
  if (argument.text !== undefined) return argument.text
  if (argument.colour !== undefined) return argument.colour
  const option = argument.options?.[0]?.[1]
  return typeof option === "string" || typeof option === "number" ? String(option) : ""
}
const fieldFromArgument = (opcode: string, argument: SourceArgument, override?: string): Field => ({
  kind: "field",
  type: semanticFieldType(opcode, argument),
  value: override ?? initialFieldValue(argument),
}) as Field
const fieldsFor = (
  record: SourceRecord,
  overrides: Readonly<Record<string, string>> = {},
): Readonly<Record<string, FieldSpec>> => Object.fromEntries(
  sourceArguments(record.blockJson)
    .filter(argument => argument.name !== undefined && argument.type?.startsWith("field_") === true && argument.type !== "field_image")
    .map(argument => [argument.name!, {
      type: semanticFieldType(record.opcode, argument),
      default: fieldFromArgument(record.opcode, argument, overrides[argument.name!]),
      bindings: fieldBinding(argument),
    }]),
)

const blockDefault = (shadow: ShadowDefault): Input => {
  const literal = literalDefault(shadow)
  if (literal !== undefined) return literal
  const record = recordsByOpcode.get(shadow.opcode)
  return {
    kind: "input",
    type: "block",
    value: {
      kind: "block",
      opcode: shadow.opcode,
      inputs: {},
      fields: record === undefined
        ? {}
        : Object.fromEntries(Object.entries(fieldsFor(record, shadow.fields)).map(([name, spec]) => [name, spec.default as Field])),
    },
  }
}

const NUMBER_INPUT_NAMES = new Set([
  "STEPS", "DEGREES", "DIRECTION", "X", "Y", "SECS", "DX", "DY",
  "CHANGE", "VALUE", "SIZE", "STRETCH", "VOLUME", "DURATION", "TIMES",
  "FROM", "TO", "NUM", "NUM1", "NUM2", "LETTER",
])
const STRING_INPUT_NAMES = new Set([
  "MESSAGE", "QUESTION", "STRING1", "STRING2", "STRING", "CONTAINS",
  "BROADCAST_INPUT", "SOUND_MENU", "COSTUME", "BACKDROP", "TOWARDS",
  "CLONE_OPTION", "TOUCHINGOBJECTMENU", "DISTANCETOMENU", "KEY_OPTION", "OBJECT",
])
const acceptsFor = (opcode: string, argument: SourceArgument, shadow?: ShadowDefault): InputAccepts => {
  if (argument.check === "Boolean" || argument.name === "CONDITION") return "boolean"
  if (argument.name?.startsWith("COLOR") === true) return "color"
  if (shadow !== undefined) {
    if (shadow.opcode in numericKinds) return "number"
    if (shadow.opcode === "text") return "string"
    if (shadow.opcode === "colour_picker") return "color"
    if (shadow.opcode === "matrix") return "matrix"
    if (shadow.opcode === "note") return "note"
    return "string"
  }
  if (opcode.startsWith("operator_")) {
    if (["operator_lt", "operator_equals", "operator_gt"].includes(opcode)) return "any"
    if (["operator_and", "operator_or", "operator_not"].includes(opcode)) return "boolean"
    if (["operator_join", "operator_letter_of", "operator_length", "operator_contains"].includes(opcode)) {
      return argument.name === "LETTER" ? "number" : "string"
    }
    return "number"
  }
  if (opcode.startsWith("data_")) return opcode === "data_changevariableby" ? "number" : "any"
  if (opcode === "procedures_return") return "any"
  if (NUMBER_INPUT_NAMES.has(argument.name ?? "")) return "number"
  if (STRING_INPUT_NAMES.has(argument.name ?? "")) return "string"
  return "any"
}

const inputsFor = (record: SourceRecord): Readonly<Record<string, InputSpec>> => Object.fromEntries(
  sourceArguments(record.blockJson)
    .filter(argument => argument.name !== undefined && (argument.type === "input_value" || argument.type === "input_statement"))
    .map(argument => {
      if (argument.type === "input_statement") return [argument.name!, {connection: "statement"}]
      const shadow = defaults[record.opcode]?.[argument.name!]
      const base = {connection: "value" as const, accepts: acceptsFor(record.opcode, argument, shadow)}
      return [argument.name!, shadow === undefined ? base : {...base, default: blockDefault(shadow)}]
    }),
)

const shapeFor = (record: SourceRecord): Pick<BlockSpec, "shape"> & Partial<BlockSpec> => {
  if (record.opcode === "control_stop") return {shape: "terminal"}
  if (record.opcode === "procedures_definition") return {shape: "hat", hatStyle: "define"}
  if (record.opcode === "procedures_call" || record.opcode === "procedures_prototype") return {shape: "command"}
  if (record.opcode === "argument_reporter_string_number") return {shape: "reporter", outputType: "any"}
  const extensions = record.blockJson?.extensions ?? []
  if (extensions.includes("shape_end")) return {shape: "terminal"}
  if (extensions.includes("shape_hat")) return {shape: "hat", hatStyle: "standard"}
  if (extensions.includes("output_boolean")) return {shape: "boolean"}
  let outputType: ReporterOutputType | undefined
  if (extensions.includes("output_number") || record.opcode in numericKinds) outputType = "number"
  else if (extensions.includes("output_string")) outputType = "string"
  else if (record.opcode === "text") outputType = "string"
  else if (record.opcode === "colour_picker") outputType = "color"
  else if (record.opcode === "matrix") outputType = "matrix"
  else if (record.opcode === "note") outputType = "note"
  else if (record.blockJson?.output !== undefined) outputType = "any"
  if (outputType !== undefined) return {shape: "reporter", outputType}
  return {shape: "command"}
}

const containsLoopArrow = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsLoopArrow)
  if (typeof value !== "object" || value === null) return false
  const record = value as Readonly<Record<string, unknown>>
  if (record["type"] === "field_image" && record["src"] === "repeat.svg") return true
  return Object.values(record).some(containsLoopArrow)
}

const argumentsFor = (record: SourceRecord): readonly BlockArgumentRef[] => {
  const arguments_: BlockArgumentRef[] = []
  for (const argument of sourceArguments(record.blockJson)) {
    if (argument.name === undefined || argument.type === "field_image") continue
    if (argument.type?.startsWith("field_") === true) arguments_.push({kind: "field", name: argument.name})
    else if (argument.type === "input_value" || argument.type === "input_statement") {
      arguments_.push({kind: "input", name: argument.name})
    }
  }
  if (record.opcode === "control_stop") return [{kind: "field", name: "STOP_OPTION"}]
  if (record.opcode === "procedures_definition" && !arguments_.some(argument => argument.name === "custom_block")) {
    arguments_.push({kind: "input", name: "custom_block"})
  }
  return arguments_
}

const scratchblocksBlockId = (record: SourceRecord): string | undefined => {
  if (record.opcode === "control_stop") return "CONTROL_STOP"
  const message = record.blockJson?.message0
  return typeof message === "string" && !message.includes("%") ? message : undefined
}

const createSpec = (record: SourceRecord): BlockSpec => {
  const extractedInputs = record.opcode === "control_stop" ? {} : inputsFor(record)
  const inputs = record.opcode === "procedures_definition"
    ? {
        ...extractedInputs,
        custom_block: {
          connection: "statement" as const,
          default: {
            kind: "input" as const,
            type: "block" as const,
            value: {kind: "block" as const, opcode: "procedures_prototype", inputs: {}, fields: {}},
          },
        },
      }
    : extractedInputs
  const fields = record.opcode === "control_stop"
    ? {STOP_OPTION: {type: "dropdown" as const, default: {kind: "field" as const, type: "dropdown" as const, value: "all"}}}
    : fieldsFor(record)
  const blockId = scratchblocksBlockId(record)
  const hasLoopArrow = containsLoopArrow(record.blockJson)
  return {
    opcode: record.opcode,
    inputs,
    fields,
    arguments: argumentsFor(record),
    bindings: {
      scratchblocks: {
        ...(blockId === undefined ? {} : {blockId}),
        ...(hasLoopArrow ? {hasLoopArrow: true as const} : {}),
      },
    },
    source: {
      scratchBlocks: {
        sourceFile: record.file,
        definition: record.blockJson === null ? "custom-init" : "json",
      },
    },
    ...shapeFor(record),
  } as BlockSpec
}

export const specsBySourceFile = new Map<string, readonly BlockSpec[]>(
  [...new Set(records.map(record => record.file))].map(file => [
    file,
    records.filter(record => record.file === file).map(createSpec),
  ]),
)
export const sourceCatalogRecords = records
