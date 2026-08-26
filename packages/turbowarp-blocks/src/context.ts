import type {ProcedureReturnType} from "@scratch-code/ast"

export type TurboWarpProcedureArgumentType = "number" | "string" | "boolean"

export interface ControlStopResolveContext {
  readonly kind: "control-stop"
  readonly hasNext: boolean
}

export interface ProcedureCallArgumentContext {
  readonly id: string
  readonly type: TurboWarpProcedureArgumentType
}

export interface ProcedureCallResolveContext {
  readonly kind: "procedure-call"
  readonly returnType: ProcedureReturnType
  readonly arguments: readonly ProcedureCallArgumentContext[]
}

export interface ProcedurePrototypeArgumentContext {
  readonly id: string
  readonly name: string
  readonly type: TurboWarpProcedureArgumentType
}

export interface ProcedurePrototypeResolveContext {
  readonly kind: "procedure-prototype"
  readonly arguments: readonly ProcedurePrototypeArgumentContext[]
}

export type TurboWarpBlockResolveContext =
  | ControlStopResolveContext
  | ProcedureCallResolveContext
  | ProcedurePrototypeResolveContext
  | undefined
