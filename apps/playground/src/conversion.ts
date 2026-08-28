import { assertValidScripts } from '@scratch-code/ast';
import type { Script } from '@scratch-code/ast';
import {
  deserializeScratchblocks,
  serializeScratchblocks,
} from '@scratch-code/scratchblocks-codec';
import type { ScratchblocksCoercion } from '@scratch-code/scratchblocks-codec';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import { parse } from 'scratchblocks-plus/syntax';

const registry = createTurboWarpBlockRegistry();

export const assertScriptArray: (value: unknown) => asserts value is Script[] = (value) => {
  assertValidScripts(value);
};

export const textToAst = (source: string, coercion: ScratchblocksCoercion = 'loose'): Script[] => {
  const document = parse(source, { languages: ['en'] });
  return deserializeScratchblocks(document, registry, { coercion });
};

export const parseAst = (source: string): Script[] => {
  const value: unknown = JSON.parse(source);
  assertScriptArray(value);
  return value;
};

export const scriptsToText = (
  scripts: readonly Script[],
  coercion: ScratchblocksCoercion = 'loose',
): string => serializeScratchblocks(scripts, registry, { coercion }).stringify();

export const astToText = (source: string, coercion: ScratchblocksCoercion = 'loose'): string =>
  scriptsToText(parseAst(source), coercion);

export const formatAst = (scripts: readonly Script[]): string => JSON.stringify(scripts, null, 2);

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
