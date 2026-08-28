import type {Block} from "@scratch-code/ast"

import type {
  ProcedureCallArgumentContext,
  ProcedurePrototypeArgumentContext,
  TurboWarpBlockResolveContext,
  TurboWarpProcedureArgumentType,
} from "./context.js"
import {InvalidTurboWarpBlockContextError} from "./errors.js"

const procedureArgumentTypes = (proccode: string): TurboWarpProcedureArgumentType[] =>
  [...proccode.matchAll(/%([nsb])/g)].map(match =>
    match[1] === "n" ? "number" : match[1] === "b" ? "boolean" : "string")

const invalidMutation = (block: Readonly<Block>, kind: "procedure-call" | "procedure-prototype"): never => {
  throw new InvalidTurboWarpBlockContextError(block.opcode, `${kind} mutation matching proccode`)
}

/** Build the minimal TurboWarp registry context represented by an AST block. */
export const getTurboWarpBlockResolveContext = (
  block: Readonly<Block>,
  hasNext: boolean,
): TurboWarpBlockResolveContext => {
  if (block.opcode === "control_stop") return {kind: "control-stop", hasNext}

  if (block.opcode === "procedures_call") {
    const mutation = block.mutation
    if (mutation?.type !== "procedure-call") return invalidMutation(block, "procedure-call")
    const types = procedureArgumentTypes(mutation.proccode)
    if (types.length !== mutation.argumentIds.length) return invalidMutation(block, "procedure-call")
    const arguments_: ProcedureCallArgumentContext[] = mutation.argumentIds.map((id, index) => ({
      id,
      type: types[index]!,
    }))
    return {
      kind: "procedure-call",
      returnType: mutation.returnType,
      arguments: arguments_,
    }
  }

  if (block.opcode === "procedures_prototype") {
    const mutation = block.mutation
    if (mutation?.type !== "procedure-prototype") return invalidMutation(block, "procedure-prototype")
    const types = procedureArgumentTypes(mutation.proccode)
    if (types.length !== mutation.argumentIds.length ||
        types.length !== mutation.argumentNames.length ||
        types.length !== mutation.argumentDefaults.length) {
      return invalidMutation(block, "procedure-prototype")
    }
    const arguments_: ProcedurePrototypeArgumentContext[] = mutation.argumentIds.map((id, index) => ({
      id,
      name: mutation.argumentNames[index]!,
      type: types[index]!,
    }))
    return {kind: "procedure-prototype", arguments: arguments_}
  }

  return undefined
}
