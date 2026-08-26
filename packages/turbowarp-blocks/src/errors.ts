export class InvalidTurboWarpBlockContextError extends Error {
  readonly opcode: string
  readonly expectedKind: string

  constructor(opcode: string, expectedKind: string) {
    super(`Invalid context for ${opcode}; expected ${expectedKind}`)
    this.name = "InvalidTurboWarpBlockContextError"
    this.opcode = opcode
    this.expectedKind = expectedKind
  }
}
