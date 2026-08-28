import assert from "node:assert/strict"
import {execFileSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import {fileURLToPath} from "node:url"

import {TURBOWARP_VM_SOURCE_REVISION} from "../dist/constants.js"
import {extractScratchVm} from "./extract-scratch-vm.mjs"

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const scratchVmRoot = process.argv.slice(2).find(argument => argument !== "--")
if (scratchVmRoot === undefined) {
  throw new Error("Usage: pnpm audit:scratch-vm -- /path/to/scratch-vm")
}

const root = path.resolve(scratchVmRoot)
const revision = execFileSync("git", ["rev-parse", "HEAD"], {cwd: root, encoding: "utf8"}).trim()
assert.equal(revision, TURBOWARP_VM_SOURCE_REVISION, "scratch-vm revision does not match the pinned source")

const actual = extractScratchVm(root)
const expected = JSON.parse(fs.readFileSync(
  path.join(packageRoot, "builtin-extensions-source-manifest.json"),
  "utf8",
))
assert.deepEqual(actual, expected)
const definitionCount = actual.reduce((count, extension) =>
  count + extension.blocks.length + extension.menus.filter(menu => menu.acceptReporters).length, 0)
process.stdout.write(`${definitionCount} built-in extension definitions match scratch-vm ${TURBOWARP_VM_SOURCE_REVISION}\n`)
process.exit(0)
