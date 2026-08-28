import { describe, expect, it } from 'vitest';

import { walk, type JsonValue, type Script } from '@scratch-code/ast';
import { serializeSb3Blocks } from '@scratch-code/sb3';
import { serializeScratchblocks } from '@scratch-code/scratchblocks-codec';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import { serializeVmBlocks } from '@scratch-code/vm-blocks';

import { semanticFixtures } from './fixtures/semantic.js';
import { materializeDeterministically, semanticProjection } from './helpers.js';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const metadataValues = (scripts: readonly Script[]): JsonValue[] => {
  const result: JsonValue[] = [];
  for (const script of scripts)
    walk(script, {
      enter(node) {
        if (node.metadata !== undefined) result.push(node.metadata as JsonValue);
      },
    });
  return result;
};

describe('metadata namespace boundaries', () => {
  it('prevents private metadata from influencing peer codecs', () => {
    const base = materializeDeterministically(
      semanticFixtures.find((fixture) => fixture.name === 'command-stack')!.createAst(),
    );
    const foreign = clone(base);
    foreign[0]!.blocks[0]!.metadata = {
      ...foreign[0]!.blocks[0]!.metadata,
      sb3: { version: 1, mutation: { peer: 'sb3' } },
      vmBlocks: { version: 1, mutation: { peer: 'vm' } },
      scratchblocks: { version: 1, diff: '+', glow: true },
    };

    const withoutSb3 = clone(foreign);
    delete withoutSb3[0]!.blocks[0]!.metadata?.['sb3'];
    expect(serializeSb3Blocks(foreign)).not.toEqual(serializeSb3Blocks(withoutSb3));
    const withoutForeignForSb3 = clone(foreign);
    delete withoutForeignForSb3[0]!.blocks[0]!.metadata?.['vmBlocks'];
    delete withoutForeignForSb3[0]!.blocks[0]!.metadata?.['scratchblocks'];
    expect(serializeSb3Blocks(foreign)).toEqual(serializeSb3Blocks(withoutForeignForSb3));

    const withoutVm = clone(foreign);
    delete withoutVm[0]!.blocks[0]!.metadata?.['vmBlocks'];
    expect(serializeVmBlocks(foreign)).not.toEqual(serializeVmBlocks(withoutVm));
    const withoutForeignForVm = clone(foreign);
    delete withoutForeignForVm[0]!.blocks[0]!.metadata?.['sb3'];
    delete withoutForeignForVm[0]!.blocks[0]!.metadata?.['scratchblocks'];
    expect(serializeVmBlocks(foreign)).toEqual(serializeVmBlocks(withoutForeignForVm));

    const withoutScratchblocks = clone(foreign);
    delete withoutScratchblocks[0]!.blocks[0]!.metadata?.['scratchblocks'];
    expect(serializeScratchblocks(foreign, createTurboWarpBlockRegistry()).stringify()).not.toBe(
      serializeScratchblocks(withoutScratchblocks, createTurboWarpBlockRegistry()).stringify(),
    );
    const withoutForeignForScratchblocks = clone(foreign);
    delete withoutForeignForScratchblocks[0]!.blocks[0]!.metadata?.['sb3'];
    delete withoutForeignForScratchblocks[0]!.blocks[0]!.metadata?.['vmBlocks'];
    expect(serializeScratchblocks(foreign, createTurboWarpBlockRegistry()).stringify()).toBe(
      serializeScratchblocks(
        withoutForeignForScratchblocks,
        createTurboWarpBlockRegistry(),
      ).stringify(),
    );
  });

  it('keeps stable Scratch annotations small and node-specific', () => {
    const complete = materializeDeterministically(
      semanticFixtures.flatMap((fixture) => fixture.createAst()),
    );
    for (const metadata of metadataValues(complete)) {
      if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) continue;
      const scratch = metadata['scratch'];
      if (typeof scratch !== 'object' || scratch === null || Array.isArray(scratch)) continue;
      expect(
        Object.keys(scratch).every((key) => ['id', 'x', 'y', 'numericKind'].includes(key)),
      ).toBe(true);
    }
  });

  it('guards metadata size against raw graph or source snapshot duplication', () => {
    const complete = materializeDeterministically(
      semanticFixtures.flatMap((fixture) => fixture.createAst()),
    );
    const semanticBytes = JSON.stringify(semanticProjection(complete)).length;
    const fullBytes = JSON.stringify(complete).length;
    const ratio = fullBytes / semanticBytes;
    expect({ semanticBytes, fullBytes, ratio }).toMatchObject({
      semanticBytes: expect.any(Number),
      fullBytes: expect.any(Number),
    });
    expect(ratio).toBeLessThan(5);
    for (const metadata of metadataValues(complete)) {
      const serialized = JSON.stringify(metadata);
      expect(serialized).not.toContain('sourceBlocks');
      expect(serialized).not.toContain('representedIds');
      expect(serialized).not.toContain('blockJson');
    }
    console.info('metadata-size', { semanticBytes, fullBytes, ratio });
  });
});
