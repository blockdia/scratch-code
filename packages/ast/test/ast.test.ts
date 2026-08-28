import {describe, expect, it} from "vitest"

import {
  assertJsonValue,
  getChildren,
  isBlock,
  isField,
  isInput,
  isScript,
  isJsonValue,
  transformScripts,
  walk,
  type Block,
  type ProcedureCallMutation,
  type ProcedurePrototypeMutation,
  type Script,
  type TransformContext,
  type WalkContext,
} from "../src/index.js"

const createScratchScript = (): Script => ({
  kind: "script",
  metadata: {
    scratch: {
      x: 120,
      y: 48,
    },
    sb3: {version: 1},
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

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value
  }
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

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

  it("preserves scalar source IDs and JSON-valued historical fields", () => {
    const block: Block = {
      kind: "block",
      opcode: "legacy",
      inputs: {
        VALUE: {
          kind: "input",
          type: "string",
          value: "hello",
          metadata: {scratch: {id: "shadow-id"}},
        },
      },
      fields: {
        PROPERTY: {
          kind: "field",
          type: "dropdown",
          value: ["letter:of:", ["readVariable", "i"]],
        },
      },
    }

    expect(JSON.parse(JSON.stringify(block))).toEqual(block)
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

describe("input-local obscured shadows", () => {
  it("walks the active value and its fallback shadow", () => {
    const input = createScratchScript().blocks[1]!.inputs["TIMES"]!
    input.obscuredShadow = {kind: "input", type: "number", value: "10"}
    expect(getChildren(input)).toEqual([input.obscuredShadow])
    const visited: string[] = []
    walk(input, {enter: node => visited.push(node.kind === "input" ? node.type : node.kind)})
    expect(visited).toEqual(["number", "number"])
  })
})

describe("immutable transforms", () => {
  it("replaces nested nodes bottom-up without modifying the input", () => {
    const script: Script = {
      kind: "script",
      metadata: {test: {owner: "source"}},
      blocks: [{
        kind: "block",
        opcode: "test_parent",
        fields: {
          LABEL: {kind: "field", type: "text", value: "before"},
        },
        inputs: {
          CHILD: {
            kind: "input",
            type: "block",
            value: {
              kind: "block",
              opcode: "test_child",
              fields: {},
              inputs: {},
            },
            obscuredShadow: {
              kind: "input",
              type: "number",
              value: "10",
            },
          },
          SUBSTACK: {
            kind: "input",
            type: "script",
            value: {
              kind: "script",
              blocks: [{
                kind: "block",
                opcode: "test_nested",
                fields: {},
                inputs: {
                  VALUE: {kind: "input", type: "empty"},
                },
              }],
            },
          },
        },
      }],
    }
    const snapshot = JSON.parse(JSON.stringify(script)) as Script
    deepFreeze(script)
    let parentSawTransformedChildren = false

    const scripts = [script]
    const result = transformScripts(scripts, {
      leave(node) {
        if (node.kind === "field") return {...node, value: "after"}
        if (node.kind === "input" && node.type === "number") {
          return {...node, value: "20"}
        }
        if (node.kind === "input" && node.type === "empty") {
          return {kind: "input", type: "string", value: "filled"}
        }
        if (node.kind === "block") {
          if (node.opcode === "test_parent") {
            parentSawTransformedChildren =
              node.fields["LABEL"]?.value === "after" &&
              node.inputs["CHILD"]?.obscuredShadow?.value === "20"
          }
          return {...node, opcode: `${node.opcode}_changed`}
        }
        if (node.kind === "script") {
          return {...node, metadata: {...node.metadata, transformed: true}}
        }
        return undefined
      },
    })

    expect(script).toEqual(snapshot)
    expect(result).not.toBe(scripts)
    expect(result[0]).not.toBe(script)
    expect(parentSawTransformedChildren).toBe(true)
    expect(result[0]).toMatchObject({
      metadata: {test: {owner: "source"}, transformed: true},
      blocks: [{
        opcode: "test_parent_changed",
        fields: {LABEL: {value: "after"}},
        inputs: {
          CHILD: {
            value: {opcode: "test_child_changed"},
            obscuredShadow: {type: "number", value: "20"},
          },
          SUBSTACK: {
            value: {
              metadata: {transformed: true},
              blocks: [{
                opcode: "test_nested_changed",
                inputs: {VALUE: {type: "string", value: "filled"}},
              }],
            },
          },
        },
      }],
    })
  })

  it("uses walk-compatible context for blocks, nested values, and shadows", () => {
    const script = createScratchScript()
    const times = script.blocks[1]!.inputs["TIMES"]!
    times.obscuredShadow = {kind: "input", type: "number", value: "10"}
    const contexts: Array<{
      label: string
      parent: string | null
      key: string | null
      index?: number
      depth: number
    }> = []
    const record = (label: string, context: TransformContext): void => {
      contexts.push({
        label,
        parent: context.parent?.kind ?? null,
        key: context.key,
        ...(context.index === undefined ? {} : {index: context.index}),
        depth: context.depth,
      })
    }

    transformScripts([script], {
      leave(node, context) {
        if (node === times.obscuredShadow) record("shadow", context)
        if (node.kind === "block" && node.opcode === "looks_say") {
          record("nested-block", context)
        }
        if (node.kind === "script" && context.parent === null) {
          record("root", context)
        }
      },
    })

    expect(contexts).toEqual([
      {label: "shadow", parent: "input", key: "obscuredShadow", depth: 3},
      {label: "nested-block", parent: "script", key: "blocks", index: 0, depth: 4},
      {label: "root", parent: null, key: null, depth: 0},
    ])
  })

  it("shares unchanged subtrees and clones only changed ancestors", () => {
    const first: Script = {
      kind: "script",
      metadata: {test: {stable: true}},
      blocks: [{
        kind: "block",
        opcode: "test_change",
        mutation: {
          type: "procedure-call",
          proccode: "test",
          argumentIds: [],
          warp: false,
          returnType: "statement",
        },
        fields: {
          LABEL: {kind: "field", type: "text", value: "before"},
        },
        inputs: {
          VALUE: {kind: "input", type: "number", value: 1},
        },
      }, {
        kind: "block",
        opcode: "test_unchanged",
        fields: {},
        inputs: {},
      }],
    }
    const second: Script = {kind: "script", blocks: []}
    const scripts = [first, second]
    const result = transformScripts(scripts, {
      leave(node) {
        if (node.kind === "field" && node.value === "before") {
          return {...node, value: "after"}
        }
      },
    })

    expect(result).not.toBe(scripts)
    expect(result[0]).not.toBe(first)
    expect(result[0]!.blocks).not.toBe(first.blocks)
    expect(result[0]!.blocks[0]).not.toBe(first.blocks[0])
    expect(result[0]!.blocks[0]!.fields).not.toBe(first.blocks[0]!.fields)
    expect(result[0]!.blocks[0]!.inputs).toBe(first.blocks[0]!.inputs)
    expect(result[0]!.blocks[0]!.metadata).toBe(first.blocks[0]!.metadata)
    expect(result[0]!.blocks[0]!.mutation).toBe(first.blocks[0]!.mutation)
    expect(result[0]!.blocks[1]).toBe(first.blocks[1])
    expect(result[0]!.metadata).toBe(first.metadata)
    expect(result[1]).toBe(second)

    const unchangedInput = [first]
    const unchanged = transformScripts(unchangedInput, {leave: () => undefined})
    expect(unchanged).not.toBe(unchangedInput)
    expect(unchanged[0]).toBe(first)
  })

  it("rejects replacements that are invalid for their structural position", () => {
    const script = createScratchScript()
    const times = script.blocks[1]!.inputs["TIMES"]!
    times.obscuredShadow = {kind: "input", type: "number", value: "10"}

    expect(() => transformScripts([script], {
      leave(node, context) {
        if (context.key === "obscuredShadow") {
          return {kind: "input", type: "empty"}
        }
        return node
      },
    })).toThrow("An obscuredShadow must remain a scalar or block input")

    expect(() => transformScripts([script], {
      leave(node) {
        if (node.kind === "field") return node
        return {kind: "field", type: "text", value: "wrong"}
      },
    })).toThrow("Cannot replace")
  })
})

describe("JSON guards", () => {
  it("rejects non-finite numbers and undefined array items", () => {
    expect(isJsonValue({ok: [1, true, null]})).toBe(true)
    expect(isJsonValue(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isJsonValue([undefined])).toBe(false)
    expect(() => assertJsonValue({bad: Number.NaN})).toThrow(TypeError)
  })
})
