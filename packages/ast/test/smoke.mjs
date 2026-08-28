import assert from 'node:assert/strict';

import { isScript, transformScripts, walk } from '@scratch-code/ast';

const script = { kind: 'script', blocks: [] };
let visits = 0;

walk(script, {
  enter() {
    visits += 1;
  },
});

assert.equal(isScript(script), true);
assert.equal(visits, 1);

const transformed = transformScripts([script], {
  leave(node) {
    if (node.kind === 'script') return { ...node, metadata: { smoke: true } };
  },
});
assert.equal(transformed[0].metadata.smoke, true);
assert.equal(script.metadata, undefined);
