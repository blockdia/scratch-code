import { describe, expect, it } from 'vitest';

import * as astApi from '@scratch-code/ast';
import * as blockSpecApi from '@scratch-code/block-spec';
import * as fragmentApi from '@scratch-code/fragment';
import * as materializeApi from '@scratch-code/materialize';
import * as sb3Api from '@scratch-code/sb3';
import * as scratchblocksApi from '@scratch-code/scratchblocks-codec';
import * as turboWarpApi from '@scratch-code/turbowarp-blocks';
import * as vmBlocksApi from '@scratch-code/vm-blocks';

import astPackage from '../../packages/ast/package.json' with { type: 'json' };
import blockSpecPackage from '../../packages/block-spec/package.json' with { type: 'json' };
import fragmentPackage from '../../packages/fragment/package.json' with { type: 'json' };
import materializePackage from '../../packages/materialize/package.json' with { type: 'json' };
import sb3Package from '../../packages/sb3/package.json' with { type: 'json' };
import scratchblocksPackage from '../../packages/scratchblocks-codec/package.json' with { type: 'json' };
import turboWarpPackage from '../../packages/turbowarp-blocks/package.json' with { type: 'json' };
import vmBlocksPackage from '../../packages/vm-blocks/package.json' with { type: 'json' };

interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly sideEffects?: boolean;
  readonly exports?: Readonly<Record<string, unknown>>;
}

const manifests: Readonly<Record<string, PackageManifest>> = {
  '@scratch-code/ast': astPackage,
  '@scratch-code/block-spec': blockSpecPackage,
  '@scratch-code/fragment': fragmentPackage,
  '@scratch-code/materialize': materializePackage,
  '@scratch-code/sb3': sb3Package,
  '@scratch-code/vm-blocks': vmBlocksPackage,
  '@scratch-code/scratchblocks-codec': scratchblocksPackage,
  '@scratch-code/turbowarp-blocks': turboWarpPackage,
};

describe('public API consistency', () => {
  it('exports the stable codec and registry names without obsolete aliases', () => {
    expect(sb3Api).toMatchObject({
      deserializeSb3Blocks: expect.any(Function),
      serializeSb3Blocks: expect.any(Function),
    });
    expect(sb3Api).not.toHaveProperty('deserializeBlocks');
    expect(sb3Api).not.toHaveProperty('serializeBlocks');
    expect(vmBlocksApi).toMatchObject({
      deserializeVmBlocks: expect.any(Function),
      serializeVmBlocks: expect.any(Function),
    });
    expect(scratchblocksApi).toMatchObject({
      deserializeScratchblocks: expect.any(Function),
      serializeScratchblocks: expect.any(Function),
    });
    expect(fragmentApi).toMatchObject({
      analyzeScripts: expect.any(Function),
      createScratchFragment: expect.any(Function),
      SCRATCH_FRAGMENT_VERSION: 1,
    });
    expect(materializeApi).toMatchObject({ materialize: expect.any(Function) });
    expect(materializeApi).not.toHaveProperty('materializeScripts');
    expect(blockSpecApi).toMatchObject({ createBlockSpecRegistry: expect.any(Function) });
    expect(Object.keys(astApi)).not.toContain('createBlockSpecRegistry');
    expect(turboWarpApi).toMatchObject({ createTurboWarpBlockRegistry: expect.any(Function) });
    expect(vmBlocksApi).not.toHaveProperty('InvalidSb3BlocksError');
    expect(sb3Api).not.toHaveProperty('InvalidVmBlocksError');
  });

  it('keeps package roots ESM/type exported and side-effect free', () => {
    for (const [name, manifest] of Object.entries(manifests)) {
      expect(manifest.sideEffects, name).toBe(false);
      expect(manifest.exports?.['.'], name).toMatchObject({
        types: expect.stringContaining('.d.ts'),
        import: expect.stringContaining('.js'),
      });
    }
  });
});

describe('production dependency DAG', () => {
  it('contains no cross-codec or inverted architecture edges', () => {
    const dependencies = Object.fromEntries(
      Object.entries(manifests).map(([name, manifest]) => [
        name,
        Object.keys(manifest.dependencies ?? {}),
      ]),
    );
    expect(dependencies).toEqual({
      '@scratch-code/ast': [],
      '@scratch-code/block-spec': ['@scratch-code/ast'],
      '@scratch-code/fragment': ['@scratch-code/ast'],
      '@scratch-code/materialize': ['@scratch-code/ast', '@scratch-code/block-spec'],
      '@scratch-code/sb3': ['@scratch-code/ast', '@scratch-code/block-spec'],
      '@scratch-code/vm-blocks': ['@scratch-code/ast', '@scratch-code/block-spec'],
      '@scratch-code/scratchblocks-codec': [
        '@scratch-code/ast',
        '@scratch-code/block-spec',
        'scratchblocks-plus',
      ],
      '@scratch-code/turbowarp-blocks': ['@scratch-code/ast', '@scratch-code/block-spec'],
    });
    expect(dependencies['@scratch-code/scratchblocks-codec']).not.toContain(
      '@scratch-code/turbowarp-blocks',
    );
  });
});
