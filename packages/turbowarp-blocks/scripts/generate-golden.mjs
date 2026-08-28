import fs from "node:fs"
import path from "node:path"
import {turboWarpBlockSpecs} from "../dist/index.js"

const normalized = turboWarpBlockSpecs.map(spec => ({
  opcode: spec.opcode,
  shape: spec.shape,
  ...(spec.hatStyle === undefined ? {} : {hatStyle: spec.hatStyle}),
  ...(spec.outputType === undefined ? {} : {outputType: spec.outputType}),
  arguments: spec.arguments,
  inputs: spec.inputs,
  fields: spec.fields,
  bindings: spec.bindings,
  source: spec.source,
}))
const output = path.resolve(process.argv[2] ?? "test/fixtures/specs.golden.json")
fs.mkdirSync(path.dirname(output), {recursive: true})
fs.writeFileSync(output, `${JSON.stringify(normalized, null, 2)}\n`)
