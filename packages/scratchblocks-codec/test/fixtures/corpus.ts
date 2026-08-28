import type { Sb3Blocks } from '@scratch-code/sb3';

/** Minimal block-graph closures extracted from real projects in sb3-projects. */
export const corpusFragments: ReadonlyArray<{
  readonly name: string;
  readonly source: string;
  readonly target: string;
  readonly blocks: Sb3Blocks;
}> = [
  {
    name: 'ascii-key-initialization',
    source: 'ASCII Key Detector.sb3',
    target: 'ASCII Keys',
    blocks: {
      'O#D*Sk,e2Ge6w,x?qI5S': {
        opcode: 'event_whenflagclicked',
        next: 'Nr(+nUO5qV*P545uVj8Y',
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 58,
        y: 380,
      },
      'Nr(+nUO5qV*P545uVj8Y': {
        opcode: 'data_deleteoflist',
        next: 'o}2Q*jphlusJRL!A4LgK',
        parent: 'O#D*Sk,e2Ge6w,x?qI5S',
        inputs: { INDEX: [1, [7, 'all']] },
        fields: { LIST: ['Key Presses', 'UIb2Qv3OuA`E)Xm}{KYF-Key Presses-list'] },
        shadow: false,
        topLevel: false,
        comment: 'DPu*9DXQyWTQeSWi?|X-',
      },
      'o}2Q*jphlusJRL!A4LgK': {
        opcode: 'data_setvariableto',
        next: null,
        parent: 'Nr(+nUO5qV*P545uVj8Y',
        inputs: { VALUE: [1, [10, '']] },
        fields: { VARIABLE: ['Typed', '4igmfHjav6hZW:^ku?~1-Typed-'] },
        shadow: false,
        topLevel: false,
      },
    },
  },
  {
    name: 'tile-nested-boolean',
    source: 'Tile Based Game Tutorial Part 1.sb3',
    target: 'Tile Based Example',
    blocks: {
      ']j|_Q,#ccxj:L)Njhe`5': {
        opcode: 'operator_not',
        next: null,
        parent: null,
        inputs: { OPERAND: [2, '2|,C(%]={!tJxm:}a2iD'] },
        fields: {},
        shadow: false,
        topLevel: true,
      },
      '2|,C(%]={!tJxm:}a2iD': {
        opcode: 'operator_equals',
        next: null,
        parent: ']j|_Q,#ccxj:L)Njhe`5',
        inputs: {
          OPERAND1: [3, [12, 'color', 'U`n4]X[4eOLCvZTwXpd5-color-'], [10, '']],
          OPERAND2: [3, '4fBJRe!Z%j-8G3Bl0kx!', [10, '']],
        },
        fields: {},
        shadow: false,
        topLevel: false,
      },
      '4fBJRe!Z%j-8G3Bl0kx!': {
        opcode: 'data_itemoflist',
        next: null,
        parent: '2|,C(%]={!tJxm:}a2iD',
        inputs: { INDEX: [3, '5c;*lNy%IyAA2QKOMo6-', [7, 10]] },
        fields: { LIST: ['Level', 'ZKD4=Z%rX1]=b{Z%UxEe-Level-list'] },
        shadow: false,
        topLevel: false,
      },
      '5c;*lNy%IyAA2QKOMo6-': {
        opcode: 'argument_reporter_string_number',
        next: null,
        parent: '4fBJRe!Z%j-8G3Bl0kx!',
        inputs: {},
        fields: { VALUE: ['index'] },
        shadow: false,
        topLevel: false,
      },
    },
  },
  {
    name: 'bezier-broadcasts',
    source: 'Interactive Bézier Curve.sb3',
    target: 'Bézier',
    blocks: {
      '5,!C0u[z)jN/L6s*czuP': {
        opcode: 'event_whenflagclicked',
        next: 'FvC_@I[(pRzCS{Ep?mCI',
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 58,
        y: 77,
      },
      'FvC_@I[(pRzCS{Ep?mCI': {
        opcode: 'event_broadcastandwait',
        next: 'p|lS*m*Eni,=b4c|m|?4',
        parent: '5,!C0u[z)jN/L6s*czuP',
        inputs: { BROADCAST_INPUT: [1, [11, 'initial setup', 'broadcastMsgId-initial setup']] },
        fields: {},
        shadow: false,
        topLevel: false,
      },
      'p|lS*m*Eni,=b4c|m|?4': {
        opcode: 'event_broadcast',
        next: null,
        parent: 'FvC_@I[(pRzCS{Ep?mCI',
        inputs: { BROADCAST_INPUT: [1, [11, 'forever', 'broadcastMsgId-forever']] },
        fields: {},
        shadow: false,
        topLevel: false,
      },
    },
  },
];
