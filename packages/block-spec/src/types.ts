import type {Field, FieldType, Input, Opcode} from "@scratch-code/ast"

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer TValue)[]
    ? readonly DeepReadonly<TValue>[]
    : T extends object
      ? {readonly [TKey in keyof T]: DeepReadonly<T[TKey]>}
      : T

export type BlockArgumentRef =
  | {readonly kind: "field"; readonly name: string}
  | {readonly kind: "input"; readonly name: string}

export interface ScratchblocksBlockBinding {
  /** scratchblocks-plus Block.info.id in its English pivot language. */
  readonly blockId?: string
  readonly hasLoopArrow?: true
}

export interface ScratchblocksFieldOption {
  readonly label: string
  readonly value: string
}

export interface ScratchblocksFieldBinding {
  readonly shape?: "string" | "dropdown" | "color"
  readonly options?: readonly ScratchblocksFieldOption[]
}

export interface BlockSpecBindings {
  readonly scratchblocks?: ScratchblocksBlockBinding
}

export interface FieldSpecBindings {
  readonly scratchblocks?: ScratchblocksFieldBinding
}

export interface ScratchBlocksSource {
  readonly sourceFile: string
  readonly definition: "json" | "custom-init"
}

export interface BlockSpecSource {
  readonly scratchBlocks?: ScratchBlocksSource
}

export type BlockShape =
  | "command"
  | "terminal"
  | "hat"
  | "reporter"
  | "boolean"

export type HatStyle = "standard" | "define"

/** A semantic constraint on values accepted by a value connection. */
export type InputValueType =
  | "string"
  | "number"
  | "boolean"
  | "color"
  | "matrix"
  | "note"
  | "any"

export type InputAccepts = InputValueType | readonly InputValueType[]

/** An AST input template exposed as immutable block-spec data. */
export type DefaultInput = DeepReadonly<Input>

/** An AST field template exposed as immutable block-spec data. */
export type DefaultField = DeepReadonly<Field>

interface InputSpecBase {
  /** The initial shadow or connected content, represented exactly like AST content. */
  readonly default?: DefaultInput
}

export interface ValueInputSpec extends InputSpecBase {
  readonly connection: "value"
  readonly accepts: InputAccepts
}

export interface StatementInputSpec extends InputSpecBase {
  readonly connection: "statement"
  readonly accepts?: never
}

/** A slot declaration. This describes requirements, not the slot's current AST content. */
export type InputSpec = ValueInputSpec | StatementInputSpec

export interface FieldSpec {
  readonly type: FieldType
  /** The initial field, including identity where Scratch requires it. */
  readonly default?: DefaultField
  readonly bindings?: FieldSpecBindings
}

interface BlockSpecBase {
  readonly opcode: Opcode
  readonly inputs: Readonly<Record<string, InputSpec>>
  readonly fields: Readonly<Record<string, FieldSpec>>
  /** Language-independent identity and canonical field/input order. */
  readonly arguments: readonly BlockArgumentRef[]
  readonly bindings?: BlockSpecBindings
  readonly source?: BlockSpecSource
}

export interface CommandBlockSpec extends BlockSpecBase {
  readonly shape: "command"
  readonly hatStyle?: never
  readonly outputType?: never
}

export interface TerminalBlockSpec extends BlockSpecBase {
  readonly shape: "terminal"
  readonly hatStyle?: never
  readonly outputType?: never
}

export interface HatBlockSpec extends BlockSpecBase {
  readonly shape: "hat"
  readonly hatStyle: HatStyle
  readonly outputType?: never
}

export type ReporterOutputType = Exclude<InputValueType, "boolean">

export interface ReporterBlockSpec extends BlockSpecBase {
  readonly shape: "reporter"
  readonly outputType: ReporterOutputType
  readonly hatStyle?: never
}

export interface BooleanBlockSpec extends BlockSpecBase {
  readonly shape: "boolean"
  readonly hatStyle?: never
  readonly outputType?: never
}

export type BlockSpec =
  | CommandBlockSpec
  | TerminalBlockSpec
  | HatBlockSpec
  | ReporterBlockSpec
  | BooleanBlockSpec

/** Resolve a context-dependent final spec from its stable base spec. */
export type BlockSpecResolver<TContext> = (
  baseSpec: BlockSpec,
  context: TContext,
) => BlockSpec
