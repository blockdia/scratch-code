import { describe, expect, it } from 'vitest';

import { validateScripts } from '@scratch-code/ast';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';

import { semanticFixtures } from './fixtures/semantic.js';

describe('AST validation integration', () => {
  it('structurally validates every shared semantic fixture', () => {
    for (const fixture of semanticFixtures) {
      expect(validateScripts(fixture.createAst()), fixture.name).toEqual([]);
    }
  });

  it('semantically validates supported fixtures with the TurboWarp registry', () => {
    const registry = createTurboWarpBlockRegistry();
    for (const fixture of semanticFixtures) {
      if (fixture.name === 'extension-block') continue;
      expect(validateScripts(fixture.createAst(), { registry }), fixture.name).toEqual([]);
    }
  });
});
