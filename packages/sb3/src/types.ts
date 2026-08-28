import type { JsonObject, JsonValue } from '@scratch-code/ast';

export type Sb3PrimitiveCode = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** A compact SB3 primitive. Top-level variable/list reporters may include x/y. */
export type Sb3Primitive = [Sb3PrimitiveCode, ...JsonValue[]];

export type Sb3InputValue = string | Sb3Primitive | null;

export type Sb3Input = [1 | 2, Sb3InputValue] | [3, Sb3InputValue, Sb3InputValue];

/** SB3 fields are normally one or two items, but legacy projects can contain JSON values. */
export type Sb3Field = JsonValue[];

export interface Sb3Block extends JsonObject {
  opcode: string;
  next: string | null;
  parent?: string | null;
  inputs: Record<string, Sb3Input>;
  fields: Record<string, Sb3Field>;
  shadow: boolean;
  topLevel: boolean;
  x?: number;
  y?: number;
  mutation?: JsonObject;
  comment?: string;
}

export type Sb3BlockEntry = Sb3Block | Sb3Primitive;

export type Sb3Blocks = Record<string, Sb3BlockEntry>;

interface Sb3MetadataBase {
  version: 1;
}

/** SB3-only details meaningful on a Script node. */
export type Sb3ScriptMetadata = Sb3MetadataBase;

/** SB3-only details which cannot be derived from a semantic Block. */
export interface Sb3BlockMetadata extends Sb3MetadataBase {
  comment?: string;
  /** Raw mutation only for opcodes without a modeled semantic mutation. */
  mutation?: JsonObject;
}

/** Reserved version marker for node-specific Field provenance. */
export type Sb3FieldMetadata = Sb3MetadataBase;
