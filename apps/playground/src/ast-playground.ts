import type { AstNode, Script } from '@scratch-code/ast';
import { walk } from '@scratch-code/ast';
import './package.css';

const example: Script = {
  kind: 'script',
  blocks: [
    {
      kind: 'block',
      opcode: 'motion_movesteps',
      fields: {},
      inputs: { STEPS: { kind: 'input', type: 'number', value: '10' } },
    },
  ],
};
const source = document.querySelector<HTMLTextAreaElement>('#source')!;
const output = document.querySelector<HTMLElement>('#output')!;
const error = document.querySelector<HTMLElement>('#error')!;
const reset = (): void => {
  source.value = JSON.stringify(example, null, 2);
};
const analyze = (): void => {
  try {
    const script = JSON.parse(source.value) as Script;
    const counts: Record<AstNode['kind'], number> = { script: 0, block: 0, input: 0, field: 0 };
    let maxDepth = 0;
    walk(script, {
      enter(node, context) {
        counts[node.kind] += 1;
        maxDepth = Math.max(maxDepth, context.depth);
      },
    });
    window.ast = [script];
    output.textContent = JSON.stringify(
      { counts, maxDepth, opcodes: script.blocks.map((block) => block.opcode) },
      null,
      2,
    );
    error.textContent = '';
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : String(caught);
  }
};
document.querySelector('#analyze')!.addEventListener('click', analyze);
document.querySelector('#reset')!.addEventListener('click', () => {
  reset();
  analyze();
});
reset();
analyze();
