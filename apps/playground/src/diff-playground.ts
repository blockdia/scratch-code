import type { Script } from '@scratch-code/ast';
import { diffScripts } from '@scratch-code/diff';
import type { DiffMatchingStrategy } from '@scratch-code/diff';

import { parseAst } from './conversion.js';
import './package.css';

const beforeExample: Script[] = [
  {
    kind: 'script',
    blocks: [
      {
        kind: 'block',
        opcode: 'motion_movesteps',
        metadata: { scratch: { id: 'move' } },
        fields: {},
        inputs: { STEPS: { kind: 'input', type: 'number', value: '10' } },
      },
    ],
  },
];

const afterExample: Script[] = [
  {
    kind: 'script',
    blocks: [
      {
        kind: 'block',
        opcode: 'motion_movesteps',
        metadata: { scratch: { id: 'move' } },
        fields: {},
        inputs: { STEPS: { kind: 'input', type: 'number', value: '20' } },
      },
      {
        kind: 'block',
        opcode: 'looks_say',
        metadata: { scratch: { id: 'say' } },
        fields: {},
        inputs: { MESSAGE: { kind: 'input', type: 'string', value: 'Done!' } },
      },
    ],
  },
];

const before = document.querySelector<HTMLTextAreaElement>('#before')!;
const after = document.querySelector<HTMLTextAreaElement>('#after')!;
const matching = document.querySelector<HTMLSelectElement>('#matching')!;
const output = document.querySelector<HTMLElement>('#output')!;
const error = document.querySelector<HTMLElement>('#error')!;

const selectedMatching = (): readonly DiffMatchingStrategy[] | undefined => {
  if (matching.value === 'ordered') return [{ kind: 'ordered' }];
  if (matching.value === 'id') return [{ kind: 'scratch-id' }];
  return undefined;
};

const compare = (): void => {
  try {
    const beforeScripts = parseAst(before.value);
    const afterScripts = parseAst(after.value);
    const strategies = selectedMatching();
    const result = diffScripts(
      beforeScripts,
      afterScripts,
      strategies === undefined ? {} : { matching: strategies },
    );
    window.ast = afterScripts;
    output.textContent = JSON.stringify(result, null, 2);
    error.textContent = '';
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : String(caught);
  }
};

const reset = (): void => {
  before.value = JSON.stringify(beforeExample, null, 2);
  after.value = JSON.stringify(afterExample, null, 2);
  matching.value = 'default';
  compare();
};

document.querySelector('#compare')!.addEventListener('click', compare);
document.querySelector('#reset')!.addEventListener('click', reset);
reset();
