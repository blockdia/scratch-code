import type {
  JsonValue,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script,
} from '@scratch-code/ast';

/** A variable, list, or broadcast identity referenced by semantic fields. */
export interface ResourceReference {
  readonly value: JsonValue;
  readonly id?: string;
}

/** Information derived from a collection of semantic scripts. */
export interface ScriptAnalysis {
  readonly variables: ResourceReference[];
  readonly lists: ResourceReference[];
  readonly broadcasts: ResourceReference[];
  readonly procedureDefinitions: ProcedurePrototypeMutation[];
  readonly procedureCalls: ProcedureCallMutation[];
  readonly unresolvedProcedureCalls: ProcedureCallMutation[];
  readonly extensions: string[];
}

/** Minimal identity of a procedure which is not defined in the fragment. */
export interface ProcedureDependency {
  readonly proccode: string;
}

export interface ScratchFragmentDependencies {
  readonly variables: ResourceReference[];
  readonly lists: ResourceReference[];
  readonly broadcasts: ResourceReference[];
  readonly procedures: ProcedureDependency[];
  readonly extensions: string[];
}

export interface ScratchFragmentV1 {
  readonly version: 1;
  readonly scripts: Script[];
  readonly dependencies: ScratchFragmentDependencies;
}

/** Union reserved for future fragment format versions. */
export type ScratchFragment = ScratchFragmentV1;

export interface CreateScratchFragmentOptions {
  /** Scripts from which reachable custom-procedure definitions may be copied. */
  readonly sourceScripts?: readonly Script[];
}
