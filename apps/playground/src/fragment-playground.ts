import type { Script } from '@scratch-code/ast';
import { analyzeScripts, createScratchFragment } from '@scratch-code/fragment';

import { parseAst } from './conversion.js';
import './package.css';

const selectedExample: Script[] = [
  {
    kind: 'script',
    blocks: [
      {
        kind: 'block',
        opcode: 'data_setvariableto',
        fields: {
          VARIABLE: { kind: 'field', type: 'variable', value: 'score', id: 'score-id' },
        },
        inputs: { VALUE: { kind: 'input', type: 'number', value: 1 } },
      },
      {
        kind: 'block',
        opcode: 'procedures_call',
        fields: {},
        inputs: { message: { kind: 'input', type: 'string', value: 'Ready!' } },
        mutation: {
          type: 'procedure-call',
          proccode: 'announce %s',
          argumentIds: ['message'],
          warp: false,
          returnType: 'statement',
        },
      },
    ],
  },
];

const sourceExample: Script[] = [
  {
    kind: 'script',
    blocks: [
      {
        kind: 'block',
        opcode: 'procedures_definition',
        metadata: { scratch: { id: 'definition' } },
        fields: {},
        inputs: {
          custom_block: {
            kind: 'input',
            type: 'block',
            value: {
              kind: 'block',
              opcode: 'procedures_prototype',
              metadata: { scratch: { id: 'prototype' } },
              fields: {},
              inputs: {},
              mutation: {
                type: 'procedure-prototype',
                proccode: 'announce %s',
                argumentIds: ['message'],
                argumentNames: ['message'],
                argumentDefaults: [''],
                warp: false,
              },
            },
          },
        },
      },
      {
        kind: 'block',
        opcode: 'pen_clear',
        fields: {},
        inputs: {},
      },
    ],
  },
];

const selected = document.querySelector<HTMLTextAreaElement>('#selected')!;
const source = document.querySelector<HTMLTextAreaElement>('#source')!;
const output = document.querySelector<HTMLElement>('#output')!;
const error = document.querySelector<HTMLElement>('#error')!;

const create = (): void => {
  try {
    const selectedScripts = parseAst(selected.value);
    const sourceScripts = parseAst(source.value);
    const fragment = createScratchFragment(selectedScripts, { sourceScripts });
    window.ast = fragment.scripts;
    output.textContent = JSON.stringify(
      { selectedAnalysis: analyzeScripts(selectedScripts), fragment },
      null,
      2,
    );
    error.textContent = '';
  } catch (caught) {
    error.textContent = caught instanceof Error ? caught.message : String(caught);
  }
};

const reset = (): void => {
  selected.value = JSON.stringify(selectedExample, null, 2);
  source.value = JSON.stringify(sourceExample, null, 2);
  create();
};

document.querySelector('#create')!.addEventListener('click', create);
document.querySelector('#reset')!.addEventListener('click', reset);
reset();
