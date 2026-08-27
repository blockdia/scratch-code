import {execFileSync} from "node:child_process"
import {readdirSync} from "node:fs"
import {basename, resolve} from "node:path"

import {createTurboWarpBlockRegistry} from "@scratch-code/turbowarp-blocks"
import {deserializeBlocks, serializeBlocks} from "@scratch-code/sb3"

const directory = process.argv.slice(2).find(argument => argument !== "--")
if (!directory) throw new Error("Usage: test:corpus -- /path/to/sb3-projects")

const registry = createTurboWarpBlockRegistry()
const primitiveOpcodes = {12: "data_variable", 13: "data_listcontents"}
let checkedProjects = 0
let checkedTargets = 0
let checkedBlocks = 0
let skippedProjects = 0

const normalizeEmptyInputs = blocks => {
  const copy = structuredClone(blocks)
  for (const block of Object.values(copy)) {
    if (Array.isArray(block)) continue
    for (const [name, input] of Object.entries(block.inputs)) {
      if (input.length === 2 && input[0] === 1 && input[1] === null) delete block.inputs[name]
    }
  }
  return copy
}

const firstDifference = (actual, expected, path = "blocks") => {
  if (Object.is(actual, expected)) return null
  if (typeof actual !== "object" || actual === null || typeof expected !== "object" || expected === null) {
    return `${path}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) return `${path}: container type differs`
  const actualKeys = Object.keys(actual)
  const expectedKeys = Object.keys(expected)
  for (const key of new Set([...actualKeys, ...expectedKeys])) {
    if (!(key in actual)) return `${path}.${key}: missing from actual`
    if (!(key in expected)) return `${path}.${key}: unexpected in actual`
    const difference = firstDifference(actual[key], expected[key], `${path}.${key}`)
    if (difference) return difference
  }
  return null
}

for (const filename of readdirSync(directory).filter(name => name.endsWith(".sb3")).sort()) {
  const path = resolve(directory, filename)
  const project = JSON.parse(execFileSync("unzip", ["-p", path, "project.json"], {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  }))
  const missing = new Set()
  for (const target of project.targets) {
    for (const block of Object.values(target.blocks)) {
      const opcode = Array.isArray(block) ? primitiveOpcodes[block[0]] : block.opcode
      if (opcode && !registry.has(opcode)) missing.add(opcode)
    }
  }
  if (missing.size > 0) {
    skippedProjects += 1
    console.log(`SKIP ${basename(path)}: ${[...missing].sort().join(", ")}`)
    continue
  }
  for (const target of project.targets) {
    const expected = normalizeEmptyInputs(target.blocks)
    const actual = serializeBlocks(deserializeBlocks(target.blocks, registry))
    const difference = firstDifference(actual, expected)
    if (difference) throw new Error(`${filename} / ${target.name}: ${difference}`)
    checkedTargets += 1
    checkedBlocks += Object.keys(target.blocks).length
  }
  checkedProjects += 1
}

console.log(JSON.stringify({checkedProjects, checkedTargets, checkedBlocks, skippedProjects}))
