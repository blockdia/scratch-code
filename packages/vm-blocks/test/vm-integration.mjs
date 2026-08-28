import assert from "node:assert/strict"
import {execFileSync} from "node:child_process"
import {createRequire} from "node:module"
import {readFileSync} from "node:fs"
import {resolve} from "node:path"

import {createTurboWarpBlockRegistry, TURBOWARP_VM_SOURCE_REVISION} from "@scratch-code/turbowarp-blocks"
import {deserializeVmBlocks, serializeVmBlocks} from "../dist/index.js"

const vmPathArgument = process.argv.slice(2).find(argument => argument !== "--")
if (!vmPathArgument) throw new Error("Usage: test:vm -- /path/to/scratch-vm")
const vmPath = resolve(vmPathArgument)
const revision = execFileSync("git", ["rev-parse", "HEAD"], {cwd: vmPath, encoding: "utf8"}).trim()
assert.equal(revision, TURBOWARP_VM_SOURCE_REVISION, "scratch-vm revision does not match the pinned source")

const vmRequire = createRequire(resolve(vmPath, "package.json"))
const originalWarn = console.warn
console.warn = () => {}
const VirtualMachine = vmRequire("./src/index.js")
const vm = new VirtualMachine()
await vm.loadProject(readFileSync(resolve(vmPath, "test/fixtures/comments.sb3")))

const sourceTarget = vm.runtime.targets.find(target => Object.keys(target.blocks._blocks).length > 0)
assert.ok(sourceTarget, "fixture must contain a target with blocks")
const sourceBlocks = Object.values(sourceTarget.blocks._blocks)
const registry = createTurboWarpBlockRegistry()
const first = deserializeVmBlocks(sourceBlocks, registry)
const serialized = serializeVmBlocks(first)
const second = deserializeVmBlocks(serialized, registry)
assert.deepEqual(second, first, "VM -> AST -> VM -> AST must be stable")

const before = Object.keys(sourceTarget.blocks._blocks).length
await vm.shareBlocksToTarget(serialized, sourceTarget.id)
assert.equal(
  Object.keys(sourceTarget.blocks._blocks).length,
  before + serialized.length,
  "shareBlocksToTarget must accept every serialized runtime block",
)
assert.deepEqual(serializeVmBlocks(first), serialized, "shareBlocksToTarget must not mutate the caller's array")

vm.quit()
console.warn = originalWarn
console.log(JSON.stringify({revision, sourceBlocks: sourceBlocks.length, sharedBlocks: serialized.length}))
