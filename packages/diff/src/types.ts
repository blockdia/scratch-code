import type { AstDiagnostic, AstPathSegment, JsonValue } from '@scratch-code/ast';

export type DiffEntityKind = 'script' | 'block' | 'input' | 'field' | 'mutation';
export type DiffPath = readonly AstPathSegment[];
export type DiffMatchBasis = 'scratch-id' | 'ordered' | 'similarity' | 'key';

export interface DiffLocation {
  readonly kind: DiffEntityKind;
  readonly path: DiffPath;
  /** Optional source identity hint. Paths remain the canonical location. */
  readonly scratchId?: string;
}

export interface DiffPair {
  readonly id: string;
  readonly kind: DiffEntityKind;
  readonly basis: DiffMatchBasis;
  readonly before: DiffLocation;
  readonly after: DiffLocation;
}

export type DiffValueState =
  { readonly present: false } | { readonly present: true; readonly value: JsonValue };

export interface DiffPropertyChange {
  /** Path relative to the paired entity. */
  readonly path: DiffPath;
  readonly before: DiffValueState;
  readonly after: DiffValueState;
}

export interface DiffAddChange {
  readonly id: string;
  readonly type: 'add';
  readonly target: DiffLocation;
  /** Present when this addition is one half of a move. */
  readonly pairId?: string;
}

export interface DiffRemoveChange {
  readonly id: string;
  readonly type: 'remove';
  readonly target: DiffLocation;
  /** Present when this removal is one half of a move. */
  readonly pairId?: string;
}

export interface DiffModifyChange {
  readonly id: string;
  readonly type: 'modify';
  readonly kind: DiffEntityKind;
  readonly pairId: string;
  readonly before: DiffLocation;
  readonly after: DiffLocation;
  readonly properties: readonly DiffPropertyChange[];
}

export type DiffChange = DiffAddChange | DiffRemoveChange | DiffModifyChange;

export interface DiffMoveRelation {
  readonly id: string;
  readonly type: 'move';
  readonly pairId: string;
  readonly before: DiffLocation;
  readonly after: DiffLocation;
  readonly removeChangeId: string;
  readonly addChangeId: string;
}

export type DiffRelation = DiffMoveRelation;

export interface SemanticDiffV1 {
  readonly version: 1;
  readonly pairs: readonly DiffPair[];
  readonly changes: readonly DiffChange[];
  readonly relations: readonly DiffRelation[];
}

export type SemanticDiff = SemanticDiffV1;

export type DiffMatchingStrategy =
  { readonly kind: 'scratch-id' } | { readonly kind: 'ordered' } | { readonly kind: 'similarity' };

export interface DiffScriptsOptions {
  /** Ordered matching pipeline. Omit to use ID, ordered, then similarity. */
  readonly matching?: readonly DiffMatchingStrategy[];
}

export type DiffInputSide = 'before' | 'after';

export interface DiffInputDiagnostics {
  readonly side: DiffInputSide;
  readonly diagnostics: readonly AstDiagnostic[];
}
