import type { Script } from '@scratch-code/ast';
import {
  deserializeScratchblocks,
  serializeScratchblocks,
} from '@scratch-code/scratchblocks-codec';
import type { ScratchblocksCoercion } from '@scratch-code/scratchblocks-codec';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import { parse } from 'scratchblocks-plus/syntax';

const registry = createTurboWarpBlockRegistry();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertBlock = (value: unknown, path: string): void => {
  if (!isRecord(value) || value['kind'] !== 'block') {
    throw new TypeError(`${path} must be a block node.`);
  }
  if (typeof value['opcode'] !== 'string' || value['opcode'] === '') {
    throw new TypeError(`${path}.opcode must be a non-empty string.`);
  }
  if (!isRecord(value['fields'])) {
    throw new TypeError(`${path}.fields must be an object.`);
  }
  if (!isRecord(value['inputs'])) {
    throw new TypeError(`${path}.inputs must be an object.`);
  }
};

export const assertScriptArray: (value: unknown) => asserts value is Script[] = (value) => {
  if (!Array.isArray(value)) {
    throw new TypeError('The AST must be a JSON array of script nodes.');
  }
  value.forEach((script, scriptIndex) => {
    const path = `AST[${scriptIndex}]`;
    if (!isRecord(script) || script['kind'] !== 'script') {
      throw new TypeError(`${path} must be a script node.`);
    }
    const blocks = script['blocks'];
    if (!Array.isArray(blocks)) {
      throw new TypeError(`${path}.blocks must be an array.`);
    }
    blocks.forEach((block, blockIndex) => assertBlock(block, `${path}.blocks[${blockIndex}]`));
  });
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
