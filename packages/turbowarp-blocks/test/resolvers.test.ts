import {describe, expect, it} from "vitest"

import {
  InvalidTurboWarpBlockContextError,
  createTurboWarpBlockRegistry,
  type ProcedureCallResolveContext,
  type ProcedurePrototypeResolveContext,
} from "../src/index.js"

describe("TurboWarp dynamic specs", () => {
  it("resolves control_stop without changing its terminal base", () => {
    const registry = createTurboWarpBlockRegistry()
    const base = registry.require("control_stop")
    expect(base.shape).toBe("terminal")
    expect(registry.resolveRequired("control_stop", {kind: "control-stop", hasNext: false})).toBe(base)
    expect(registry.resolveRequired("control_stop", {kind: "control-stop", hasNext: true}).shape).toBe("command")
    expect(registry.require("control_stop")).toBe(base)
  })

  it("resolves every procedure call return type and ordered argument", () => {
    const registry = createTurboWarpBlockRegistry()
    const argumentsInOrder: ProcedureCallResolveContext["arguments"] = [
      {id: "number-id", type: "number"},
      {id: "string-id", type: "string"},
      {id: "boolean-id", type: "boolean"},
    ]
    for (const [returnType, shape] of [["statement", "command"], ["reporter", "reporter"], ["boolean", "boolean"]] as const) {
      const spec = registry.resolveRequired("procedures_call", {kind: "procedure-call", returnType, arguments: argumentsInOrder})
      expect(spec.shape).toBe(shape)
      expect(Object.keys(spec.inputs)).toEqual(["number-id", "string-id", "boolean-id"])
    }
    const reporter = registry.resolveRequired("procedures_call", {
      kind: "procedure-call", returnType: "reporter", arguments: argumentsInOrder,
    })
    expect(reporter).toMatchObject({shape: "reporter", outputType: "any"})
    expect(reporter.inputs["number-id"]?.default).toMatchObject({type: "number", value: 1})
    expect(reporter.inputs["string-id"]?.default).toEqual({kind: "input", type: "string", value: ""})
    expect(reporter.inputs["boolean-id"]?.default).toBeUndefined()
  })

  it("resolves prototype reporters using IDs, names, and types", () => {
    const registry = createTurboWarpBlockRegistry()
    const context: ProcedurePrototypeResolveContext = {
      kind: "procedure-prototype",
      arguments: [
        {id: "a", name: "count", type: "number"},
        {id: "b", name: "label", type: "string"},
        {id: "c", name: "ready?", type: "boolean"},
      ],
    }
    const spec = registry.resolveRequired("procedures_prototype", context)
    expect(Object.keys(spec.inputs)).toEqual(["a", "b", "c"])
    expect(spec.inputs["a"]?.default).toMatchObject({value: {opcode: "argument_reporter_string_number", fields: {VALUE: {value: "count"}}}})
    expect(spec.inputs["b"]?.default).toMatchObject({value: {opcode: "argument_reporter_string_number", fields: {VALUE: {value: "label"}}}})
    expect(spec.inputs["c"]?.default).toMatchObject({value: {opcode: "argument_reporter_boolean", fields: {VALUE: {value: "ready?"}}}})
  })

  it("rejects missing and mismatched contexts and never mutates base specs", () => {
    const registry = createTurboWarpBlockRegistry()
    const callBase = registry.require("procedures_call")
    expect(() => registry.resolveRequired("procedures_call", undefined)).toThrow(InvalidTurboWarpBlockContextError)
    expect(() => registry.resolveRequired("control_stop", {kind: "procedure-call", returnType: "statement", arguments: []})).toThrow(InvalidTurboWarpBlockContextError)
    expect(() => registry.resolveRequired("procedures_call", {kind: "procedure-call"} as never)).toThrow(InvalidTurboWarpBlockContextError)
    expect(() => registry.resolveRequired("procedures_prototype", {kind: "procedure-prototype", arguments: [{id: "a", type: "number"}]} as never)).toThrow(InvalidTurboWarpBlockContextError)
    const first = registry.resolveRequired("procedures_call", {kind: "procedure-call", returnType: "statement", arguments: [{id: "x", type: "number"}]})
    const second = registry.resolveRequired("procedures_call", {kind: "procedure-call", returnType: "boolean", arguments: []})
    expect(first).not.toBe(second)
    expect(registry.require("procedures_call")).toBe(callBase)
    expect(callBase.inputs).toEqual({})
  })
})
