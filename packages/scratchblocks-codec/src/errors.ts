export class InvalidScratchblocksAstError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidScratchblocksAstError"
  }
}

export class UnknownScratchblocksBlockError extends Error {
  constructor(description: string) {
    super(`Cannot identify scratchblocks block ${description}.`)
    this.name = "UnknownScratchblocksBlockError"
  }
}

export class AmbiguousScratchblocksBlockError extends Error {
  readonly opcodes: readonly string[]

  constructor(description: string, opcodes: readonly string[]) {
    super(`Scratchblocks block ${description} matches more than one opcode: ${opcodes.join(", ")}.`)
    this.name = "AmbiguousScratchblocksBlockError"
    this.opcodes = opcodes
  }
}

export class MissingScratchblocksSpecMetadataError extends Error {
  readonly opcode: string

  constructor(opcode: string, detail: string) {
    super(`Block spec "${opcode}" lacks scratchblocks metadata required to ${detail}.`)
    this.name = "MissingScratchblocksSpecMetadataError"
    this.opcode = opcode
  }
}

export class ScratchblocksTypeMismatchError extends Error {
  constructor(opcode: string, slot: string, expected: string, actual: string) {
    super(`Scratchblocks block "${opcode}" slot "${slot}" expects ${expected}, but received ${actual}.`)
    this.name = "ScratchblocksTypeMismatchError"
  }
}
