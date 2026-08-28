export class DuplicateBlockIdError extends Error {
  readonly id: string;

  constructor(id: string) {
    super(`More than one AST block uses block ID "${id}".`);
    this.name = 'DuplicateBlockIdError';
    this.id = id;
  }
}

export class InvalidGeneratedBlockIdError extends Error {
  readonly value: unknown;

  constructor(value: unknown) {
    super('The block ID generator must return a non-empty string.');
    this.name = 'InvalidGeneratedBlockIdError';
    this.value = value;
  }
}
