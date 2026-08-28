import type { Script } from '@scratch-code/ast';

import { diffScripts, type DiffMatchingStrategy, type SemanticDiff } from '../src/index.js';

const scripts: readonly Script[] = [{ kind: 'script', blocks: [] }];
const matching: readonly DiffMatchingStrategy[] = [
  { kind: 'scratch-id' },
  { kind: 'ordered' },
  { kind: 'similarity' },
];
const result: SemanticDiff = diffScripts(scripts, scripts, { matching });

// @ts-expect-error source-specific matching strategies are not part of the core.
diffScripts(scripts, scripts, { matching: [{ kind: 'sb3-id' }] });

void result;
