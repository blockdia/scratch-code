import {specsBySourceFile} from "../internal/catalog.js"
export const shadowBlockSpecs = [
  ...specsBySourceFile.get("blocks_common/math.js")!,
  ...specsBySourceFile.get("blocks_common/text.js")!,
  ...specsBySourceFile.get("blocks_common/colour.js")!,
  ...specsBySourceFile.get("blocks_common/matrix.js")!,
  ...specsBySourceFile.get("blocks_common/note.js")!,
] as const
