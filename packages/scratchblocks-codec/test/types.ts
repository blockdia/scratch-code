import type {
  ScratchblocksBlockMetadata,
  ScratchblocksScriptMetadata,
} from "../src/index.js"

const script: ScratchblocksScriptMetadata = {version: 1, glow: true}
const block: ScratchblocksBlockMetadata = {version: 1, comment: "note", diff: "+", glow: true}

// @ts-expect-error comments are block-only surface metadata.
const scriptWithComment: ScratchblocksScriptMetadata = {version: 1, comment: "note"}

// @ts-expect-error diff markers are block-only surface metadata.
const scriptWithDiff: ScratchblocksScriptMetadata = {version: 1, diff: "+"}

void [script, block, scriptWithComment, scriptWithDiff]
