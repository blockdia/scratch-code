import {describe, expect, it} from "vitest"

import {materialize} from "@scratch-code/materialize"
import {deserializeSb3Blocks, serializeSb3Blocks} from "@scratch-code/sb3"
import {
  deserializeScratchblocks,
  serializeScratchblocks,
} from "@scratch-code/scratchblocks-codec"
import {
  createTurboWarpBlockRegistry,
  getTurboWarpBlockResolveContext,
} from "@scratch-code/turbowarp-blocks"
import {deserializeVmBlocks, serializeVmBlocks} from "@scratch-code/vm-blocks"
import chineseLocale from "scratchblocks-plus/locales/zh-cn.json" with {type: "json"}
import {allLanguages, loadLanguages, parse} from "scratchblocks-plus/syntax"

import {semanticFixtures} from "./fixtures/semantic.js"
import {wireFixtures} from "./fixtures/wire.js"
import {
  materializeDeterministically,
  semanticProjection,
  surfaceProjection,
} from "./helpers.js"

const registry = () => createTurboWarpBlockRegistry()

describe("same-codec canonical round trips", () => {
  for (const fixture of wireFixtures) {
    it(`${fixture.name}: SB3 -> AST -> SB3 is stable`, () => {
      const firstAst = deserializeSb3Blocks(fixture.sb3, registry())
      const firstCanonical = serializeSb3Blocks(firstAst)
      const secondAst = deserializeSb3Blocks(firstCanonical, registry())
      expect(semanticProjection(secondAst)).toEqual(semanticProjection(firstAst))
      expect(serializeSb3Blocks(secondAst)).toEqual(firstCanonical)
    })

    it(`${fixture.name}: VmBlock[] -> AST -> VmBlock[] is stable`, () => {
      const firstAst = deserializeVmBlocks(fixture.vmBlocks, registry())
      const firstCanonical = serializeVmBlocks(firstAst)
      const secondAst = deserializeVmBlocks(firstCanonical, registry())
      expect(semanticProjection(secondAst)).toEqual(semanticProjection(firstAst))
      expect(serializeVmBlocks(secondAst)).toEqual(firstCanonical)
    })

    it(`${fixture.name}: scratchblocks -> AST -> scratchblocks is stable`, () => {
      const firstAst = deserializeScratchblocks(
        parse(fixture.scratchblocksText, {languages: ["en"]}),
        registry(),
      )
      const firstCanonical = serializeScratchblocks(firstAst, registry()).stringify()
      const secondAst = deserializeScratchblocks(parse(firstCanonical, {languages: ["en"]}), registry())
      expect(surfaceProjection(secondAst)).toEqual(surfaceProjection(firstAst))
      expect(serializeScratchblocks(secondAst, registry()).stringify()).toBe(firstCanonical)
    })
  }
})

describe("cross-codec conversion matrix", () => {
  for (const fixture of wireFixtures) {
    it(`${fixture.name}: SB3 -> materialize -> VM Blocks`, () => {
      const source = deserializeSb3Blocks(fixture.sb3, registry())
      const complete = materializeDeterministically(source)
      const restored = deserializeVmBlocks(serializeVmBlocks(complete), registry())
      expect(semanticProjection(restored)).toEqual(semanticProjection(complete))
    })

    it(`${fixture.name}: VM Blocks -> SB3`, () => {
      const source = deserializeVmBlocks(fixture.vmBlocks, registry())
      const restored = deserializeSb3Blocks(serializeSb3Blocks(source), registry())
      expect(semanticProjection(restored)).toEqual(semanticProjection(source))
    })

    it(`${fixture.name}: scratchblocks -> materialize -> VM Blocks and SB3`, () => {
      const source = deserializeScratchblocks(parse(fixture.scratchblocksText, {languages: ["en"]}), registry())
      const complete = materializeDeterministically(source)
      expect(semanticProjection(deserializeVmBlocks(serializeVmBlocks(complete), registry())))
        .toEqual(semanticProjection(complete))
      expect(semanticProjection(deserializeSb3Blocks(serializeSb3Blocks(complete), registry())))
        .toEqual(semanticProjection(complete))
    })

    it(`${fixture.name}: SB3 and VM Blocks -> scratchblocks`, () => {
      const sb3Ast = deserializeSb3Blocks(fixture.sb3, registry())
      const vmAst = deserializeVmBlocks(fixture.vmBlocks, registry())
      const sb3Surface = deserializeScratchblocks(serializeScratchblocks(sb3Ast, registry()), registry())
      const vmSurface = deserializeScratchblocks(serializeScratchblocks(vmAst, registry()), registry())
      expect(surfaceProjection(sb3Surface)).toEqual(surfaceProjection(sb3Ast))
      expect(surfaceProjection(vmSurface)).toEqual(surfaceProjection(vmAst))
    })
  }
})

describe("shared semantic fixture oracle", () => {
  it("contains all 30 requested coverage categories", () => {
    expect(semanticFixtures).toHaveLength(30)
    expect(new Set(semanticFixtures.flatMap(fixture => fixture.categories))).toEqual(new Set([
      "ordinary command stack", "number literal shadow", "string literal shadow", "color literal",
      "note", "matrix", "nested reporter", "reporter covers primitive shadow", "menu shadow",
      "reporter covers menu shadow", "Empty boolean input", "repeat", "SUBSTACK", "if", "if/else",
      "terminal block", "event hat", "define hat", "variable field", "variable reporter", "list field",
      "list reporter", "broadcast", "custom procedure definition", "custom procedure call",
      "procedure number/string/boolean arguments", "reporter procedure", "boolean reporter procedure",
      "top-level reporter", "disconnected scripts", "extension block", "comment", "scratchblocks diff/glow",
    ]))
  })

  for (const fixture of semanticFixtures) {
    it(`${fixture.name}: common AST is accepted by SB3 and VM Blocks`, () => {
      const complete = materializeDeterministically(fixture.createAst())
      const fromSb3 = deserializeSb3Blocks(serializeSb3Blocks(complete), registry())
      const fromVm = deserializeVmBlocks(serializeVmBlocks(complete), registry())
      expect(semanticProjection(fromSb3)).toEqual(semanticProjection(complete))
      expect(semanticProjection(fromVm)).toEqual(semanticProjection(complete))
    })
  }

  it("uses English as pivot and produces real Chinese output", () => {
    loadLanguages({"zh-cn": chineseLocale})
    const source = deserializeScratchblocks(parse("move (10) steps", {languages: ["en"]}), registry())
    const chinese = allLanguages["zh-cn"]
    expect(chinese).toBeDefined()
    const localized = serializeScratchblocks(source, registry(), {language: chinese!})
    expect(localized.stringify()).toContain("移动")
    expect(deserializeScratchblocks(localized, registry()).map(script => script.blocks[0]?.opcode))
      .toEqual(["motion_movesteps"])
  })

  it("keeps materialize dynamic context callback on resolved base/final opcode", () => {
    const source = semanticFixtures.find(fixture => fixture.name === "procedure-call")!.createAst()
    const seen: string[] = []
    let next = 1
    materialize(source, registry(), {
      contextForBlock: (block, {hasNext}) => {
        seen.push(block.opcode)
        return getTurboWarpBlockResolveContext(block, hasNext)
      },
      generateBlockId: () => `dynamic-${next++}`,
    })
    expect(seen).toContain("procedures_call")
    expect(seen).toContain("procedures_prototype")
  })
})
