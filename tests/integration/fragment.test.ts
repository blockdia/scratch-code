import {describe, expect, it} from "vitest"

import {analyzeScripts, createScratchFragment} from "@scratch-code/fragment"
import {deserializeSb3Blocks, serializeSb3Blocks} from "@scratch-code/sb3"
import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"

import {semanticFixtures} from "./fixtures/semantic.js"
import {materializeDeterministically} from "./helpers.js"

describe("fragment interoperability", () => {
  it("analyzes semantic procedure mutations produced by the SB3 codec", () => {
    const source = semanticFixtures.find(fixture => fixture.name === "procedure-call")!
      .createAst()
    const complete = materializeDeterministically(source)
    const roundTrip = deserializeSb3Blocks(
      serializeSb3Blocks(complete),
      createTurboWarpBlockRegistry(),
    )

    const analysis = analyzeScripts(roundTrip)
    expect(analysis.procedureDefinitions.map(definition => definition.proccode))
      .toEqual(["mix %n %s %b"])
    expect(analysis.procedureCalls.map(call => call.returnType)).toEqual(["statement"])
    expect(createScratchFragment(roundTrip).dependencies.procedures).toEqual([])
  })

  it("keeps codec-produced extension and resource usage codec-independent", () => {
    const source = [
      ...semanticFixtures.find(fixture => fixture.name === "variable")!.createAst(),
      ...semanticFixtures.find(fixture => fixture.name === "extension-block")!.createAst(),
    ]
    const complete = materializeDeterministically(source)
    const roundTrip = deserializeSb3Blocks(
      serializeSb3Blocks(complete),
      createTurboWarpBlockRegistry(),
    )
    const fragment = createScratchFragment(roundTrip)

    expect(fragment.dependencies.variables).toEqual([{value: "score", id: "variable-id"}])
    expect(fragment.dependencies.extensions).toEqual(["music"])
  })
})
