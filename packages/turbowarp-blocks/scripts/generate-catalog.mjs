import fs from "node:fs"
import path from "node:path"
import {extractSource} from "./extract-source.mjs"
import {createSourceManifest} from "./source-manifest.mjs"

const root = path.resolve(process.argv[2] ?? "")
const output = path.resolve(process.argv[3] ?? "src/generated/catalog-data.ts")
const {records, toolboxDefaults} = extractSource(root)
const contents = `// Generated from the pinned scratch-blocks source. Do not edit by hand.\n` +
  `export const sourceRecords = ${JSON.stringify(records, null, 2)} as const\n\n` +
  `export const toolboxDefaults = ${JSON.stringify(toolboxDefaults, null, 2)} as const\n`
fs.mkdirSync(path.dirname(output), {recursive: true})
fs.writeFileSync(output, contents)
fs.writeFileSync(
  path.join(path.dirname(path.dirname(path.dirname(output))), "source-manifest.json"),
  `${JSON.stringify(createSourceManifest(records), null, 2)}\n`,
)
