import type {
  Block,
  BlockInput,
  EmptyInput,
  Field,
  Input,
  NumberInput,
  ObscuredShadow,
  Script,
  StringInput,
} from '@scratch-code/ast';

export interface SemanticFixture {
  readonly name: string;
  readonly categories: readonly string[];
  readonly createAst: () => Script[];
  readonly scratchblocksText?: string;
}

const number = (value: string | number): NumberInput => ({ kind: 'input', type: 'number', value });
const string = (value: string): StringInput => ({ kind: 'input', type: 'string', value });
const empty = (): EmptyInput => ({ kind: 'input', type: 'empty' });
const field = (type: Field['type'], value: string, id?: string): Field =>
  ({
    kind: 'field',
    type,
    value,
    ...(id === undefined || (type !== 'variable' && type !== 'list' && type !== 'broadcast')
      ? {}
      : { id }),
  }) as Field;
const block = (
  opcode: string,
  inputs: Record<string, Input> = {},
  fields: Record<string, Field> = {},
): Block => ({ kind: 'block', opcode, inputs, fields });
const blockInput = (value: Block, obscuredShadow?: ObscuredShadow): BlockInput => ({
  kind: 'input',
  type: 'block',
  value,
  ...(obscuredShadow === undefined ? {} : { obscuredShadow }),
});
const scriptInput = (...blocks: Block[]): Input => ({
  kind: 'input',
  type: 'script',
  value: { kind: 'script', blocks },
});
const scripts = (...blocks: Block[]): Script[] => [{ kind: 'script', blocks }];

const variableReporter = (): Block =>
  block(
    'data_variable',
    {},
    {
      VARIABLE: field('variable', 'score', 'variable-id'),
    },
  );
const booleanReporter = (): Block =>
  block('operator_gt', {
    OPERAND1: blockInput(variableReporter()),
    OPERAND2: number(0),
  });
const say = (message = 'hello'): Block => block('looks_say', { MESSAGE: string(message) });

const procedureDefinition = (): Block => {
  const argumentIds = ['number-id', 'string-id', 'boolean-id'];
  const prototype = block(
    'procedures_prototype',
    Object.fromEntries(argumentIds.map((id) => [id, empty()])),
  );
  prototype.mutation = {
    type: 'procedure-prototype',
    proccode: 'mix %n %s %b',
    argumentIds,
    argumentNames: ['count', 'label', 'ready?'],
    argumentDefaults: [0, '', false],
    warp: false,
  };
  return block('procedures_definition', { custom_block: blockInput(prototype) });
};

const procedureCall = (returnType: 'statement' | 'reporter' | 'boolean' = 'statement'): Block => {
  const argumentIds = ['number-id', 'string-id', 'boolean-id'];
  const call = block('procedures_call', {
    'number-id': number(2),
    'string-id': string('value'),
    'boolean-id': blockInput(booleanReporter()),
  });
  call.mutation = {
    type: 'procedure-call',
    proccode: 'mix %n %s %b',
    argumentIds,
    warp: false,
    returnType,
  };
  return call;
};

