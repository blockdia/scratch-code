import assert from "node:assert/strict"
import {execFileSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import {fileURLToPath} from "node:url"

import {TURBOWARP_BLOCKS_SOURCE_REVISION} from "../dist/constants.js"
import {extractSource} from "./extract-source.mjs"
import {createSourceManifest} from "./source-manifest.mjs"

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const scratchBlocksRoot = process.argv.slice(2).find(argument => argument !== "--")
if (scratchBlocksRoot === undefined) {
  throw new Error("Usage: pnpm audit:scratch-blocks -- /path/to/scratch-blocks")
}
const expected = JSON.parse(fs.readFileSync(path.join(packageRoot, "source-manifest.json"), "utf8"))
const actual = createSourceManifest(extractSource(path.resolve(scratchBlocksRoot)).records)
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: scratchBlocksRoot,
  encoding: "utf8",
}).trim()
assert.equal(revision, TURBOWARP_BLOCKS_SOURCE_REVISION, "scratch-blocks revision does not match the pinned source")
assert.deepEqual(actual, expected)
process.stdout.write(`169 definitions match scratch-blocks ${TURBOWARP_BLOCKS_SOURCE_REVISION}\n`)
