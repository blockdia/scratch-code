import type {Script} from "@scratch-code/ast"
import {deserializeSb3Blocks, serializeSb3Blocks} from "@scratch-code/sb3"
import type {Sb3Blocks} from "@scratch-code/sb3"
import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"
import "./package.css"

const example: Sb3Blocks = {move: {opcode: "motion_movesteps", next: null, parent: null, inputs: {STEPS: [1, [4, "10"]]}, fields: {}, shadow: false, topLevel: true, x: 40, y: 60}}
const registry = createTurboWarpBlockRegistry()
const blocks = document.querySelector<HTMLTextAreaElement>("#blocks")!
const ast = document.querySelector<HTMLTextAreaElement>("#ast")!
const blocksError = document.querySelector<HTMLElement>("#blocks-error")!
const astError = document.querySelector<HTMLElement>("#ast-error")!
const message = (caught: unknown): string => caught instanceof Error ? caught.message : String(caught)
const toAst = (): void => {
  try {
    const scripts = deserializeSb3Blocks(JSON.parse(blocks.value) as Sb3Blocks, registry)
    ast.value = JSON.stringify(scripts, null, 2)
    window.ast = scripts
    blocksError.textContent = ""
  } catch (caught) { blocksError.textContent = message(caught) }
}
const toSb3 = (): void => {
  try {
    const scripts = JSON.parse(ast.value) as Script[]
    blocks.value = JSON.stringify(serializeSb3Blocks(scripts), null, 2)
    window.ast = scripts
    astError.textContent = ""
  } catch (caught) { astError.textContent = message(caught) }
}
const reset = (): void => { blocks.value = JSON.stringify(example, null, 2); toAst() }
document.querySelector("#to-ast")!.addEventListener("click", toAst)
document.querySelector("#to-sb3")!.addEventListener("click", toSb3)
document.querySelector("#reset")!.addEventListener("click", reset)
reset()
