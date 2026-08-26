import {describe, expect, it} from "vitest"

import {
  getChildren,
  isBlock,
  isField,
  isInput,
  isScript,
  walk,
  type Block,
  type ProcedureCallMutation,
  type ProcedurePrototypeMutation,
  type Script,
  type WalkContext,
} from "../src/index.js"

const createScratchScript = (): Script => ({
  kind: "script",
  metadata: {
    scratch: {
      x: 120,
      y: 48,
      sb3: {source: "project.json"},
    },
    test: {fixture: true},
  },
  blocks: [
    {
      kind: "block",
      opcode: "event_whenflagclicked",
      fields: {},
      inputs: {},
      metadata: {scratch: {id: "hat"}},
    },
    {
      kind: "block",
      opcode: "control_repeat",
      fields: {},
      inputs: {
        TIMES: {
          kind: "input",
          type: "number",
          value: "0010",
          metadata: {scratch: {numericKind: "whole-number"}},
        },
        SUBSTACK: {
          kind: "input",
          type: "script",
          value: {
            kind: "script",
            blocks: [
              {
                kind: "block",
                opcode: "looks_say",
                fields: {},
                inputs: {
                  MESSAGE: {
                    kind: "input",
                    type: "string",
                    value: "hello",
                  },
                },
              },
            ],
          },
        },
      },
    },
    {
      kind: "block",
      opcode: "motion_goto",
      fields: {},
      inputs: {
        TO: {
          kind: "input",
          type: "block",
          value: {
            kind: "block",
            opcode: "motion_goto_menu",
            fields: {
              TO: {
                kind: "field",
                type: "dropdown",
                value: "_random_",
              },
            },
            inputs: {},
          },
        },
      },
    },
  ],
})

describe("Scratch-aligned AST model", () => {
  it("preserves literal values and the menu-shadow boundary", () => {
    const script = createScratchScript()
    const repeat = script.blocks[1]
    const goTo = script.blocks[2]

    expect(repeat?.inputs["TIMES"]).toMatchObject({
      type: "number",
      value: "0010",
      metadata: {scratch: {numericKind: "whole-number"}},
    })
    expect(goTo?.inputs["TO"]).toMatchObject({
      type: "block",
      value: {
        opcode: "motion_goto_menu",
        fields: {TO: {type: "dropdown", value: "_random_"}},
      },
    })
  })

  it("represents scalar Scratch shadows without normalization", () => {
    const block: Block = {
      kind: "block",
      opcode: "test_literals",
      fields: {},
      inputs: {
        STRING: {kind: "input", type: "string", value: ""},
        SCIENTIFIC: {kind: "input", type: "number", value: "1e2"},
        NON_FINITE: {kind: "input", type: "number", value: "Infinity"},
        COLOR: {kind: "input", type: "color", value: "#00ff7f"},
        MATRIX: {
          kind: "input",
          type: "matrix",
          value: "0101010101100010101000100",
        },
        NOTE: {kind: "input", type: "note", value: "60"},
        BOOLEAN: {kind: "input", type: "empty"},
      },
    }

    const copy = JSON.parse(JSON.stringify(block)) as Block
    expect(copy).toEqual(block)
  })

  it("keeps variable, list, and broadcast identity on fields", () => {
    const fields: Block["fields"] = {
      VARIABLE: {
        kind: "field",
        type: "variable",
        value: "score",
        id: "variable-id",
      },
      LIST: {
        kind: "field",
        type: "list",
        value: "items",
        id: "list-id",
      },
      BROADCAST_OPTION: {
        kind: "field",
        type: "broadcast",
        value: "message1",
        id: "broadcast-id",
      },
    }

    expect(fields["VARIABLE"]).toMatchObject({value: "score", id: "variable-id"})
    expect(fields["LIST"]).toMatchObject({value: "items", id: "list-id"})
    expect(fields["BROADCAST_OPTION"]).toMatchObject({
      value: "message1",
      id: "broadcast-id",
    })
  })
})