export const semanticFixtures: readonly SemanticFixture[] = [
  {
    name: 'command-stack',
    categories: ['ordinary command stack'],
    createAst: () => scripts(block('motion_movesteps', { STEPS: number(10) }), say()),
    scratchblocksText: 'move (10) steps\nsay [hello]',
  },
  {
    name: 'number-literal-shadow',
    categories: ['number literal shadow'],
    createAst: () => scripts(block('motion_movesteps', { STEPS: number('0010') })),
    scratchblocksText: 'move (0010) steps',
  },
  {
    name: 'string-literal-shadow',
    categories: ['string literal shadow'],
    createAst: () => scripts(say('text')),
    scratchblocksText: 'say [text]',
  },
  {
    name: 'color-literal',
    categories: ['color literal'],
    createAst: () =>
      scripts(
        block('pen_setPenColorToColor', {
          COLOR: { kind: 'input', type: 'color', value: '#ff00aa' },
        }),
      ),
  },
  {
    name: 'note-literal',
    categories: ['note'],
    createAst: () =>
      scripts(
        block('music_playNoteForBeats', {
          NOTE: { kind: 'input', type: 'note', value: 60 },
          BEATS: number(0.5),
        }),
      ),
  },
  {
    name: 'matrix-literal',
    categories: ['matrix'],
    createAst: () =>
      scripts(
        block('microbit_displaySymbol', {
          MATRIX: { kind: 'input', type: 'matrix', value: '0101010101100010101000100' },
        }),
      ),
  },
  {
    name: 'nested-reporter',
    categories: ['nested reporter'],
    createAst: () =>
      scripts(
        block('motion_movesteps', {
          STEPS: blockInput(block('operator_add', { NUM1: number(1), NUM2: number(2) })),
        }),
      ),
    scratchblocksText: 'move ((1) + (2)) steps',
  },
  {
    name: 'reporter-over-primitive',
    categories: ['reporter covers primitive shadow'],
    createAst: () =>
      scripts(block('motion_movesteps', { STEPS: blockInput(variableReporter(), number(10)) })),
  },
  {
    name: 'menu-shadow',
    categories: ['menu shadow'],
    createAst: () =>
      scripts(
        block('motion_goto', {
          TO: blockInput(block('motion_goto_menu', {}, { TO: field('dropdown', '_random_') })),
        }),
      ),
    scratchblocksText: 'go to (random position v)',
  },
  {
    name: 'reporter-over-menu',
    categories: ['reporter covers menu shadow'],
    createAst: () =>
      scripts(
        block('sensing_touchingobject', {
          TOUCHINGOBJECTMENU: blockInput(
            variableReporter(),
            blockInput(
              block(
                'sensing_touchingobjectmenu',
                {},
                { TOUCHINGOBJECTMENU: field('dropdown', '_mouse_') },
              ),
            ),
          ),
        }),
      ),
  },
  {
    name: 'empty-boolean',
    categories: ['Empty boolean input'],
    createAst: () => scripts(block('operator_not', { OPERAND: empty() })),
    scratchblocksText: 'not <>',
  },
  {
    name: 'repeat-substack',
    categories: ['repeat', 'SUBSTACK'],
    createAst: () =>
      scripts(block('control_repeat', { TIMES: number(3), SUBSTACK: scriptInput(say('loop')) })),
    scratchblocksText: 'repeat (3)\n  say [loop]\nend',
  },
  {
    name: 'if',
    categories: ['if'],
    createAst: () =>
      scripts(
        block('control_if', {
          CONDITION: blockInput(booleanReporter()),
          SUBSTACK: scriptInput(say('yes')),
        }),
      ),
  },
  {
    name: 'if-else',
    categories: ['if/else'],
    createAst: () =>
      scripts(
        block('control_if_else', {
          CONDITION: blockInput(booleanReporter()),
          SUBSTACK: scriptInput(say('yes')),
          SUBSTACK2: scriptInput(say('no')),
        }),
      ),
  },
  {
    name: 'terminal',
    categories: ['terminal block'],
    createAst: () => scripts(block('control_stop', {}, { STOP_OPTION: field('dropdown', 'all') })),
    scratchblocksText: 'stop [all v]',
  },
  {
    name: 'event-hat',
    categories: ['event hat'],
    createAst: () => scripts(block('event_whenflagclicked'), say('start')),
    scratchblocksText: 'when green flag clicked\nsay [start]',
  },
  {
    name: 'define-hat',
    categories: ['define hat'],
    createAst: () => scripts(procedureDefinition()),
  },
  {
    name: 'variable',
    categories: ['variable field', 'variable reporter'],
    createAst: () =>
      scripts(
        block(
          'data_setvariableto',
          { VALUE: blockInput(variableReporter()) },
          { VARIABLE: field('variable', 'score', 'variable-id') },
        ),
      ),
    scratchblocksText: 'set [score v] to (score)',
  },
  {
    name: 'list',
    categories: ['list field', 'list reporter'],
    createAst: () =>
      scripts(
        block(
          'data_addtolist',
          {
            ITEM: blockInput(
              block('data_listcontents', {}, { LIST: field('list', 'items', 'list-id') }),
            ),
          },
          { LIST: field('list', 'items', 'list-id') },
        ),
      ),
  },
  {
    name: 'broadcast',
    categories: ['broadcast'],
    createAst: () =>
      scripts(
        block('event_broadcast', {
          BROADCAST_INPUT: blockInput(
            block(
              'event_broadcast_menu',
              {},
              {
                BROADCAST_OPTION: field('broadcast', 'message1', 'broadcast-id'),
              },
            ),
          ),
        }),
      ),
  },
  {
    name: 'procedure-definition',
    categories: ['custom procedure definition'],
    createAst: () => scripts(procedureDefinition()),
  },
  {
    name: 'procedure-call',
    categories: ['custom procedure call'],
    createAst: () => scripts(procedureDefinition(), procedureCall()),
  },
  {
    name: 'procedure-arguments',
    categories: ['procedure number/string/boolean arguments'],
    createAst: () => scripts(procedureDefinition(), procedureCall()),
  },
  {
    name: 'reporter-procedure',
    categories: ['reporter procedure'],
    createAst: () =>
      scripts(
        procedureDefinition(),
        block('looks_say', { MESSAGE: blockInput(procedureCall('reporter')) }),
      ),
  },
  {
    name: 'boolean-procedure',
    categories: ['boolean reporter procedure'],
    createAst: () =>
      scripts(
        procedureDefinition(),
        block('control_if', {
          CONDITION: blockInput(procedureCall('boolean')),
          SUBSTACK: scriptInput(say()),
        }),
      ),
  },
  {
    name: 'top-level-reporter',
    categories: ['top-level reporter'],
    createAst: () => scripts(variableReporter()),
    scratchblocksText: '(score)',
  },
  {
    name: 'disconnected-scripts',
    categories: ['disconnected scripts'],
    createAst: () => [
      { kind: 'script', blocks: [say('one')] },
      { kind: 'script', blocks: [say('two')] },
    ],
  },
  {
    name: 'extension-block',
    categories: ['extension block'],
    createAst: () =>
      scripts(block('music_playDrumForBeats', { DRUM: number(1), BEATS: number(0.25) })),
  },
  {
    name: 'comment',
    categories: ['comment'],
    createAst: () => {
      const ast = scripts(say('comment'));
      ast[0]!.blocks[0]!.metadata = { sb3: { version: 1, comment: 'comment-id' } };
      return ast;
    },
  },
  {
    name: 'scratchblocks-diff-glow',
    categories: ['scratchblocks diff/glow'],
    createAst: () => {
      const ast = scripts(say('changed'));
      ast[0]!.blocks[0]!.metadata = { scratchblocks: { version: 1, diff: '+', glow: true } };
      return ast;
    },
  },
];
