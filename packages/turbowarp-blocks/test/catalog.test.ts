import {describe, expect, it} from "vitest"

import sourceManifest from "../source-manifest.json" with {type: "json"}
import specsGolden from "./fixtures/specs.golden.json" with {type: "json"}

import {
  TURBOWARP_BLOCKS_SOURCE_REVISION,
  controlBlockSpecs,
  createTurboWarpBlockRegistry,
  dataBlockSpecs,
  eventBlockSpecs,
  looksBlockSpecs,
  motionBlockSpecs,
  operatorsBlockSpecs,
  procedureBlockSpecs,
  sensingBlockSpecs,
  shadowBlockSpecs,
  soundBlockSpecs,
  turboWarpBlockSpecs,
} from "../src/index.js"

describe("TurboWarp catalog", () => {
  it("contains exactly the 169 audited serializable definitions", () => {
    const categories = [
      motionBlockSpecs, looksBlockSpecs, soundBlockSpecs, eventBlockSpecs,
      controlBlockSpecs, sensingBlockSpecs, operatorsBlockSpecs, dataBlockSpecs,
      procedureBlockSpecs, shadowBlockSpecs,
    ]
    const flattened = categories.flat()
    expect(flattened).toEqual(turboWarpBlockSpecs)
    expect(flattened).toHaveLength(169)
    expect(new Set(flattened.map(spec => spec.opcode))).toHaveLength(169)
    expect(flattened.map(spec => spec.opcode).sort()).toEqual(sourceManifest.map(record => record.opcode).sort())
  })

  it("matches the committed semantic golden fixture", () => {
    const normalized = turboWarpBlockSpecs.map(spec => ({
      opcode: spec.opcode,
      shape: spec.shape,
      ...(spec.hatStyle === undefined ? {} : {hatStyle: spec.hatStyle}),
      ...(spec.outputType === undefined ? {} : {outputType: spec.outputType}),
      inputs: spec.inputs,
      fields: spec.fields,
    }))
    expect(normalized).toEqual(specsGolden)
  })

  it("keeps all definitions JSON-safe and all block defaults resolvable", () => {
    expect(JSON.parse(JSON.stringify(turboWarpBlockSpecs))).toEqual(turboWarpBlockSpecs)
    const opcodes = new Set(turboWarpBlockSpecs.map(spec => spec.opcode))
    for (const spec of turboWarpBlockSpecs) {
      for (const input of Object.values(spec.inputs)) {
        if (input.default?.type === "block") expect(opcodes.has(input.default.value.opcode)).toBe(true)
      }
    }
  })

  it("preserves canonical defaults and source revision", () => {
    expect(TURBOWARP_BLOCKS_SOURCE_REVISION).toBe("7c58de666658df1bb447d010132aa3914c10f41e")
    const registry = createTurboWarpBlockRegistry()
    expect(registry.require("motion_movesteps").inputs["STEPS"]?.default).toEqual({
      kind: "input",
      type: "number",
      value: "10",
      metadata: {scratch: {numericKind: "number"}},
    })
    const definition = registry.require("procedures_definition")
    expect(definition).toMatchObject({shape: "hat", hatStyle: "define"})
    expect(definition.inputs["custom_block"]?.default).toMatchObject({
      type: "block",
      value: {opcode: "procedures_prototype"},
    })
  })

  it("creates complete isolated registries", () => {
    const first = createTurboWarpBlockRegistry()
    const second = createTurboWarpBlockRegistry()
    expect(first.size).toBe(169)
    first.unregister("motion_movesteps")
    expect(first.size).toBe(168)
    expect(second.has("motion_movesteps")).toBe(true)
    expect(second.resolveRequired("motion_movesteps", undefined)).toBe(second.require("motion_movesteps"))
  })
})
