export class InvalidSb3BlocksError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSb3BlocksError';
  }
}

export class InvalidBlockGraphError extends InvalidSb3BlocksError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBlockGraphError';
  }
}

export class MissingBlockIdError extends Error {
  constructor(opcode: string) {
    super(`Cannot serialize non-primitive block "${opcode}" without metadata.scratch.id.`);
    this.name = 'MissingBlockIdError';
  }
}

export class DuplicateBlockIdError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`More than one AST block uses SB3 block ID "${id}".`);
    this.name = 'DuplicateBlockIdError';
    this.id = id;
  }
}
