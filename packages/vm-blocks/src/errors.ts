export class InvalidVmBlocksError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidVmBlocksError"
  }
}

export class MissingVmBlockIdError extends Error {
  readonly source: string

  constructor(source: string) {
    super(`Cannot serialize VM runtime block "${source}" without metadata.scratch.id.`)
    this.name = "MissingVmBlockIdError"
    this.source = source
  }
}

export class DuplicateVmBlockIdError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`More than one VM runtime block uses ID "${id}".`)
    this.name = "DuplicateVmBlockIdError"
    this.id = id
  }
}
