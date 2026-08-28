import type { DiffInputDiagnostics } from './types.js';

export class InvalidDiffInputError extends TypeError {
  readonly inputs: readonly DiffInputDiagnostics[];

  constructor(inputs: readonly DiffInputDiagnostics[]) {
    const count = inputs.reduce((sum, input) => sum + input.diagnostics.length, 0);
    super(`Cannot diff invalid semantic AST input (${String(count)} error(s)).`);
    this.name = 'InvalidDiffInputError';
    this.inputs = inputs;
  }
}
