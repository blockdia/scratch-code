export class DuplicateProcedureDefinitionError extends Error {
  readonly proccode: string;
  readonly definitionIds: readonly (string | null)[];

  constructor(proccode: string, definitionIds: readonly (string | null)[]) {
    super(
      `More than one reachable procedure definition uses proccode ${JSON.stringify(proccode)}.`,
    );
    this.name = 'DuplicateProcedureDefinitionError';
    this.proccode = proccode;
    this.definitionIds = definitionIds;
  }
}
