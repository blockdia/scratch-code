import type {
  Sb3BlockMetadata,
  Sb3FieldMetadata,
  Sb3ScriptMetadata,
} from "../src/index.js"

const script: Sb3ScriptMetadata = {version: 1}
const block: Sb3BlockMetadata = {version: 1, comment: "comment-id"}
const field: Sb3FieldMetadata = {version: 1}

// @ts-expect-error block-only provenance is not legal on Script metadata.
const scriptWithComment: Sb3ScriptMetadata = {version: 1, comment: "comment-id"}

void [script, block, field, scriptWithComment]
