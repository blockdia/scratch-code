import type { LanguageData } from 'scratchblocks-plus/syntax';

export type ScratchblocksCoercion = 'loose' | 'strict';

export interface ProcedureArgumentIdContext {
  readonly procedureCode: string;
  readonly procedurePath: string;
  readonly argumentIndex: number;
  readonly argumentName: string;
  readonly argumentType: 'number' | 'string' | 'boolean';
}

export interface DeserializeScratchblocksOptions {
  readonly coercion?: ScratchblocksCoercion;
  readonly createProcedureArgumentId?: (context: ProcedureArgumentIdContext) => string;
}

export interface SerializeScratchblocksOptions {
  readonly coercion?: ScratchblocksCoercion;
  readonly language?: LanguageData;
}

export interface ScratchblocksScriptMetadata {
  version: 1;
  glow?: boolean;
}

/** Lightweight scratchblocks-only details stored on Block nodes. */
export interface ScratchblocksBlockMetadata {
  version: 1;
  comment?: string;
  diff?: '+' | '-';
  glow?: boolean;
}

export type ScratchblocksMetadata = ScratchblocksScriptMetadata | ScratchblocksBlockMetadata;
