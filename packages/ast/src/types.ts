/** A JSON primitive. Non-finite JavaScript numbers are not JSON-safe. */
export type JsonPrimitive = string | number | boolean | null

/** A JSON object. Optional properties are represented by omitted keys. */
export interface JsonObject {
  [key: string]: JsonValue | undefined
}

/** A value that can be represented in JSON without a custom serializer. */
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

/** Canonical Scratch opcodes remain open so extension blocks are supported. */
export type Opcode = string

export type NodeKind = "script" | "block" | "input" | "field"

/**
 * The editor constraint used by the Scratch numeric shadow that produced a
 * semantic number literal. It is annotation only and does not affect runtime
 * semantics.
 */
export type NumericKind =
  | "number"
  | "integer"
  | "whole-number"
  | "positive-number"
  | "angle"

/** Raw Scratch-specific information shared by all AST node metadata. */
export type ScratchMetadata = {
  sb3?: JsonObject
}

/** Scratch metadata that is meaningful on a workspace-level script. */
export type ScriptScratchMetadata = ScratchMetadata & {
  x?: number
  y?: number
}

/** Scratch metadata that is meaningful on an individual block. */
export type BlockScratchMetadata = ScratchMetadata & {
  id?: string
}

/** Scratch metadata shared by non-numeric input nodes. */
export type InputScratchMetadata = ScratchMetadata

/** Scratch metadata specific to a normalized number literal. */
export type NumberInputScratchMetadata = ScratchMetadata & {
  numericKind?: NumericKind
}

/** Scratch metadata meaningful on field nodes. */
export type FieldScratchMetadata = ScratchMetadata

/**
 * Optional, non-semantic node metadata.
 *
 * Scratch-derived annotations live under `scratch`; consumers should use
 * separate top-level namespaces for their own annotations.
 */
export type Metadata<TScratch extends JsonObject> = {
  scratch?: TScratch
  [namespace: string]: JsonValue | undefined
}

export interface AstNodeBase<
  TKind extends NodeKind,
  TScratch extends JsonObject,
> {
  kind: TKind
  metadata?: Metadata<TScratch>
}

/** A normalized default value in a custom procedure signature. */
export type ProcedureArgumentDefault = string | number | boolean

/** Semantic mutation on a `procedures_prototype` block. */
export interface ProcedurePrototypeMutation {
  type: "procedure-prototype"
  proccode: string
  /** Parallel arrays; all three arrays must have the same length and order. */
  argumentIds: string[]
  argumentNames: string[]
  argumentDefaults: ProcedureArgumentDefault[]
  warp: boolean
}

/** The three call shapes supported by the local Scratch Blocks implementation. */
export type ProcedureReturnType = "statement" | "reporter" | "boolean"

/** Semantic mutation on a `procedures_call` block. */
export interface ProcedureCallMutation {
  type: "procedure-call"
  proccode: string
  /** Ordered argument IDs, which are also the keys used by the call inputs. */
  argumentIds: string[]
  warp: boolean
  returnType: ProcedureReturnType
}

/** Semantic mutations understood by this version of the AST. */
export type SemanticMutation =
  | ProcedurePrototypeMutation
  | ProcedureCallMutation

/** A sequence of blocks connected through Scratch's `next` relationship. */
export interface Script
  extends AstNodeBase<"script", ScriptScratchMetadata> {
  blocks: Block[]
}

/** A semantic Scratch block. Inputs and fields are named by Scratch keys. */
export interface Block extends AstNodeBase<"block", BlockScratchMetadata> {
  opcode: Opcode
  fields: Record<string, Field>
  inputs: Record<string, Input>
  mutation?: SemanticMutation
}

export interface StringInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "string"
  value: string
}

export interface NumberInput
  extends AstNodeBase<"input", NumberInputScratchMetadata> {
  type: "number"
  /**
   * Strings are intentionally accepted to preserve values such as `0010`,
   * `1e2`, and the empty string without normalization.
   */
  value: string | number
}

export interface ColorInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "color"
  value: string
}

export interface MatrixInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "matrix"
  /** Scratch stores a matrix field as its 25-character bit string. */
  value: string
}

export interface NoteInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "note"
  value: string | number
}

export interface BlockInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "block"
  value: Block
}

export interface ScriptInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "script"
  value: Script
}

export interface EmptyInput
  extends AstNodeBase<"input", InputScratchMetadata> {
  type: "empty"
}

/**
 * Current semantic input content. In particular, there is no boolean literal:
 * a boolean slot contains a reporter block or an explicit empty input.
 */
export type Input =
  | StringInput
  | NumberInput
  | ColorInput
  | MatrixInput
  | NoteInput
  | BlockInput
  | ScriptInput
  | EmptyInput

export type FieldType = "text" | "dropdown" | "variable" | "list" | "broadcast"

interface FieldBase<TType extends FieldType>
  extends AstNodeBase<"field", FieldScratchMetadata> {
  type: TType
  value: string
}

export interface TextField extends FieldBase<"text"> {}

export interface DropdownField extends FieldBase<"dropdown"> {}

export interface VariableField extends FieldBase<"variable"> {
  id?: string
}

export interface ListField extends FieldBase<"list"> {
  id?: string
}

export interface BroadcastField extends FieldBase<"broadcast"> {
  id?: string
}

/** A Scratch field. Dropdowns are fields, never input literals. */
export type Field =
  | TextField
  | DropdownField
  | VariableField
  | ListField
  | BroadcastField

/** Every tree node visited by the traversal helpers. */
export type AstNode = Script | Block | Input | Field
