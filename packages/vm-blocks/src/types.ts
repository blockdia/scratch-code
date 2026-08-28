import type { JsonObject, JsonValue } from '@scratch-code/ast';

export type VmVariableType = '' | 'list' | 'broadcast_msg';

/** One input edge in Scratch VM's hydrated block representation. */
export interface VmBlockInput {
  name?: string;
  block?: string | null;
  shadow?: string | null;
}

/** One field in Scratch VM's hydrated block representation. */
export interface VmBlockField {
  name?: string;
  value: JsonValue;
  id?: string | null;
  variableType?: VmVariableType;
}

/**
 * A block accepted by `vm.shareBlocksToTarget` and returned from
 * `Object.values(target.blocks._blocks)`.
 */
export interface VmBlock {
  id: string;
  opcode: string;
  next?: string | null;
  parent?: string | null;
  inputs?: Record<string, VmBlockInput>;
  fields?: Record<string, VmBlockField>;
  shadow?: boolean;
  topLevel?: boolean;
  x?: number;
  y?: number;
  mutation?: JsonObject;
  comment?: string;
}

/** VM-only block details which are not modeled semantically by the AST. */
export interface VmBlocksBlockMetadata {
  version: 1;
  comment?: string;
  /** Raw mutation only for opcodes without a modeled semantic mutation. */
  mutation?: JsonObject;
}
