import assert from "node:assert/strict"
import {execFileSync} from "node:child_process"
import {createRequire} from "node:module"
import {readFileSync, readdirSync} from "node:fs"
import {basename, resolve} from "node:path"

import {createTurboWarpBlockRegistry, TURBOWARP_VM_SOURCE_REVISION} from "@scratch-code/turbowarp-blocks"
import {deserializeVmBlocks, InvalidVmBlocksError, serializeVmBlocks} from "../dist/index.js"

const arguments_ = process.argv.slice(2).filter(argument => argument !== "--")
if (arguments_.length < 2) {
  throw new Error("Usage: test:corpus -- /path/to/scratch-vm /path/to/sb3-projects")
}
const vmPath = resolve(arguments_[0])
const directory = resolve(arguments_[1])
const revision = execFileSync("git", ["rev-parse", "HEAD"], {cwd: vmPath, encoding: "utf8"}).trim()
assert.equal(revision, TURBOWARP_VM_SOURCE_REVISION, "scratch-vm revision does not match the pinned source")

const vmRequire = createRequire(resolve(vmPath, "package.json"))
const originalWarn = console.warn
console.warn = () => {}
const VirtualMachine = vmRequire("./src/index.js")
const registry = createTurboWarpBlockRegistry()
let checkedProjects = 0
let checkedTargets = 0
let checkedBlocks = 0
let skippedProjects = 0
let rejectedTargets = 0

for (const filename of readdirSync(directory).filter(name => name.endsWith(".sb3")).sort()) {
  const path = resolve(directory, filename)
  const project = JSON.parse(execFileSync("unzip", ["-p", path, "project.json"], {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  }))
  const missing = new Set()
  for (const target of project.targets ?? []) {
    for (const block of Object.values(target.blocks ?? {})) {
      if (!Array.isArray(block) && typeof block?.opcode === "string" && !registry.has(block.opcode)) {
        missing.add(block.opcode)
      }
    }
  }
  if (missing.size > 0) {
    skippedProjects += 1
    console.log(`SKIP ${basename(path)}: ${[...missing].sort().join(", ")}`)
    continue
  }

  const vm = new VirtualMachine()
  await vm.loadProject(readFileSync(path))
  for (const target of vm.runtime.targets) {
    const source = Object.values(target.blocks._blocks)
    try {
      const first = deserializeVmBlocks(source, registry)
      const canonical = serializeVmBlocks(first)
      const second = deserializeVmBlocks(canonical, registry)
      assert.deepEqual(second, first, `${filename} / ${target.getName()}: semantic AST changed`)
      assert.deepEqual(serializeVmBlocks(second), canonical, `${filename} / ${target.getName()}: canonical VM blocks changed`)
      checkedTargets += 1
      checkedBlocks += source.length
    } catch (error) {
      if (!(error instanceof InvalidVmBlocksError)) throw error
      rejectedTargets += 1
      console.log(`REJECT ${basename(path)} / ${target.getName()}: ${error.message}`)
    }
  }
  vm.quit()
  checkedProjects += 1
}

console.warn = originalWarn
console.log(JSON.stringify({
  revision,
  checkedProjects,
  checkedTargets,
  checkedBlocks,
  skippedProjects,
  rejectedTargets,
}))
// Some projects load extension workers which outlive VirtualMachine.quit(). The audit is
// complete once every VM instance has been quit and the summary has been written.
process.exit(0)
