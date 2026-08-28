import type { Sb3Blocks } from '@scratch-code/sb3';
import type { VmBlock } from '@scratch-code/vm-blocks';

export interface WireFixture {
  readonly name: string;
  readonly sb3: Sb3Blocks;
  readonly vmBlocks: readonly VmBlock[];
  readonly scratchblocksText: string;
}

export const wireFixtures: readonly WireFixture[] = [
  {
    name: 'move-number',
    sb3: {
      move: {
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: [1, [4, '10']] },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 12,
        y: 34,
      },
    },
    vmBlocks: [
      {
        id: 'move',
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: { name: 'STEPS', block: 'number', shadow: 'number' } },
        fields: {},
        shadow: false,
        topLevel: true,
        x: 12,
        y: 34,
      },
      {
        id: 'number',
        opcode: 'math_number',
        next: null,
        parent: 'move',
        inputs: {},
        fields: { NUM: { name: 'NUM', value: '10' } },
        shadow: true,
        topLevel: false,
      },
    ],
    scratchblocksText: 'move (10) steps',
  },
  {
    name: 'nested-reporter-with-fallback',
    sb3: {
      move: {
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: [3, 'variable', [4, '10']] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      variable: {
        opcode: 'data_variable',
        next: null,
        parent: 'move',
        inputs: {},
        fields: { VARIABLE: ['score', 'variable-id'] },
        shadow: false,
        topLevel: false,
      },
    },
    vmBlocks: [
      {
        id: 'move',
        opcode: 'motion_movesteps',
        next: null,
        parent: null,
        inputs: { STEPS: { name: 'STEPS', block: 'variable', shadow: 'number' } },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      {
        id: 'variable',
        opcode: 'data_variable',
        next: null,
        parent: 'move',
        inputs: {},
        fields: {
          VARIABLE: { name: 'VARIABLE', value: 'score', id: 'variable-id', variableType: '' },
        },
        shadow: false,
        topLevel: false,
      },
      {
        id: 'number',
        opcode: 'math_number',
        next: null,
        parent: 'move',
        inputs: {},
        fields: { NUM: { name: 'NUM', value: '10' } },
        shadow: true,
        topLevel: false,
      },
    ],
    scratchblocksText: 'move (score) steps',
  },
  {
    name: 'menu-shadow',
    sb3: {
      goto: {
        opcode: 'motion_goto',
        next: null,
        parent: null,
        inputs: { TO: [1, 'menu'] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      menu: {
        opcode: 'motion_goto_menu',
        next: null,
        parent: 'goto',
        inputs: {},
        fields: { TO: ['_random_'] },
        shadow: true,
        topLevel: false,
      },
    },
    vmBlocks: [
      {
        id: 'goto',
        opcode: 'motion_goto',
        next: null,
        parent: null,
        inputs: { TO: { name: 'TO', block: 'menu', shadow: 'menu' } },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      {
        id: 'menu',
        opcode: 'motion_goto_menu',
        next: null,
        parent: 'goto',
        inputs: {},
        fields: { TO: { name: 'TO', value: '_random_' } },
        shadow: true,
        topLevel: false,
      },
    ],
    scratchblocksText: 'go to (random position v)',
  },
];
