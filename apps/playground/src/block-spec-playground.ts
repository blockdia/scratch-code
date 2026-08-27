import {createBlockSpecRegistry} from "@scratch-code/block-spec"
import type {BlockSpec} from "@scratch-code/block-spec"
import "./package.css"

const example: BlockSpec = {opcode: "example_say", shape: "command", fields: {}, inputs: {MESSAGE: {connection: "value", accepts: ["string", "number"], default: {kind: "input", type: "string", value: "Hello!"}}}}
const source = document.querySelector<HTMLTextAreaElement>("#source")!
const output = document.querySelector<HTMLElement>("#output")!
const error = document.querySelector<HTMLElement>("#error")!
const reset = (): void => { source.value = JSON.stringify(example, null, 2) }
const register = (): void => {
  try {
    const spec = JSON.parse(source.value) as BlockSpec
    const registry = createBlockSpecRegistry().register(spec)
    output.textContent = JSON.stringify({size: registry.size, opcodes: [...registry.opcodes()], spec: registry.require(spec.opcode)}, null, 2)
    error.textContent = ""
  } catch (caught) { error.textContent = caught instanceof Error ? caught.message : String(caught) }
}
document.querySelector("#register")!.addEventListener("click", register)
document.querySelector("#reset")!.addEventListener("click", () => { reset(); register() })
reset(); register()
