import type {JsonObject} from "@scratch-code/ast"
import type {LanguageData} from "scratchblocks-plus/syntax"

export type ScratchblocksCoercion = "loose" | "strict"

export interface ProcedureArgumentIdContext {
  readonly procedureCode: string
  readonly procedurePath: string
  readonly argumentIndex: number
  readonly argumentName: string
  readonly argumentType: "number" | "string" | "boolean"
}

export interface DeserializeScratchblocksOptions {
  readonly coercion?: ScratchblocksCoercion
  readonly createProcedureArgumentId?: (
    context: ProcedureArgumentIdContext,
  ) => string
}

export interface SerializeScratchblocksOptions {
  readonly coercion?: ScratchblocksCoercion
  readonly language?: LanguageData
}

/** Lightweight scratchblocks-only details stored in AST metadata. */
export interface ScratchblocksMetadata extends JsonObject {
  comment?: string
  diff?: "+" | "-"
  glow?: boolean
}
