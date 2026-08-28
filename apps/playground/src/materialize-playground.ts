import type { Script } from '@scratch-code/ast';
import { materialize } from '@scratch-code/materialize';
import type { BlockIdGenerator } from '@scratch-code/materialize';
import {
  createTurboWarpBlockRegistry,
  getTurboWarpBlockResolveContext,
} from '@scratch-code/turbowarp-blocks';

import { parseAst } from './conversion.js';
import './package.css';

const example: Script[] = [
  {
    kind: 'script',
    metadata: { scratch: { x: 40, y: 60 } },
    blocks: [
      {
        kind: 'block',
        opcode: 'motion_movesteps',
        fields: {},
        inputs: {},
      },
    ],
  },
];

const registry = createTurboWarpBlockRegistry();
const source = document.querySelector<HTMLTextAreaElement>('#source')!;
const output = document.querySelector<HTMLElement>('#output')!;
const error = document.querySelector<HTMLElement>('#error')!;

const deterministicGenerator = (): BlockIdGenerator => {
  let next = 1;
  return (_node, usedIds) => {
    let candidate: string;
    do candidate = `demo-${String(next++)}`;
    while (usedIds.has(candidate));
    return candidate;
  };
};

const run = (): void => {
  try {
    const scripts = parseAst(source.value);
    const completed = materialize(scripts, registry, {
      contextForBlock: (block, { hasNext }) => getTurboWarpBlockResolveContext(block, hasNext),
      generateBlockId: deterministicGenerator(),
    });
    window.ast = completed;
    output.textContent = JSON.stringify(completed, null, 2);
    error.textContent = '';
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : String(caught);
  }
};

const reset = (): void => {
  source.value = JSON.stringify(example, null, 2);
  run();
};

document.querySelector('#materialize')!.addEventListener('click', run);
document.querySelector('#reset')!.addEventListener('click', reset);
reset();
