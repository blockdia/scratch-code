// Generated from the pinned scratch-blocks source. Do not edit by hand.
export const sourceRecords = [
  {
    opcode: 'argument_reporter_boolean',
    file: 'blocks_vertical/procedures.js',
    blockJson: {
      message0: ' %1',
      args0: [
        {
          type: 'field_label_serializable',
          name: 'VALUE',
          text: '',
        },
      ],
      extensions: ['colours_more', 'output_boolean'],
    },
  },
  {
    opcode: 'argument_reporter_string_number',
    file: 'blocks_vertical/procedures.js',
    blockJson: {
      message0: ' %1',
      args0: [
        {
          type: 'field_label_serializable',
          name: 'VALUE',
          text: '',
        },
      ],
      extensions: ['colours_more', 'output_number', 'output_string'],
    },
  },
  {
    opcode: 'colour_picker',
    file: 'blocks_common/colour.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_colour_slider',
          name: 'COLOUR',
          colour: '#037afb',
        },
      ],
      output: 'Colour',
    },
  },
  {
    opcode: 'control_all_at_once',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_ALLATONCE',
      message1: '%1',
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_clear_counter',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_CLEARCOUNTER',
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_create_clone_of',
    file: 'blocks_vertical/control.js',
    blockJson: {
      id: 'control_start_as_clone',
      message0: 'CONTROL_CREATECLONEOF',
      args0: [
        {
          type: 'input_value',
          name: 'CLONE_OPTION',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_create_clone_of_menu',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'CLONE_OPTION',
          options: [['CONTROL_CREATECLONEOF_MYSELF', '_myself_']],
        },
      ],
      extensions: ['colours_control', 'output_string'],
    },
  },
  {
    opcode: 'control_delete_this_clone',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_DELETETHISCLONE',
      args0: [],
      extensions: ['colours_control', 'shape_end'],
    },
  },
  {
    opcode: 'control_for_each',
    file: 'blocks_vertical/control.js',
    blockJson: {
      type: 'control_for_each',
      message0: 'CONTROL_FOREACH',
      message1: '%1',
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_forever',
    file: 'blocks_vertical/control.js',
    blockJson: {
      id: 'control_forever',
      message0: 'CONTROL_FOREVER',
      message1: '%1',
      message2: '%1',
      lastDummyAlign2: 'RIGHT',
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      args2: [
        {
          type: 'field_image',
          src: 'repeat.svg',
          width: 24,
          height: 24,
          alt: '*',
          flip_rtl: true,
        },
      ],
      extensions: ['colours_control', 'shape_end'],
    },
  },
  {
    opcode: 'control_get_counter',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_COUNTER',
      extensions: ['colours_control', 'output_number'],
    },
  },
  {
    opcode: 'control_if',
    file: 'blocks_vertical/control.js',
    blockJson: {
      type: 'control_if',
      message0: 'CONTROL_IF',
      message1: '%1',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean',
        },
      ],
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_if_else',
    file: 'blocks_vertical/control.js',
    blockJson: {
      type: 'control_if_else',
      message0: 'CONTROL_IF',
      message1: '%1',
      message2: 'CONTROL_ELSE',
      message3: '%1',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean',
        },
      ],
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      args3: [
        {
          type: 'input_statement',
          name: 'SUBSTACK2',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_incr_counter',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_INCRCOUNTER',
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_repeat',
    file: 'blocks_vertical/control.js',
    blockJson: {
      id: 'control_repeat',
      message0: 'CONTROL_REPEAT',
      message1: '%1',
      message2: '%1',
      lastDummyAlign2: 'RIGHT',
      args0: [
        {
          type: 'input_value',
          name: 'TIMES',
        },
      ],
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      args2: [
        {
          type: 'field_image',
          src: 'repeat.svg',
          width: 24,
          height: 24,
          alt: '*',
          flip_rtl: true,
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_repeat_until',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_REPEATUNTIL',
      message1: '%1',
      message2: '%1',
      lastDummyAlign2: 'RIGHT',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean',
        },
      ],
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      args2: [
        {
          type: 'field_image',
          src: 'repeat.svg',
          width: 24,
          height: 24,
          alt: '*',
          flip_rtl: true,
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_start_as_clone',
    file: 'blocks_vertical/control.js',
    blockJson: {
      id: 'control_start_as_clone',
      message0: 'CONTROL_STARTASCLONE',
      args0: [],
      extensions: ['colours_control', 'shape_hat'],
    },
  },
  {
    opcode: 'control_stop',
    file: 'blocks_vertical/control.js',
    blockJson: null,
  },
  {
    opcode: 'control_wait',
    file: 'blocks_vertical/control.js',
    blockJson: {
      id: 'control_wait',
      message0: 'CONTROL_WAIT',
      args0: [
        {
          type: 'input_value',
          name: 'DURATION',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_wait_until',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_WAITUNTIL',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean',
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'control_while',
    file: 'blocks_vertical/control.js',
    blockJson: {
      message0: 'CONTROL_WHILE',
      message1: '%1',
      message2: '%1',
      lastDummyAlign2: 'RIGHT',
      args0: [
        {
          type: 'input_value',
          name: 'CONDITION',
          check: 'Boolean',
        },
      ],
      args1: [
        {
          type: 'input_statement',
          name: 'SUBSTACK',
        },
      ],
      args2: [
        {
          type: 'field_image',
          src: 'repeat.svg',
          width: 24,
          height: 24,
          alt: '*',
          flip_rtl: true,
        },
      ],
      extensions: ['colours_control', 'shape_statement'],
    },
  },
  {
    opcode: 'data_addtolist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_ADDTOLIST',
      args0: [
        {
          type: 'input_value',
          name: 'ITEM',
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_changevariableby',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_CHANGEVARIABLEBY',
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_data', 'shape_statement'],
    },
  },
  {
    opcode: 'data_deletealloflist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_DELETEALLOFLIST',
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_deleteoflist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_DELETEOFLIST',
      args0: [
        {
          type: 'input_value',
          name: 'INDEX',
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_hidelist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_HIDELIST',
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_hidevariable',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_HIDEVARIABLE',
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      extensions: ['colours_data'],
    },
  },
  {
    opcode: 'data_insertatlist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_INSERTATLIST',
      args0: [
        {
          type: 'input_value',
          name: 'ITEM',
        },
        {
          type: 'input_value',
          name: 'INDEX',
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_itemnumoflist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_ITEMNUMOFLIST',
      args0: [
        {
          type: 'input_value',
          name: 'ITEM',
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      output: null,
      extensions: ['colours_data_lists'],
    },
  },
  {
    opcode: 'data_itemoflist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_ITEMOFLIST',
      args0: [
        {
          type: 'input_value',
          name: 'INDEX',
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      output: null,
      extensions: ['colours_data_lists'],
    },
  },
  {
    opcode: 'data_lengthoflist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_LENGTHOFLIST',
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'output_number'],
    },
  },
  {
    opcode: 'data_listcontainsitem',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_LISTCONTAINSITEM',
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
        {
          type: 'input_value',
          name: 'ITEM',
        },
      ],
      extensions: ['colours_data_lists', 'output_boolean'],
    },
  },
  {
    opcode: 'data_listcontents',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_variable_getter',
          text: '',
          name: 'LIST',
        },
      ],
      extensions: ['contextMenu_getListBlock', 'colours_data_lists', 'output_string'],
      checkboxInFlyout: true,
    },
  },
  {
    opcode: 'data_listindexall',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_numberdropdown',
          name: 'INDEX',
          value: '1',
          min: 1,
          precision: 1,
          options: [
            ['1', '1'],
            ['DATA_INDEX_LAST', 'last'],
            ['DATA_INDEX_ALL', 'all'],
          ],
        },
      ],
      extensions: ['colours_textfield', 'output_string'],
    },
  },
  {
    opcode: 'data_listindexrandom',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_numberdropdown',
          name: 'INDEX',
          value: '1',
          min: 1,
          precision: 1,
          options: [
            ['1', '1'],
            ['DATA_INDEX_LAST', 'last'],
            ['DATA_INDEX_RANDOM', 'random'],
          ],
        },
      ],
      extensions: ['colours_textfield', 'output_string'],
    },
  },
  {
    opcode: 'data_replaceitemoflist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_REPLACEITEMOFLIST',
      args0: [
        {
          type: 'input_value',
          name: 'INDEX',
        },
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
        {
          type: 'input_value',
          name: 'ITEM',
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_setvariableto',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_SETVARIABLETO',
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_data', 'shape_statement'],
    },
  },
  {
    opcode: 'data_showlist',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_SHOWLIST',
      args0: [
        {
          type: 'field_variable',
          name: 'LIST',
          variableTypes: [null],
        },
      ],
      extensions: ['colours_data_lists', 'shape_statement'],
    },
  },
  {
    opcode: 'data_showvariable',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: 'DATA_SHOWVARIABLE',
      args0: [
        {
          type: 'field_variable',
          name: 'VARIABLE',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      extensions: ['colours_data'],
    },
  },
  {
    opcode: 'data_variable',
    file: 'blocks_vertical/data.js',
    blockJson: {
      message0: '%1',
      lastDummyAlign0: 'CENTRE',
      args0: [
        {
          type: 'field_variable_getter',
          text: '',
          name: 'VARIABLE',
          variableType: '',
        },
      ],
      checkboxInFlyout: true,
      extensions: ['contextMenu_getVariableBlock', 'colours_data', 'output_string'],
    },
  },
  {
    opcode: 'event_broadcast',
    file: 'blocks_vertical/event.js',
    blockJson: {
      id: 'event_broadcast',
      message0: 'EVENT_BROADCAST',
      args0: [
        {
          type: 'input_value',
          name: 'BROADCAST_INPUT',
        },
      ],
      extensions: ['colours_event', 'shape_statement'],
    },
  },
  {
    opcode: 'event_broadcast_menu',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_variable',
          name: 'BROADCAST_OPTION',
          variableTypes: [null],
          variable: 'DEFAULT_BROADCAST_MESSAGE_NAME',
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'event_broadcastandwait',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: 'EVENT_BROADCASTANDWAIT',
      args0: [
        {
          type: 'input_value',
          name: 'BROADCAST_INPUT',
        },
      ],
      extensions: ['colours_event', 'shape_statement'],
    },
  },
  {
    opcode: 'event_touchingobjectmenu',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TOUCHINGOBJECTMENU',
          options: [
            ['SENSING_TOUCHINGOBJECT_POINTER', '_mouse_'],
            ['SENSING_TOUCHINGOBJECT_EDGE', '_edge_'],
          ],
        },
      ],
      extensions: ['colours_event', 'output_string'],
    },
  },
  {
    opcode: 'event_whenbackdropswitchesto',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: 'EVENT_WHENBACKDROPSWITCHESTO',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BACKDROP',
          options: [['backdrop1', 'BACKDROP1']],
        },
      ],
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whenbroadcastreceived',
    file: 'blocks_vertical/event.js',
    blockJson: {
      id: 'event_whenbroadcastreceived',
      message0: 'EVENT_WHENBROADCASTRECEIVED',
      args0: [
        {
          type: 'field_variable',
          name: 'BROADCAST_OPTION',
          variableTypes: [null],
          variable: 'DEFAULT_BROADCAST_MESSAGE_NAME',
        },
      ],
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whenflagclicked',
    file: 'blocks_vertical/event.js',
    blockJson: {
      id: 'event_whenflagclicked',
      message0: 'EVENT_WHENFLAGCLICKED',
      args0: [
        {
          type: 'field_image',
          src: 'green-flag.svg',
          width: 24,
          height: 24,
          alt: 'flag',
        },
      ],
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whengreaterthan',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: 'EVENT_WHENGREATERTHAN',
      args0: [
        {
          type: 'field_dropdown',
          name: 'WHENGREATERTHANMENU',
          options: [
            ['EVENT_WHENGREATERTHAN_LOUDNESS', 'LOUDNESS'],
            ['EVENT_WHENGREATERTHAN_TIMER', 'TIMER'],
          ],
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whenkeypressed',
    file: 'blocks_vertical/event.js',
    blockJson: {
      id: 'event_whenkeypressed',
      message0: 'EVENT_WHENKEYPRESSED',
      args0: [
        {
          type: 'field_dropdown',
          name: 'KEY_OPTION',
          options: [
            ['EVENT_WHENKEYPRESSED_SPACE', 'space'],
            ['EVENT_WHENKEYPRESSED_UP', 'up arrow'],
            ['EVENT_WHENKEYPRESSED_DOWN', 'down arrow'],
            ['EVENT_WHENKEYPRESSED_RIGHT', 'right arrow'],
            ['EVENT_WHENKEYPRESSED_LEFT', 'left arrow'],
            ['EVENT_WHENKEYPRESSED_ANY', 'any'],
            ['a', 'a'],
            ['b', 'b'],
            ['c', 'c'],
            ['d', 'd'],
            ['e', 'e'],
            ['f', 'f'],
            ['g', 'g'],
            ['h', 'h'],
            ['i', 'i'],
            ['j', 'j'],
            ['k', 'k'],
            ['l', 'l'],
            ['m', 'm'],
            ['n', 'n'],
            ['o', 'o'],
            ['p', 'p'],
            ['q', 'q'],
            ['r', 'r'],
            ['s', 's'],
            ['t', 't'],
            ['u', 'u'],
            ['v', 'v'],
            ['w', 'w'],
            ['x', 'x'],
            ['y', 'y'],
            ['z', 'z'],
            ['0', '0'],
            ['1', '1'],
            ['2', '2'],
            ['3', '3'],
            ['4', '4'],
            ['5', '5'],
            ['6', '6'],
            ['7', '7'],
            ['8', '8'],
            ['9', '9'],
          ],
        },
      ],
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whenstageclicked',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: 'EVENT_WHENSTAGECLICKED',
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whenthisspriteclicked',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: 'EVENT_WHENTHISSPRITECLICKED',
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'event_whentouchingobject',
    file: 'blocks_vertical/event.js',
    blockJson: {
      message0: 'EVENT_WHENTOUCHINGOBJECT',
      args0: [
        {
          type: 'input_value',
          name: 'TOUCHINGOBJECTMENU',
        },
      ],
      extensions: ['colours_event', 'shape_hat'],
    },
  },
  {
    opcode: 'looks_backdropnumbername',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_BACKDROPNUMBERNAME',
      args0: [
        {
          type: 'field_dropdown',
          name: 'NUMBER_NAME',
          options: [
            ['LOOKS_NUMBERNAME_NUMBER', 'number'],
            ['LOOKS_NUMBERNAME_NAME', 'name'],
          ],
        },
      ],
      checkboxInFlyout: true,
      extensions: ['colours_looks', 'output_number'],
    },
  },
  {
    opcode: 'looks_backdrops',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      id: 'looks_backdrops',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BACKDROP',
          options: [['backdrop1', 'BACKDROP1']],
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'looks_changeeffectby',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_CHANGEEFFECTBY',
      args0: [
        {
          type: 'field_dropdown',
          name: 'EFFECT',
          options: [
            ['LOOKS_EFFECT_COLOR', 'COLOR'],
            ['LOOKS_EFFECT_FISHEYE', 'FISHEYE'],
            ['LOOKS_EFFECT_WHIRL', 'WHIRL'],
            ['LOOKS_EFFECT_PIXELATE', 'PIXELATE'],
            ['LOOKS_EFFECT_MOSAIC', 'MOSAIC'],
            ['LOOKS_EFFECT_BRIGHTNESS', 'BRIGHTNESS'],
            ['LOOKS_EFFECT_GHOST', 'GHOST'],
          ],
        },
        {
          type: 'input_value',
          name: 'CHANGE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_changesizeby',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_CHANGESIZEBY',
      args0: [
        {
          type: 'input_value',
          name: 'CHANGE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_changestretchby',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_CHANGESTRETCHBY',
      args0: [
        {
          type: 'input_value',
          name: 'CHANGE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_cleargraphiceffects',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_CLEARGRAPHICEFFECTS',
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_costume',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'COSTUME',
          options: [
            ['costume1', 'COSTUME1'],
            ['costume2', 'COSTUME2'],
          ],
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'looks_costumenumbername',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_COSTUMENUMBERNAME',
      args0: [
        {
          type: 'field_dropdown',
          name: 'NUMBER_NAME',
          options: [
            ['LOOKS_NUMBERNAME_NUMBER', 'number'],
            ['LOOKS_NUMBERNAME_NAME', 'name'],
          ],
        },
      ],
      checkboxInFlyout: true,
      extensions: ['colours_looks', 'output_number'],
    },
  },
  {
    opcode: 'looks_goforwardbackwardlayers',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_GOFORWARDBACKWARDLAYERS',
      args0: [
        {
          type: 'field_dropdown',
          name: 'FORWARD_BACKWARD',
          options: [
            ['LOOKS_GOFORWARDBACKWARDLAYERS_FORWARD', 'forward'],
            ['LOOKS_GOFORWARDBACKWARDLAYERS_BACKWARD', 'backward'],
          ],
        },
        {
          type: 'input_value',
          name: 'NUM',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_gotofrontback',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_GOTOFRONTBACK',
      args0: [
        {
          type: 'field_dropdown',
          name: 'FRONT_BACK',
          options: [
            ['LOOKS_GOTOFRONTBACK_FRONT', 'front'],
            ['LOOKS_GOTOFRONTBACK_BACK', 'back'],
          ],
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_hide',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_HIDE',
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_hideallsprites',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_HIDEALLSPRITES',
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_nextbackdrop',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_NEXTBACKDROP_BLOCK',
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_nextcostume',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_NEXTCOSTUME',
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_say',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SAY',
      args0: [
        {
          type: 'input_value',
          name: 'MESSAGE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_sayforsecs',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SAYFORSECS',
      args0: [
        {
          type: 'input_value',
          name: 'MESSAGE',
        },
        {
          type: 'input_value',
          name: 'SECS',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_seteffectto',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SETEFFECTTO',
      args0: [
        {
          type: 'field_dropdown',
          name: 'EFFECT',
          options: [
            ['LOOKS_EFFECT_COLOR', 'COLOR'],
            ['LOOKS_EFFECT_FISHEYE', 'FISHEYE'],
            ['LOOKS_EFFECT_WHIRL', 'WHIRL'],
            ['LOOKS_EFFECT_PIXELATE', 'PIXELATE'],
            ['LOOKS_EFFECT_MOSAIC', 'MOSAIC'],
            ['LOOKS_EFFECT_BRIGHTNESS', 'BRIGHTNESS'],
            ['LOOKS_EFFECT_GHOST', 'GHOST'],
          ],
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_setsizeto',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SETSIZETO',
      args0: [
        {
          type: 'input_value',
          name: 'SIZE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_setstretchto',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SETSTRETCHTO',
      args0: [
        {
          type: 'input_value',
          name: 'STRETCH',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_show',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SHOW',
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_size',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SIZE',
      checkboxInFlyout: true,
      extensions: ['colours_looks', 'output_number'],
    },
  },
  {
    opcode: 'looks_switchbackdropto',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SWITCHBACKDROPTO',
      args0: [
        {
          type: 'input_value',
          name: 'BACKDROP',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_switchbackdroptoandwait',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SWITCHBACKDROPTOANDWAIT',
      args0: [
        {
          type: 'input_value',
          name: 'BACKDROP',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_switchcostumeto',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_SWITCHCOSTUMETO',
      args0: [
        {
          type: 'input_value',
          name: 'COSTUME',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_think',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_THINK',
      args0: [
        {
          type: 'input_value',
          name: 'MESSAGE',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'looks_thinkforsecs',
    file: 'blocks_vertical/looks.js',
    blockJson: {
      message0: 'LOOKS_THINKFORSECS',
      args0: [
        {
          type: 'input_value',
          name: 'MESSAGE',
        },
        {
          type: 'input_value',
          name: 'SECS',
        },
      ],
      extensions: ['colours_looks', 'shape_statement'],
    },
  },
  {
    opcode: 'math_angle',
    file: 'blocks_common/math.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_angle',
          name: 'NUM',
          value: 90,
        },
      ],
      output: 'Number',
    },
  },
  {
    opcode: 'math_integer',
    file: 'blocks_common/math.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_number',
          name: 'NUM',
          precision: 1,
        },
      ],
      output: 'Number',
    },
  },
  {
    opcode: 'math_number',
    file: 'blocks_common/math.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_number',
          name: 'NUM',
          value: '0',
        },
      ],
      output: 'Number',
    },
  },
  {
    opcode: 'math_positive_number',
    file: 'blocks_common/math.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_number',
          name: 'NUM',
          min: 0,
        },
      ],
      output: 'Number',
    },
  },
  {
    opcode: 'math_whole_number',
    file: 'blocks_common/math.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_number',
          name: 'NUM',
          min: 0,
          precision: 1,
        },
      ],
      output: 'Number',
    },
  },
  {
    opcode: 'matrix',
    file: 'blocks_common/matrix.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_matrix',
          name: 'MATRIX',
        },
      ],
      output: 'Number',
      extensions: ['colours_pen'],
    },
  },
  {
    opcode: 'motion_align_scene',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_ALIGNSCENE',
      args0: [
        {
          type: 'field_dropdown',
          name: 'ALIGNMENT',
          options: [
            ['MOTION_ALIGNSCENE_BOTTOMLEFT', 'bottom-left'],
            ['MOTION_ALIGNSCENE_BOTTOMRIGHT', 'bottom-right'],
            ['MOTION_ALIGNSCENE_MIDDLE', 'middle'],
            ['MOTION_ALIGNSCENE_TOPLEFT', 'top-left'],
            ['MOTION_ALIGNSCENE_TOPRIGHT', 'top-right'],
          ],
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_changexby',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_CHANGEXBY',
      args0: [
        {
          type: 'input_value',
          name: 'DX',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_changeyby',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_CHANGEYBY',
      args0: [
        {
          type: 'input_value',
          name: 'DY',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_direction',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_DIRECTION',
      checkboxInFlyout: true,
      extensions: ['colours_motion', 'output_number'],
    },
  },
  {
    opcode: 'motion_glidesecstoxy',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_GLIDESECSTOXY',
      args0: [
        {
          type: 'input_value',
          name: 'SECS',
        },
        {
          type: 'input_value',
          name: 'X',
        },
        {
          type: 'input_value',
          name: 'Y',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_glideto',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_GLIDETO',
      args0: [
        {
          type: 'input_value',
          name: 'SECS',
        },
        {
          type: 'input_value',
          name: 'TO',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_glideto_menu',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TO',
          options: [
            ['MOTION_GLIDETO_POINTER', '_mouse_'],
            ['MOTION_GLIDETO_RANDOM', '_random_'],
          ],
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'motion_goto',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_GOTO',
      args0: [
        {
          type: 'input_value',
          name: 'TO',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_goto_menu',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TO',
          options: [
            ['MOTION_GOTO_POINTER', '_mouse_'],
            ['MOTION_GOTO_RANDOM', '_random_'],
          ],
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'motion_gotoxy',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_GOTOXY',
      args0: [
        {
          type: 'input_value',
          name: 'X',
        },
        {
          type: 'input_value',
          name: 'Y',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_ifonedgebounce',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_IFONEDGEBOUNCE',
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_movesteps',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_MOVESTEPS',
      args0: [
        {
          type: 'input_value',
          name: 'STEPS',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_pointindirection',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_POINTINDIRECTION',
      args0: [
        {
          type: 'input_value',
          name: 'DIRECTION',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_pointtowards',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_POINTTOWARDS',
      args0: [
        {
          type: 'input_value',
          name: 'TOWARDS',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_pointtowards_menu',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TOWARDS',
          options: [
            ['MOTION_POINTTOWARDS_POINTER', '_mouse_'],
            ['MOTION_POINTTOWARDS_RANDOM', '_random_'],
          ],
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'motion_scroll_right',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_SCROLLRIGHT',
      args0: [
        {
          type: 'input_value',
          name: 'DISTANCE',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_scroll_up',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_SCROLLUP',
      args0: [
        {
          type: 'input_value',
          name: 'DISTANCE',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_setrotationstyle',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_SETROTATIONSTYLE',
      args0: [
        {
          type: 'field_dropdown',
          name: 'STYLE',
          options: [
            ['MOTION_SETROTATIONSTYLE_LEFTRIGHT', 'left-right'],
            ['MOTION_SETROTATIONSTYLE_DONTROTATE', "don't rotate"],
            ['MOTION_SETROTATIONSTYLE_ALLAROUND', 'all around'],
          ],
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_setx',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_SETX',
      args0: [
        {
          type: 'input_value',
          name: 'X',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_sety',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_SETY',
      args0: [
        {
          type: 'input_value',
          name: 'Y',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_turnleft',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_TURNLEFT',
      args0: [
        {
          type: 'field_image',
          src: 'rotate-left.svg',
          width: 24,
          height: 24,
        },
        {
          type: 'input_value',
          name: 'DEGREES',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_turnright',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_TURNRIGHT',
      args0: [
        {
          type: 'field_image',
          src: 'rotate-right.svg',
          width: 24,
          height: 24,
        },
        {
          type: 'input_value',
          name: 'DEGREES',
        },
      ],
      extensions: ['colours_motion', 'shape_statement'],
    },
  },
  {
    opcode: 'motion_xposition',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_XPOSITION',
      checkboxInFlyout: true,
      extensions: ['colours_motion', 'output_number'],
    },
  },
  {
    opcode: 'motion_xscroll',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_XSCROLL',
      extensions: ['colours_motion', 'output_number'],
    },
  },
  {
    opcode: 'motion_yposition',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_YPOSITION',
      checkboxInFlyout: true,
      extensions: ['colours_motion', 'output_number'],
    },
  },
  {
    opcode: 'motion_yscroll',
    file: 'blocks_vertical/motion.js',
    blockJson: {
      message0: 'MOTION_YSCROLL',
      extensions: ['colours_motion', 'output_number'],
    },
  },
  {
    opcode: 'note',
    file: 'blocks_common/note.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_note',
          name: 'NOTE',
          value: 60,
        },
      ],
      output: 'Number',
    },
  },
  {
    opcode: 'operator_add',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_ADD',
      args0: [
        {
          type: 'input_value',
          name: 'NUM1',
        },
        {
          type: 'input_value',
          name: 'NUM2',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_and',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_AND',
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
          check: 'Boolean',
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
          check: 'Boolean',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_contains',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_CONTAINS',
      args0: [
        {
          type: 'input_value',
          name: 'STRING1',
        },
        {
          type: 'input_value',
          name: 'STRING2',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_divide',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_DIVIDE',
      args0: [
        {
          type: 'input_value',
          name: 'NUM1',
        },
        {
          type: 'input_value',
          name: 'NUM2',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_equals',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_EQUALS',
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_gt',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_GT',
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_join',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_JOIN',
      args0: [
        {
          type: 'input_value',
          name: 'STRING1',
        },
        {
          type: 'input_value',
          name: 'STRING2',
        },
      ],
      extensions: ['colours_operators', 'output_string'],
    },
  },
  {
    opcode: 'operator_length',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_LENGTH',
      args0: [
        {
          type: 'input_value',
          name: 'STRING',
        },
      ],
      extensions: ['colours_operators', 'output_string'],
    },
  },
  {
    opcode: 'operator_letter_of',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_LETTEROF',
      args0: [
        {
          type: 'input_value',
          name: 'LETTER',
        },
        {
          type: 'input_value',
          name: 'STRING',
        },
      ],
      extensions: ['colours_operators', 'output_string'],
    },
  },
  {
    opcode: 'operator_lt',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_LT',
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_mathop',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_MATHOP',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OPERATOR',
          options: [
            ['OPERATORS_MATHOP_ABS', 'abs'],
            ['OPERATORS_MATHOP_FLOOR', 'floor'],
            ['OPERATORS_MATHOP_CEILING', 'ceiling'],
            ['OPERATORS_MATHOP_SQRT', 'sqrt'],
            ['OPERATORS_MATHOP_SIN', 'sin'],
            ['OPERATORS_MATHOP_COS', 'cos'],
            ['OPERATORS_MATHOP_TAN', 'tan'],
            ['OPERATORS_MATHOP_ASIN', 'asin'],
            ['OPERATORS_MATHOP_ACOS', 'acos'],
            ['OPERATORS_MATHOP_ATAN', 'atan'],
            ['OPERATORS_MATHOP_LN', 'ln'],
            ['OPERATORS_MATHOP_LOG', 'log'],
            ['OPERATORS_MATHOP_EEXP', 'e ^'],
            ['OPERATORS_MATHOP_10EXP', '10 ^'],
          ],
        },
        {
          type: 'input_value',
          name: 'NUM',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_mod',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_MOD',
      args0: [
        {
          type: 'input_value',
          name: 'NUM1',
        },
        {
          type: 'input_value',
          name: 'NUM2',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_multiply',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_MULTIPLY',
      args0: [
        {
          type: 'input_value',
          name: 'NUM1',
        },
        {
          type: 'input_value',
          name: 'NUM2',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_not',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_NOT',
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND',
          check: 'Boolean',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_or',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_OR',
      args0: [
        {
          type: 'input_value',
          name: 'OPERAND1',
          check: 'Boolean',
        },
        {
          type: 'input_value',
          name: 'OPERAND2',
          check: 'Boolean',
        },
      ],
      extensions: ['colours_operators', 'output_boolean'],
    },
  },
  {
    opcode: 'operator_random',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_RANDOM',
      args0: [
        {
          type: 'input_value',
          name: 'FROM',
        },
        {
          type: 'input_value',
          name: 'TO',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_round',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_ROUND',
      args0: [
        {
          type: 'input_value',
          name: 'NUM',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'operator_subtract',
    file: 'blocks_vertical/operators.js',
    blockJson: {
      message0: 'OPERATORS_SUBTRACT',
      args0: [
        {
          type: 'input_value',
          name: 'NUM1',
        },
        {
          type: 'input_value',
          name: 'NUM2',
        },
      ],
      extensions: ['colours_operators', 'output_number'],
    },
  },
  {
    opcode: 'procedures_call',
    file: 'blocks_vertical/procedures.js',
    blockJson: {
      extensions: ['colours_more', 'procedure_call_contextmenu'],
    },
  },
  {
    opcode: 'procedures_definition',
    file: 'blocks_vertical/procedures.js',
    blockJson: {
      message0: 'PROCEDURES_DEFINITION',
      args0: [
        {
          type: 'input_statement',
          name: 'custom_block',
        },
      ],
      extensions: ['colours_more', 'shape_hat', 'procedure_def_contextmenu'],
    },
  },
  {
    opcode: 'procedures_prototype',
    file: 'blocks_vertical/procedures.js',
    blockJson: {
      extensions: ['colours_more', 'shape_statement'],
    },
  },
  {
    opcode: 'procedures_return',
    file: 'blocks_vertical/procedures.js',
    blockJson: {
      message0: 'PROCEDURES_RETURN',
      args0: [
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_more', 'shape_end'],
    },
  },
  {
    opcode: 'sensing_answer',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_ANSWER',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_askandwait',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_ASKANDWAIT',
      args0: [
        {
          type: 'input_value',
          name: 'QUESTION',
        },
      ],
      extensions: ['colours_sensing', 'shape_statement'],
    },
  },
  {
    opcode: 'sensing_coloristouchingcolor',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_COLORISTOUCHINGCOLOR',
      args0: [
        {
          type: 'input_value',
          name: 'COLOR',
        },
        {
          type: 'input_value',
          name: 'COLOR2',
        },
      ],
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_current',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_CURRENT',
      args0: [
        {
          type: 'field_dropdown',
          name: 'CURRENTMENU',
          options: [
            ['SENSING_CURRENT_YEAR', 'YEAR'],
            ['SENSING_CURRENT_MONTH', 'MONTH'],
            ['SENSING_CURRENT_DATE', 'DATE'],
            ['SENSING_CURRENT_DAYOFWEEK', 'DAYOFWEEK'],
            ['SENSING_CURRENT_HOUR', 'HOUR'],
            ['SENSING_CURRENT_MINUTE', 'MINUTE'],
            ['SENSING_CURRENT_SECOND', 'SECOND'],
          ],
        },
      ],
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_dayssince2000',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_DAYSSINCE2000',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_distanceto',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_DISTANCETO',
      args0: [
        {
          type: 'input_value',
          name: 'DISTANCETOMENU',
        },
      ],
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_distancetomenu',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DISTANCETOMENU',
          options: [['SENSING_DISTANCETO_POINTER', '_mouse_']],
        },
      ],
      extensions: ['colours_sensing', 'output_string'],
    },
  },
  {
    opcode: 'sensing_keyoptions',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'KEY_OPTION',
          options: [
            ['EVENT_WHENKEYPRESSED_SPACE', 'space'],
            ['EVENT_WHENKEYPRESSED_UP', 'up arrow'],
            ['EVENT_WHENKEYPRESSED_DOWN', 'down arrow'],
            ['EVENT_WHENKEYPRESSED_RIGHT', 'right arrow'],
            ['EVENT_WHENKEYPRESSED_LEFT', 'left arrow'],
            ['EVENT_WHENKEYPRESSED_ANY', 'any'],
            ['a', 'a'],
            ['b', 'b'],
            ['c', 'c'],
            ['d', 'd'],
            ['e', 'e'],
            ['f', 'f'],
            ['g', 'g'],
            ['h', 'h'],
            ['i', 'i'],
            ['j', 'j'],
            ['k', 'k'],
            ['l', 'l'],
            ['m', 'm'],
            ['n', 'n'],
            ['o', 'o'],
            ['p', 'p'],
            ['q', 'q'],
            ['r', 'r'],
            ['s', 's'],
            ['t', 't'],
            ['u', 'u'],
            ['v', 'v'],
            ['w', 'w'],
            ['x', 'x'],
            ['y', 'y'],
            ['z', 'z'],
            ['0', '0'],
            ['1', '1'],
            ['2', '2'],
            ['3', '3'],
            ['4', '4'],
            ['5', '5'],
            ['6', '6'],
            ['7', '7'],
            ['8', '8'],
            ['9', '9'],
          ],
        },
      ],
      extensions: ['colours_sensing', 'output_string'],
    },
  },
  {
    opcode: 'sensing_keypressed',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_KEYPRESSED',
      args0: [
        {
          type: 'input_value',
          name: 'KEY_OPTION',
        },
      ],
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_loud',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_LOUD',
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_loudness',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_LOUDNESS',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_mousedown',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_MOUSEDOWN',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_mousex',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_MOUSEX',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_mousey',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_MOUSEY',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_of',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_OF',
      args0: [
        {
          type: 'field_dropdown',
          name: 'PROPERTY',
          options: [
            ['SENSING_OF_XPOSITION', 'x position'],
            ['SENSING_OF_YPOSITION', 'y position'],
            ['SENSING_OF_DIRECTION', 'direction'],
            ['SENSING_OF_COSTUMENUMBER', 'costume #'],
            ['SENSING_OF_COSTUMENAME', 'costume name'],
            ['SENSING_OF_SIZE', 'size'],
            ['SENSING_OF_VOLUME', 'volume'],
            ['SENSING_OF_BACKDROPNUMBER', 'backdrop #'],
            ['SENSING_OF_BACKDROPNAME', 'backdrop name'],
          ],
        },
        {
          type: 'input_value',
          name: 'OBJECT',
        },
      ],
      output: true,
      extensions: ['colours_sensing'],
    },
  },
  {
    opcode: 'sensing_of_object_menu',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'OBJECT',
          options: [
            ['Sprite1', 'Sprite1'],
            ['Stage', '_stage_'],
          ],
        },
      ],
      extensions: ['colours_sensing', 'output_string'],
    },
  },
  {
    opcode: 'sensing_online',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'online?',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_resettimer',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_RESETTIMER',
      extensions: ['colours_sensing', 'shape_statement'],
    },
  },
  {
    opcode: 'sensing_setdragmode',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_SETDRAGMODE',
      args0: [
        {
          type: 'field_dropdown',
          name: 'DRAG_MODE',
          options: [
            ['SENSING_SETDRAGMODE_DRAGGABLE', 'draggable'],
            ['SENSING_SETDRAGMODE_NOTDRAGGABLE', 'not draggable'],
          ],
        },
      ],
      extensions: ['colours_sensing', 'shape_statement'],
    },
  },
  {
    opcode: 'sensing_timer',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_TIMER',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_touchingcolor',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_TOUCHINGCOLOR',
      args0: [
        {
          type: 'input_value',
          name: 'COLOR',
        },
      ],
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_touchingobject',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_TOUCHINGOBJECT',
      args0: [
        {
          type: 'input_value',
          name: 'TOUCHINGOBJECTMENU',
        },
      ],
      extensions: ['colours_sensing', 'output_boolean'],
    },
  },
  {
    opcode: 'sensing_touchingobjectmenu',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TOUCHINGOBJECTMENU',
          options: [
            ['SENSING_TOUCHINGOBJECT_POINTER', '_mouse_'],
            ['SENSING_TOUCHINGOBJECT_EDGE', '_edge_'],
          ],
        },
      ],
      extensions: ['colours_sensing', 'output_string'],
    },
  },
  {
    opcode: 'sensing_userid',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_USERID',
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sensing_username',
    file: 'blocks_vertical/sensing.js',
    blockJson: {
      message0: 'SENSING_USERNAME',
      checkboxInFlyout: true,
      extensions: ['colours_sensing', 'output_number'],
    },
  },
  {
    opcode: 'sound_changeeffectby',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_CHANGEEFFECTBY',
      args0: [
        {
          type: 'field_dropdown',
          name: 'EFFECT',
          options: [
            ['SOUND_EFFECTS_PITCH', 'PITCH'],
            ['SOUND_EFFECTS_PAN', 'PAN'],
          ],
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_changevolumeby',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_CHANGEVOLUMEBY',
      args0: [
        {
          type: 'input_value',
          name: 'VOLUME',
        },
      ],
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_cleareffects',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_CLEAREFFECTS',
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_play',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_PLAY',
      args0: [
        {
          type: 'input_value',
          name: 'SOUND_MENU',
        },
      ],
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_playuntildone',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_PLAYUNTILDONE',
      args0: [
        {
          type: 'input_value',
          name: 'SOUND_MENU',
        },
      ],
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_seteffectto',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_SETEFFECTO',
      args0: [
        {
          type: 'field_dropdown',
          name: 'EFFECT',
          options: [
            ['SOUND_EFFECTS_PITCH', 'PITCH'],
            ['SOUND_EFFECTS_PAN', 'PAN'],
          ],
        },
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_setvolumeto',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_SETVOLUMETO',
      args0: [
        {
          type: 'input_value',
          name: 'VOLUME',
        },
      ],
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_sounds_menu',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'SOUND_MENU',
          options: [
            ['1', '0'],
            ['2', '1'],
            ['3', '2'],
            ['4', '3'],
            ['5', '4'],
            ['6', '5'],
            ['7', '6'],
            ['8', '7'],
            ['9', '8'],
            ['10', '9'],
            ['call a function', null],
          ],
        },
      ],
      extensions: ['output_string'],
    },
  },
  {
    opcode: 'sound_stopallsounds',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_STOPALLSOUNDS',
      extensions: ['colours_sounds', 'shape_statement'],
    },
  },
  {
    opcode: 'sound_volume',
    file: 'blocks_vertical/sound.js',
    blockJson: {
      message0: 'SOUND_VOLUME',
      checkboxInFlyout: true,
      extensions: ['colours_sounds', 'output_number'],
    },
  },
  {
    opcode: 'text',
    file: 'blocks_common/text.js',
    blockJson: {
      message0: '%1',
      args0: [
        {
          type: 'field_input',
          name: 'TEXT',
        },
      ],
      output: 'String',
    },
  },
] as const;

export const toolboxDefaults = {
  motion_movesteps: {
    STEPS: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  motion_turnright: {
    DEGREES: {
      opcode: 'math_number',
      fields: {
        NUM: '15',
      },
    },
  },
  motion_turnleft: {
    DEGREES: {
      opcode: 'math_number',
      fields: {
        NUM: '15',
      },
    },
  },
  motion_pointindirection: {
    DIRECTION: {
      opcode: 'math_angle',
      fields: {
        NUM: '90',
      },
    },
  },
  motion_pointtowards: {
    TOWARDS: {
      opcode: 'motion_pointtowards_menu',
      fields: {},
    },
  },
  motion_gotoxy: {
    X: {
      opcode: 'math_number',
      fields: {
        NUM: '0',
      },
    },
    Y: {
      opcode: 'math_number',
      fields: {
        NUM: '0',
      },
    },
  },
  motion_goto: {
    TO: {
      opcode: 'motion_goto_menu',
      fields: {},
    },
  },
  motion_glidesecstoxy: {
    SECS: {
      opcode: 'math_number',
      fields: {
        NUM: '1',
      },
    },
    X: {
      opcode: 'math_number',
      fields: {
        NUM: '0',
      },
    },
    Y: {
      opcode: 'math_number',
      fields: {
        NUM: '0',
      },
    },
  },
  motion_glideto: {
    SECS: {
      opcode: 'math_number',
      fields: {
        NUM: '1',
      },
    },
    TO: {
      opcode: 'motion_glideto_menu',
      fields: {},
    },
  },
  motion_changexby: {
    DX: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  motion_setx: {
    X: {
      opcode: 'math_number',
      fields: {
        NUM: '0',
      },
    },
  },
  motion_changeyby: {
    DY: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  motion_sety: {
    Y: {
      opcode: 'math_number',
      fields: {
        NUM: '0',
      },
    },
  },
  motion_ifonedgebounce: {},
  motion_setrotationstyle: {},
  motion_xposition: {},
  motion_yposition: {},
  motion_direction: {},
  looks_show: {},
  looks_hide: {},
  looks_switchcostumeto: {
    COSTUME: {
      opcode: 'looks_costume',
      fields: {},
    },
  },
  looks_nextcostume: {},
  looks_nextbackdrop: {},
  looks_switchbackdropto: {
    BACKDROP: {
      opcode: 'looks_backdrops',
      fields: {},
    },
  },
  looks_switchbackdroptoandwait: {
    BACKDROP: {
      opcode: 'looks_backdrops',
      fields: {},
    },
  },
  looks_changeeffectby: {
    CHANGE: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  looks_seteffectto: {
    VALUE: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  looks_cleargraphiceffects: {},
  looks_changesizeby: {
    CHANGE: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  looks_setsizeto: {
    SIZE: {
      opcode: 'math_number',
      fields: {
        NUM: '100',
      },
    },
  },
  looks_gotofrontback: {},
  looks_goforwardbackwardlayers: {
    NUM: {
      opcode: 'math_integer',
      fields: {
        NUM: '1',
      },
    },
  },
  looks_costumenumbername: {},
  looks_backdropnumbername: {},
  looks_size: {},
  sound_play: {
    SOUND_MENU: {
      opcode: 'sound_sounds_menu',
      fields: {},
    },
  },
  sound_playuntildone: {
    SOUND_MENU: {
      opcode: 'sound_sounds_menu',
      fields: {},
    },
  },
  sound_stopallsounds: {},
  sound_changeeffectby: {
    VALUE: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  sound_seteffectto: {
    VALUE: {
      opcode: 'math_number',
      fields: {
        NUM: '100',
      },
    },
  },
  sound_cleareffects: {},
  sound_changevolumeby: {
    VOLUME: {
      opcode: 'math_number',
      fields: {
        NUM: '-10',
      },
    },
  },
  sound_setvolumeto: {
    VOLUME: {
      opcode: 'math_number',
      fields: {
        NUM: '100',
      },
    },
  },
  sound_volume: {},
  event_whenflagclicked: {},
  event_whenkeypressed: {},
  event_whenthisspriteclicked: {},
  event_whenbackdropswitchesto: {},
  event_whengreaterthan: {
    VALUE: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  event_whenbroadcastreceived: {},
  event_broadcast: {
    BROADCAST_INPUT: {
      opcode: 'event_broadcast_menu',
      fields: {},
    },
  },
  event_broadcastandwait: {
    BROADCAST_INPUT: {
      opcode: 'event_broadcast_menu',
      fields: {},
    },
  },
  control_wait: {
    DURATION: {
      opcode: 'math_positive_number',
      fields: {
        NUM: '1',
      },
    },
  },
  control_repeat: {
    TIMES: {
      opcode: 'math_whole_number',
      fields: {
        NUM: '10',
      },
    },
  },
  control_forever: {},
  control_if: {},
  control_if_else: {},
  control_wait_until: {},
  control_repeat_until: {},
  control_stop: {},
  control_start_as_clone: {},
  control_create_clone_of: {
    CLONE_OPTION: {
      opcode: 'control_create_clone_of_menu',
      fields: {},
    },
  },
  control_delete_this_clone: {},
  sensing_touchingobject: {
    TOUCHINGOBJECTMENU: {
      opcode: 'sensing_touchingobjectmenu',
      fields: {},
    },
  },
  sensing_touchingcolor: {
    COLOR: {
      opcode: 'colour_picker',
      fields: {},
    },
  },
  sensing_coloristouchingcolor: {
    COLOR: {
      opcode: 'colour_picker',
      fields: {},
    },
    COLOR2: {
      opcode: 'colour_picker',
      fields: {},
    },
  },
  sensing_distanceto: {
    DISTANCETOMENU: {
      opcode: 'sensing_distancetomenu',
      fields: {},
    },
  },
  sensing_keypressed: {
    KEY_OPTION: {
      opcode: 'sensing_keyoptions',
      fields: {},
    },
  },
  sensing_mousedown: {},
  sensing_mousex: {},
  sensing_mousey: {},
  sensing_setdragmode: {},
  sensing_loudness: {},
  sensing_timer: {},
  sensing_resettimer: {},
  sensing_of: {
    OBJECT: {
      opcode: 'sensing_of_object_menu',
      fields: {},
    },
  },
  sensing_current: {},
  sensing_dayssince2000: {},
  sensing_online: {},
  sensing_username: {},
  operator_add: {
    NUM1: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
    NUM2: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  operator_subtract: {
    NUM1: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
    NUM2: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  operator_multiply: {
    NUM1: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
    NUM2: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  operator_divide: {
    NUM1: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
    NUM2: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  operator_random: {
    FROM: {
      opcode: 'math_number',
      fields: {
        NUM: '1',
      },
    },
    TO: {
      opcode: 'math_number',
      fields: {
        NUM: '10',
      },
    },
  },
  operator_lt: {
    OPERAND1: {
      opcode: 'text',
      fields: {
        TEXT: '',
      },
    },
    OPERAND2: {
      opcode: 'text',
      fields: {
        TEXT: '',
      },
    },
  },
  operator_equals: {
    OPERAND1: {
      opcode: 'text',
      fields: {
        TEXT: '',
      },
    },
    OPERAND2: {
      opcode: 'text',
      fields: {
        TEXT: '',
      },
    },
  },
  operator_gt: {
    OPERAND1: {
      opcode: 'text',
      fields: {
        TEXT: '',
      },
    },
    OPERAND2: {
      opcode: 'text',
      fields: {
        TEXT: '',
      },
    },
  },
  operator_and: {},
  operator_or: {},
  operator_not: {},
  operator_join: {
    STRING1: {
      opcode: 'text',
      fields: {
        TEXT: 'hello',
      },
    },
    STRING2: {
      opcode: 'text',
      fields: {
        TEXT: 'world',
      },
    },
  },
  operator_letter_of: {
    LETTER: {
      opcode: 'math_whole_number',
      fields: {
        NUM: '1',
      },
    },
    STRING: {
      opcode: 'text',
      fields: {
        TEXT: 'world',
      },
    },
  },
  operator_length: {
    STRING: {
      opcode: 'text',
      fields: {
        TEXT: 'world',
      },
    },
  },
  operator_contains: {
    STRING1: {
      opcode: 'text',
      fields: {
        TEXT: 'hello',
      },
    },
    STRING2: {
      opcode: 'text',
      fields: {
        TEXT: 'world',
      },
    },
  },
  operator_mod: {
    NUM1: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
    NUM2: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  operator_round: {
    NUM: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  operator_mathop: {
    NUM: {
      opcode: 'math_number',
      fields: {
        NUM: '',
      },
    },
  },
  extension_pen_down: {},
  extension_music_drum: {
    NUMBER: {
      opcode: 'math_number',
      fields: {
        NUM: '1',
      },
    },
  },
  extension_wedo_motor: {},
  extension_wedo_hat: {},
  extension_wedo_boolean: {},
  extension_wedo_tilt_reporter: {
    TILT: {
      opcode: 'extension_wedo_tilt_menu',
      fields: {},
    },
  },
  extension_music_reporter: {},
  extension_microbit_display: {
    MATRIX: {
      opcode: 'matrix',
      fields: {
        MATRIX: '0101010101100010101000100',
      },
    },
  },
  extension_music_play_note: {
    NOTE: {
      opcode: 'note',
      fields: {
        NOTE: '60',
      },
    },
    BEATS: {
      opcode: 'math_number',
      fields: {
        NUM: '0.25',
      },
    },
  },
} as const;
