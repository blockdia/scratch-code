import type {Script} from "@scratch-code/ast"

import {
  analyzeScripts,
  createScratchFragment,
  type ScratchFragment,
} from "../src/index.js"

const scripts: Script[] = []
const analysis = analyzeScripts(scripts)
const fragment: ScratchFragment = createScratchFragment(scripts, {sourceScripts: scripts})

void analysis.procedureCalls
void fragment.dependencies.procedures

// @ts-expect-error v1 has a literal numeric discriminator.
const wrongVersion: ScratchFragment = {version: 2, scripts: [], dependencies: fragment.dependencies}
void wrongVersion