describe("procedure semantic mutations", () => {
  it("distinguishes prototype and call data", () => {
    const prototype: ProcedurePrototypeMutation = {
      type: "procedure-prototype",
      proccode: "mix %s %b",
      argumentIds: ["text", "condition"],
      argumentNames: ["text", "condition"],
      argumentDefaults: ["", false],
      warp: true,
    }
    const call: ProcedureCallMutation = {
      type: "procedure-call",
      proccode: "mix %s %b",
      argumentIds: ["text", "condition"],
      warp: true,
      returnType: "reporter",
    }

    const definition: Block = {
      kind: "block",
      opcode: "procedures_definition",
      fields: {},
      inputs: {
        custom_block: {
          kind: "input",
          type: "block",
          value: {
            kind: "block",
            opcode: "procedures_prototype",
            fields: {},
            inputs: {},
            mutation: prototype,
          },
        },
      },
    }
    const callBlock: Block = {
      kind: "block",
      opcode: "procedures_call",
      fields: {},
      inputs: {
        text: {kind: "input", type: "string", value: "hello"},
        condition: {kind: "input", type: "empty"},
      },
      mutation: call,
    }

    expect(definition.inputs["custom_block"]).toMatchObject({
      type: "block",
      value: {mutation: {type: "procedure-prototype"}},
    })
    expect(callBlock.mutation).toEqual(call)
  })
})

describe("traversal", () => {
  it("walks fields before inputs with stable context", () => {
    const script = createScratchScript()
    const events: Array<{
      phase: "enter" | "leave"
      node: string
      parent: string | null
      key: string | null
      index?: number
      depth: number
    }> = []

    const record = (
      phase: "enter" | "leave",
      node: Parameters<Parameters<typeof walk>[1]["enter"]>[0],
      context: WalkContext,
    ): void => {
      const label = node.kind === "block" ? node.opcode : `${node.kind}:${"type" in node ? node.type : ""}`
      const parent =
        context.parent?.kind === "block"
          ? context.parent.opcode
          : (context.parent?.kind ?? null)
      events.push({
        phase,
        node: label,
        parent,
        key: context.key,
        ...(context.index === undefined ? {} : {index: context.index}),
        depth: context.depth,
      })
    }

    walk(script, {
      enter: (node, context) => record("enter", node, context),
      leave: (node, context) => record("leave", node, context),
    })

    expect(events.slice(0, 6)).toEqual([
      {phase: "enter", node: "script:", parent: null, key: null, depth: 0},
      {
        phase: "enter",
        node: "event_whenflagclicked",
        parent: "script",
        key: "blocks",
        index: 0,
        depth: 1,
      },
      {
        phase: "leave",
        node: "event_whenflagclicked",
        parent: "script",
        key: "blocks",
        index: 0,
        depth: 1,
      },
      {
        phase: "enter",
        node: "control_repeat",
        parent: "script",
        key: "blocks",
        index: 1,
        depth: 1,
      },
      {
        phase: "enter",
        node: "input:number",
        parent: "control_repeat",
        key: "TIMES",
        depth: 2,
      },
      {
        phase: "leave",
        node: "input:number",
        parent: "control_repeat",
        key: "TIMES",
        depth: 2,
      },
    ])

    expect(events.some(event => event.key === "metadata")).toBe(false)
    expect(events.some(event => event.key === "mutation")).toBe(false)
  })

  it("returns direct children and exposes useful type guards", () => {
    const script = createScratchScript()
    const repeat = script.blocks[1]
    expect(repeat).toBeDefined()
    if (!repeat) return

    expect(getChildren(script)).toEqual(script.blocks)
    expect(getChildren(repeat).map(node => node.kind)).toEqual(["input", "input"])
    expect(isScript(script)).toBe(true)
    expect(isBlock(repeat)).toBe(true)
    expect(isInput(repeat.inputs["TIMES"])).toBe(true)
    expect(isField({kind: "field", type: "text", value: "value"})).toBe(true)
    expect(isBlock(null)).toBe(false)
  })
})
