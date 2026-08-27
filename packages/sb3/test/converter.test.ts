import {describe, expect, it} from "vitest"

import type {Block, Script} from "@scratch-code/ast"
import {createBlockSpecRegistry, MissingBlockSpecError} from "@scratch-code/block-spec"
import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"

import {
  deserializeBlocks,
  DuplicateBlockIdError,
  MissingBlockIdError,
  serializeBlocks,
  type Sb3Blocks,
} from "../src/index.js"

describe("empty inputs", () => {
  it("materializes omitted inputs and omits EmptyInput when serializing", () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: "operator_and",
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 122,
        y: 340,
      },
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    expect(scripts[0]?.blocks[0]?.inputs).toMatchObject({
      OPERAND1: {type: "empty"},
      OPERAND2: {type: "empty"},
    })
    expect(serializeBlocks(scripts)).toEqual(blocks)
  })

  it("normalizes legacy [1, null] inputs to omitted keys", () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: "operator_not",
        next: null,
        parent: null,
        inputs: {OPERAND: [1, null]},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 1,
        y: 2,
      },
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    expect(scripts[0]?.blocks[0]?.inputs["OPERAND"]).toMatchObject({type: "empty"})
    expect((serializeBlocks(scripts)["a"] as {inputs: object}).inputs).toEqual({})
  })
})

describe("SB3 fidelity", () => {
  it("preserves primitives, obscured shadows, comments, and top-level reporters", () => {
    const blocks: Sb3Blocks = {
      hat: {
        opcode: "event_whenflagclicked",
        next: "move",
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 10,
        y: 20,
      },
      move: {
        opcode: "motion_movesteps",
        next: null,
        parent: "hat",
        inputs: {STEPS: [3, [12, "score", "variable"], [4, "0010"]]},
        fields: {},
        shadow: false,
        topLevel: false,
        comment: "comment-id",
      },
      variableReporter: [12, "score", "variable", 200, 300],
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    expect(scripts).toHaveLength(2)
    expect(scripts[0]?.blocks[1]?.inputs["STEPS"]).toMatchObject({
      type: "block",
      value: {opcode: "data_variable"},
    })
    expect(serializeBlocks(scripts)).toEqual(blocks)
  })

  it("updates modeled literal values while retaining their input encoding", () => {
    const blocks: Sb3Blocks = {
      move: {
        opcode: "motion_movesteps",
        next: null,
        parent: null,
        inputs: {STEPS: [1, [4, "10"]]},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    const input = scripts[0]!.blocks[0]!.inputs["STEPS"]!
    if (input.type === "number") input.value = "25"
    expect((serializeBlocks(scripts)["move"] as {inputs: object}).inputs).toEqual({
      STEPS: [1, [4, "25"]],
    })
  })

  it("round-trips object scalar shadows and disconnected components", () => {
    const blocks: Sb3Blocks = {
      move: {
        opcode: "motion_movesteps",
        next: null,
        parent: null,
        inputs: {STEPS: [1, "number"]},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
      number: {
        opcode: "math_number",
        next: null,
        parent: "move",
        inputs: {},
        fields: {NUM: ["10"]},
        shadow: true,
        topLevel: false,
      },
      orphan: {
        opcode: "looks_hide",
        next: null,
        parent: "move",
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: false,
      },
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    expect(scripts).toHaveLength(2)
    const steps = scripts[0]!.blocks[0]!.inputs["STEPS"]!
    expect(steps).toMatchObject({type: "number", value: "10"})
    if (steps.type === "number") steps.value = "20"
    const serialized = serializeBlocks(scripts)
    expect((serialized["number"] as {fields: object}).fields).toEqual({NUM: ["20"]})
    expect(serialized["orphan"]).toEqual(blocks["orphan"])
  })

  it("keeps a shadow as the semantic value of [3, null, shadow]", () => {
    const blocks: Sb3Blocks = {
      not: {
        opcode: "operator_not",
        next: null,
        parent: null,
        inputs: {OPERAND: [3, null, "equals"]},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
      equals: {
        opcode: "operator_equals",
        next: null,
        parent: "not",
        inputs: {OPERAND1: [1, [10, ""]], OPERAND2: [1, [10, ""]]},
        fields: {},
        shadow: true,
        topLevel: false,
      },
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    expect(scripts[0]?.blocks[0]?.inputs["OPERAND"]).toMatchObject({
      type: "block",
      value: {opcode: "operator_equals"},
    })
    expect(serializeBlocks(scripts)).toEqual(blocks)
  })

  it("normalizes procedure mutations semantically and preserves their raw form", () => {
    const blocks: Sb3Blocks = {
      call: {
        opcode: "procedures_call",
        next: null,
        parent: null,
        inputs: {argument: [1, [10, "value"]]},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 4,
        y: 8,
        mutation: {
          tagName: "mutation",
          children: [],
          proccode: "do %s",
          argumentids: "[\"argument\"]",
        },
      },
    }
    const scripts = deserializeBlocks(blocks, createTurboWarpBlockRegistry())
    expect(scripts[0]?.blocks[0]?.mutation).toEqual({
      type: "procedure-call",
      proccode: "do %s",
      argumentIds: ["argument"],
      warp: false,
      returnType: "statement",
    })
    expect(serializeBlocks(scripts)).toEqual(blocks)
  })
})

describe("errors", () => {
  it("requires every serialized opcode to exist in the registry", () => {
    const blocks: Sb3Blocks = {
      a: {
        opcode: "extension_missing",
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0,
      },
    }
    expect(() => deserializeBlocks(blocks, createBlockSpecRegistry())).toThrow(MissingBlockSpecError)
  })

  it("does not allocate missing IDs", () => {
    const block: Block = {kind: "block", opcode: "motion_movesteps", inputs: {}, fields: {}}
    const script: Script = {kind: "script", blocks: [block]}
    expect(() => serializeBlocks([script])).toThrow(MissingBlockIdError)
  })

  it("rejects distinct blocks with duplicate IDs", () => {
    const makeBlock = (): Block => ({
      kind: "block",
      opcode: "event_whenflagclicked",
      inputs: {},
      fields: {},
      metadata: {scratch: {id: "same"}},
    })
    expect(() => serializeBlocks([
      {kind: "script", blocks: [makeBlock()]},
      {kind: "script", blocks: [makeBlock()]},
    ])).toThrow(DuplicateBlockIdError)
  })
})
