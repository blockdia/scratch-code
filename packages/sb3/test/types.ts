import type {
  Sb3BlockMetadata,
  Sb3FieldMetadata,
  Sb3InputMetadata,
  Sb3ScriptMetadata,
} from "../src/index.js"

const script: Sb3ScriptMetadata = {version: 1}
const block: Sb3BlockMetadata = {version: 1, comment: "comment-id"}
const input: Sb3InputMetadata = {version: 1, shadowId: "shadow-id"}
const field: Sb3FieldMetadata = {version: 1}

// @ts-expect-error block-only provenance is not legal on Script metadata.
const scriptWithComment: Sb3ScriptMetadata = {version: 1, comment: "comment-id"}

// @ts-expect-error scalar object IDs belong to Input metadata.
const fieldWithShadowId: Sb3FieldMetadata = {version: 1, shadowId: "shadow-id"}

void [script, block, input, field, scriptWithComment, fieldWithShadowId]
