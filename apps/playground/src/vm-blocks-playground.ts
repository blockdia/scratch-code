import type { Script } from '@scratch-code/ast';
import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import { deserializeVmBlocks, serializeVmBlocks } from '@scratch-code/vm-blocks';
import type { VmBlock } from '@scratch-code/vm-blocks';

import { parseAst } from './conversion.js';
import './package.css';

const example: VmBlock[] = [
  {
    id: 'move',
    opcode: 'motion_movesteps',
    next: null,
    parent: null,
    inputs: { STEPS: { name: 'STEPS', block: 'steps', shadow: 'steps' } },
    fields: {},
    shadow: false,
    topLevel: true,
    x: 40,
    y: 60,
  },
  {
    id: 'steps',
    opcode: 'math_number',
    next: null,
    parent: 'move',
    inputs: {},
    fields: { NUM: { name: 'NUM', value: '10' } },
    shadow: true,
    topLevel: false,
  },
];

const registry = createTurboWarpBlockRegistry();
const blocks = document.querySelector<HTMLTextAreaElement>('#blocks')!;
const ast = document.querySelector<HTMLTextAreaElement>('#ast')!;
const blocksError = document.querySelector<HTMLElement>('#blocks-error')!;
const astError = document.querySelector<HTMLElement>('#ast-error')!;
const message = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const toAst = (): void => {
  try {
    const scripts = deserializeVmBlocks(JSON.parse(blocks.value) as VmBlock[], registry);
    ast.value = JSON.stringify(scripts, null, 2);
    window.ast = scripts;
    blocksError.textContent = '';
  } catch (caught) {
    blocksError.textContent = message(caught);
  }
};

const toVm = (): void => {
  try {
    const scripts: Script[] = parseAst(ast.value);
    blocks.value = JSON.stringify(serializeVmBlocks(scripts), null, 2);
    window.ast = scripts;
    astError.textContent = '';
  } catch (caught) {
    astError.textContent = message(caught);
  }
};

const reset = (): void => {
  blocks.value = JSON.stringify(example, null, 2);
  toAst();
};

document.querySelector('#to-ast')!.addEventListener('click', toAst);
document.querySelector('#to-vm')!.addEventListener('click', toVm);
document.querySelector('#reset')!.addEventListener('click', reset);
reset();
