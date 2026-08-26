import type {Opcode} from "@scratch-code/ast"

export class DuplicateBlockSpecError extends Error {
  readonly opcode: Opcode

  constructor(opcode: Opcode) {
    super(`Block spec already registered for opcode "${opcode}".`)
    this.name = "DuplicateBlockSpecError"
    this.opcode = opcode
  }
}

export class MissingBlockSpecError extends Error {
  readonly opcode: Opcode

  constructor(opcode: Opcode) {
    super(`No block spec registered for opcode "${opcode}".`)
    this.name = "MissingBlockSpecError"
    this.opcode = opcode
  }
}

export class InvalidResolvedBlockSpecError extends Error {
  readonly opcode: Opcode
  readonly resolvedOpcode: Opcode

  constructor(opcode: Opcode, resolvedOpcode: Opcode) {
    super(
      `Resolver for opcode "${opcode}" returned spec for opcode "${resolvedOpcode}".`,
    )
    this.name = "InvalidResolvedBlockSpecError"
    this.opcode = opcode
    this.resolvedOpcode = resolvedOpcode
  }
}
