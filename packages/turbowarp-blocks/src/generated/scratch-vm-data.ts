// Generated from the pinned scratch-vm source. Do not edit by hand.
export const scratchVmExtensionRecords = [
  {
    id: 'pen',
    sourceFile: 'src/extensions/scratch3_pen/index.js',
    blocks: [
      {
        opcode: 'pen_clear',
        blockType: 'command',
        arguments: [],
      },
      {
        opcode: 'pen_stamp',
        blockType: 'command',
        arguments: [],
      },
      {
        opcode: 'pen_penDown',
        blockType: 'command',
        arguments: [],
      },
      {
        opcode: 'pen_penUp',
        blockType: 'command',
        arguments: [],
      },
      {
        opcode: 'pen_setPenColorToColor',
        blockType: 'command',
        arguments: [
          {
            name: 'COLOR',
            type: 'color',
          },
        ],
      },
      {
        opcode: 'pen_changePenColorParamBy',
        blockType: 'command',
        arguments: [
          {
            name: 'COLOR_PARAM',
            type: 'string',
            defaultValue: 'color',
            menu: 'colorParam',
          },
          {
            name: 'VALUE',
            type: 'number',
            defaultValue: '10',
          },
        ],
      },
      {
        opcode: 'pen_setPenColorParamTo',
        blockType: 'command',
        arguments: [
          {
            name: 'COLOR_PARAM',
            type: 'string',
            defaultValue: 'color',
            menu: 'colorParam',
          },
          {
            name: 'VALUE',
            type: 'number',
            defaultValue: '50',
          },
        ],
      },
      {
        opcode: 'pen_changePenSizeBy',
        blockType: 'command',
        arguments: [
          {
            name: 'SIZE',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'pen_setPenSizeTo',
        blockType: 'command',
        arguments: [
          {
            name: 'SIZE',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'pen_setPenShadeToNumber',
        blockType: 'command',
        arguments: [
          {
            name: 'SHADE',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'pen_changePenShadeBy',
        blockType: 'command',
        arguments: [
          {
            name: 'SHADE',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'pen_setPenHueToNumber',
        blockType: 'command',
        arguments: [
          {
            name: 'HUE',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'pen_changePenHueBy',
        blockType: 'command',
        arguments: [
          {
            name: 'HUE',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'colorParam',
        acceptReporters: true,
        items: [
          {
            label: 'color',
            value: 'color',
          },
          {
            label: 'saturation',
            value: 'saturation',
          },
          {
            label: 'brightness',
            value: 'brightness',
          },
          {
            label: 'transparency',
            value: 'transparency',
          },
        ],
      },
    ],
  },
  {
    id: 'wedo2',
    sourceFile: 'src/extensions/scratch3_wedo2/index.js',
    blocks: [
      {
        opcode: 'wedo2_motorOnFor',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'motor',
            menu: 'MOTOR_ID',
          },
          {
            name: 'DURATION',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'wedo2_motorOn',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'motor',
            menu: 'MOTOR_ID',
          },
        ],
      },
      {
        opcode: 'wedo2_motorOff',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'motor',
            menu: 'MOTOR_ID',
          },
        ],
      },
      {
        opcode: 'wedo2_startMotorPower',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'motor',
            menu: 'MOTOR_ID',
          },
          {
            name: 'POWER',
            type: 'number',
            defaultValue: '100',
          },
        ],
      },
      {
        opcode: 'wedo2_setMotorDirection',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'motor',
            menu: 'MOTOR_ID',
          },
          {
            name: 'MOTOR_DIRECTION',
            type: 'string',
            defaultValue: 'this way',
            menu: 'MOTOR_DIRECTION',
          },
        ],
      },
      {
        opcode: 'wedo2_setLightHue',
        blockType: 'command',
        arguments: [
          {
            name: 'HUE',
            type: 'number',
            defaultValue: '50',
          },
        ],
      },
      {
        opcode: 'wedo2_playNoteFor',
        blockType: 'command',
        arguments: [
          {
            name: 'NOTE',
            type: 'number',
            defaultValue: '60',
          },
          {
            name: 'DURATION',
            type: 'number',
            defaultValue: '0.5',
          },
        ],
      },
      {
        opcode: 'wedo2_whenDistance',
        blockType: 'hat',
        arguments: [
          {
            name: 'OP',
            type: 'string',
            defaultValue: '<',
            menu: 'OP',
          },
          {
            name: 'REFERENCE',
            type: 'number',
            defaultValue: '50',
          },
        ],
      },
      {
        opcode: 'wedo2_whenTilted',
        blockType: 'hat',
        arguments: [
          {
            name: 'TILT_DIRECTION_ANY',
            type: 'string',
            defaultValue: 'any',
            menu: 'TILT_DIRECTION_ANY',
          },
        ],
      },
      {
        opcode: 'wedo2_getDistance',
        blockType: 'reporter',
        arguments: [],
      },
      {
        opcode: 'wedo2_isTilted',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'TILT_DIRECTION_ANY',
            type: 'string',
            defaultValue: 'any',
            menu: 'TILT_DIRECTION_ANY',
          },
        ],
      },
      {
        opcode: 'wedo2_getTiltAngle',
        blockType: 'reporter',
        arguments: [
          {
            name: 'TILT_DIRECTION',
            type: 'string',
            defaultValue: 'up',
            menu: 'TILT_DIRECTION',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'MOTOR_ID',
        acceptReporters: true,
        items: [
          {
            label: 'motor',
            value: 'motor',
          },
          {
            label: 'motor A',
            value: 'motor A',
          },
          {
            label: 'motor B',
            value: 'motor B',
          },
          {
            label: 'all motors',
            value: 'all motors',
          },
        ],
      },
      {
        name: 'MOTOR_DIRECTION',
        acceptReporters: true,
        items: [
          {
            label: 'this way',
            value: 'this way',
          },
          {
            label: 'that way',
            value: 'that way',
          },
          {
            label: 'reverse',
            value: 'reverse',
          },
        ],
      },
      {
        name: 'TILT_DIRECTION',
        acceptReporters: true,
        items: [
          {
            label: 'up',
            value: 'up',
          },
          {
            label: 'down',
            value: 'down',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
        ],
      },
      {
        name: 'TILT_DIRECTION_ANY',
        acceptReporters: true,
        items: [
          {
            label: 'up',
            value: 'up',
          },
          {
            label: 'down',
            value: 'down',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
          {
            label: 'any',
            value: 'any',
          },
        ],
      },
      {
        name: 'OP',
        acceptReporters: true,
        items: [
          {
            label: '<',
            value: '<',
          },
          {
            label: '>',
            value: '>',
          },
        ],
      },
    ],
  },
  {
    id: 'music',
    sourceFile: 'src/extensions/scratch3_music/index.js',
    blocks: [
      {
        opcode: 'music_playDrumForBeats',
        blockType: 'command',
        arguments: [
          {
            name: 'DRUM',
            type: 'number',
            defaultValue: '1',
            menu: 'DRUM',
          },
          {
            name: 'BEATS',
            type: 'number',
            defaultValue: '0.25',
          },
        ],
      },
      {
        opcode: 'music_midiPlayDrumForBeats',
        blockType: 'command',
        arguments: [
          {
            name: 'DRUM',
            type: 'number',
            defaultValue: '1',
            menu: 'DRUM',
          },
          {
            name: 'BEATS',
            type: 'number',
            defaultValue: '0.25',
          },
        ],
      },
      {
        opcode: 'music_restForBeats',
        blockType: 'command',
        arguments: [
          {
            name: 'BEATS',
            type: 'number',
            defaultValue: '0.25',
          },
        ],
      },
      {
        opcode: 'music_playNoteForBeats',
        blockType: 'command',
        arguments: [
          {
            name: 'NOTE',
            type: 'note',
            defaultValue: '60',
          },
          {
            name: 'BEATS',
            type: 'number',
            defaultValue: '0.25',
          },
        ],
      },
      {
        opcode: 'music_setInstrument',
        blockType: 'command',
        arguments: [
          {
            name: 'INSTRUMENT',
            type: 'number',
            defaultValue: '1',
            menu: 'INSTRUMENT',
          },
        ],
      },
      {
        opcode: 'music_midiSetInstrument',
        blockType: 'command',
        arguments: [
          {
            name: 'INSTRUMENT',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'music_setTempo',
        blockType: 'command',
        arguments: [
          {
            name: 'TEMPO',
            type: 'number',
            defaultValue: '60',
          },
        ],
      },
      {
        opcode: 'music_changeTempo',
        blockType: 'command',
        arguments: [
          {
            name: 'TEMPO',
            type: 'number',
            defaultValue: '20',
          },
        ],
      },
      {
        opcode: 'music_getTempo',
        blockType: 'reporter',
        arguments: [],
      },
    ],
    menus: [
      {
        name: 'DRUM',
        acceptReporters: true,
        items: [
          {
            label: '(1) Snare Drum',
            value: '1',
          },
          {
            label: '(2) Bass Drum',
            value: '2',
          },
          {
            label: '(3) Side Stick',
            value: '3',
          },
          {
            label: '(4) Crash Cymbal',
            value: '4',
          },
          {
            label: '(5) Open Hi-Hat',
            value: '5',
          },
          {
            label: '(6) Closed Hi-Hat',
            value: '6',
          },
          {
            label: '(7) Tambourine',
            value: '7',
          },
          {
            label: '(8) Hand Clap',
            value: '8',
          },
          {
            label: '(9) Claves',
            value: '9',
          },
          {
            label: '(10) Wood Block',
            value: '10',
          },
          {
            label: '(11) Cowbell',
            value: '11',
          },
          {
            label: '(12) Triangle',
            value: '12',
          },
          {
            label: '(13) Bongo',
            value: '13',
          },
          {
            label: '(14) Conga',
            value: '14',
          },
          {
            label: '(15) Cabasa',
            value: '15',
          },
          {
            label: '(16) Guiro',
            value: '16',
          },
          {
            label: '(17) Vibraslap',
            value: '17',
          },
          {
            label: '(18) Cuica',
            value: '18',
          },
        ],
      },
      {
        name: 'INSTRUMENT',
        acceptReporters: true,
        items: [
          {
            label: '(1) Piano',
            value: '1',
          },
          {
            label: '(2) Electric Piano',
            value: '2',
          },
          {
            label: '(3) Organ',
            value: '3',
          },
          {
            label: '(4) Guitar',
            value: '4',
          },
          {
            label: '(5) Electric Guitar',
            value: '5',
          },
          {
            label: '(6) Bass',
            value: '6',
          },
          {
            label: '(7) Pizzicato',
            value: '7',
          },
          {
            label: '(8) Cello',
            value: '8',
          },
          {
            label: '(9) Trombone',
            value: '9',
          },
          {
            label: '(10) Clarinet',
            value: '10',
          },
          {
            label: '(11) Saxophone',
            value: '11',
          },
          {
            label: '(12) Flute',
            value: '12',
          },
          {
            label: '(13) Wooden Flute',
            value: '13',
          },
          {
            label: '(14) Bassoon',
            value: '14',
          },
          {
            label: '(15) Choir',
            value: '15',
          },
          {
            label: '(16) Vibraphone',
            value: '16',
          },
          {
            label: '(17) Music Box',
            value: '17',
          },
          {
            label: '(18) Steel Drum',
            value: '18',
          },
          {
            label: '(19) Marimba',
            value: '19',
          },
          {
            label: '(20) Synth Lead',
            value: '20',
          },
          {
            label: '(21) Synth Pad',
            value: '21',
          },
        ],
      },
    ],
  },
  {
    id: 'microbit',
    sourceFile: 'src/extensions/scratch3_microbit/index.js',
    blocks: [
      {
        opcode: 'microbit_whenButtonPressed',
        blockType: 'hat',
        arguments: [
          {
            name: 'BTN',
            type: 'string',
            defaultValue: 'A',
            menu: 'buttons',
          },
        ],
      },
      {
        opcode: 'microbit_isButtonPressed',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'BTN',
            type: 'string',
            defaultValue: 'A',
            menu: 'buttons',
          },
        ],
      },
      {
        opcode: 'microbit_whenGesture',
        blockType: 'hat',
        arguments: [
          {
            name: 'GESTURE',
            type: 'string',
            defaultValue: 'moved',
            menu: 'gestures',
          },
        ],
      },
      {
        opcode: 'microbit_displaySymbol',
        blockType: 'command',
        arguments: [
          {
            name: 'MATRIX',
            type: 'matrix',
            defaultValue: '0101010101100010101000100',
          },
        ],
      },
      {
        opcode: 'microbit_displayText',
        blockType: 'command',
        arguments: [
          {
            name: 'TEXT',
            type: 'string',
            defaultValue: 'Hello!',
          },
        ],
      },
      {
        opcode: 'microbit_displayClear',
        blockType: 'command',
        arguments: [],
      },
      {
        opcode: 'microbit_whenTilted',
        blockType: 'hat',
        arguments: [
          {
            name: 'DIRECTION',
            type: 'string',
            defaultValue: 'any',
            menu: 'tiltDirectionAny',
          },
        ],
      },
      {
        opcode: 'microbit_isTilted',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'DIRECTION',
            type: 'string',
            defaultValue: 'any',
            menu: 'tiltDirectionAny',
          },
        ],
      },
      {
        opcode: 'microbit_getTiltAngle',
        blockType: 'reporter',
        arguments: [
          {
            name: 'DIRECTION',
            type: 'string',
            defaultValue: 'front',
            menu: 'tiltDirection',
          },
        ],
      },
      {
        opcode: 'microbit_whenPinConnected',
        blockType: 'hat',
        arguments: [
          {
            name: 'PIN',
            type: 'string',
            defaultValue: '0',
            menu: 'touchPins',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'buttons',
        acceptReporters: true,
        items: [
          {
            label: 'A',
            value: 'A',
          },
          {
            label: 'B',
            value: 'B',
          },
          {
            label: 'any',
            value: 'any',
          },
        ],
      },
      {
        name: 'gestures',
        acceptReporters: true,
        items: [
          {
            label: 'moved',
            value: 'moved',
          },
          {
            label: 'shaken',
            value: 'shaken',
          },
          {
            label: 'jumped',
            value: 'jumped',
          },
        ],
      },
      {
        name: 'pinState',
        acceptReporters: true,
        items: [
          {
            label: 'on',
            value: 'on',
          },
          {
            label: 'off',
            value: 'off',
          },
        ],
      },
      {
        name: 'tiltDirection',
        acceptReporters: true,
        items: [
          {
            label: 'front',
            value: 'front',
          },
          {
            label: 'back',
            value: 'back',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
        ],
      },
      {
        name: 'tiltDirectionAny',
        acceptReporters: true,
        items: [
          {
            label: 'front',
            value: 'front',
          },
          {
            label: 'back',
            value: 'back',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
          {
            label: 'any',
            value: 'any',
          },
        ],
      },
      {
        name: 'touchPins',
        acceptReporters: true,
        items: [
          {
            label: '0',
            value: '0',
          },
          {
            label: '1',
            value: '1',
          },
          {
            label: '2',
            value: '2',
          },
        ],
      },
    ],
  },
  {
    id: 'text2speech',
    sourceFile: 'src/extensions/scratch3_text2speech/index.js',
    blocks: [
      {
        opcode: 'text2speech_speakAndWait',
        blockType: 'command',
        arguments: [
          {
            name: 'WORDS',
            type: 'string',
            defaultValue: 'hello',
          },
        ],
      },
      {
        opcode: 'text2speech_setVoice',
        blockType: 'command',
        arguments: [
          {
            name: 'VOICE',
            type: 'string',
            defaultValue: 'ALTO',
            menu: 'voices',
          },
        ],
      },
      {
        opcode: 'text2speech_setLanguage',
        blockType: 'command',
        arguments: [
          {
            name: 'LANGUAGE',
            type: 'string',
            defaultValue: '0',
            menu: 'languages',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'voices',
        acceptReporters: true,
        items: [
          {
            label: 'alto',
            value: 'ALTO',
          },
          {
            label: 'tenor',
            value: 'TENOR',
          },
          {
            label: 'squeak',
            value: 'SQUEAK',
          },
          {
            label: 'giant',
            value: 'GIANT',
          },
          {
            label: 'kitten',
            value: 'KITTEN',
          },
        ],
      },
      {
        name: 'languages',
        acceptReporters: true,
        items: [
          {
            label: 'Arabic',
            value: 'ar',
          },
          {
            label: 'Chinese (Mandarin)',
            value: 'zh-cn',
          },
          {
            label: 'Danish',
            value: 'da',
          },
          {
            label: 'Dutch',
            value: 'nl',
          },
          {
            label: 'English',
            value: 'en',
          },
          {
            label: 'French',
            value: 'fr',
          },
          {
            label: 'German',
            value: 'de',
          },
          {
            label: 'Hindi',
            value: 'hi',
          },
          {
            label: 'Icelandic',
            value: 'is',
          },
          {
            label: 'Italian',
            value: 'it',
          },
          {
            label: 'Japanese',
            value: 'ja',
          },
          {
            label: 'Korean',
            value: 'ko',
          },
          {
            label: 'Norwegian',
            value: 'nb',
          },
          {
            label: 'Polish',
            value: 'pl',
          },
          {
            label: 'Portuguese (Brazilian)',
            value: 'pt-br',
          },
          {
            label: 'Portuguese',
            value: 'pt',
          },
          {
            label: 'Romanian',
            value: 'ro',
          },
          {
            label: 'Russian',
            value: 'ru',
          },
          {
            label: 'Spanish',
            value: 'es',
          },
          {
            label: 'Spanish (Latin American)',
            value: 'es-419',
          },
          {
            label: 'Swedish',
            value: 'sv',
          },
          {
            label: 'Turkish',
            value: 'tr',
          },
          {
            label: 'Welsh',
            value: 'cy',
          },
        ],
      },
    ],
  },
  {
    id: 'translate',
    sourceFile: 'src/extensions/scratch3_translate/index.js',
    blocks: [
      {
        opcode: 'translate_getTranslate',
        blockType: 'reporter',
        arguments: [
          {
            name: 'WORDS',
            type: 'string',
            defaultValue: 'hello',
          },
          {
            name: 'LANGUAGE',
            type: 'string',
            dynamicDefault: true,
            menu: 'languages',
          },
        ],
      },
      {
        opcode: 'translate_getViewerLanguage',
        blockType: 'reporter',
        arguments: [],
      },
    ],
    menus: [
      {
        name: 'languages',
        acceptReporters: true,
        items: [
          {
            label: 'Amharic',
            value: 'am',
          },
          {
            label: 'Arabic',
            value: 'ar',
          },
          {
            label: 'Azerbaijani',
            value: 'az',
          },
          {
            label: 'Basque',
            value: 'eu',
          },
          {
            label: 'Bulgarian',
            value: 'bg',
          },
          {
            label: 'Catalan',
            value: 'ca',
          },
          {
            label: 'Chinese (Simplified)',
            value: 'zh-cn',
          },
          {
            label: 'Chinese (Traditional)',
            value: 'zh-tw',
          },
          {
            label: 'Croatian',
            value: 'hr',
          },
          {
            label: 'Czech',
            value: 'cs',
          },
          {
            label: 'Danish',
            value: 'da',
          },
          {
            label: 'Dutch',
            value: 'nl',
          },
          {
            label: 'English',
            value: 'en',
          },
          {
            label: 'Estonian',
            value: 'et',
          },
          {
            label: 'Finnish',
            value: 'fi',
          },
          {
            label: 'French',
            value: 'fr',
          },
          {
            label: 'Galician',
            value: 'gl',
          },
          {
            label: 'German',
            value: 'de',
          },
          {
            label: 'Greek',
            value: 'el',
          },
          {
            label: 'Hebrew',
            value: 'he',
          },
          {
            label: 'Hungarian',
            value: 'hu',
          },
          {
            label: 'Icelandic',
            value: 'is',
          },
          {
            label: 'Indonesian',
            value: 'id',
          },
          {
            label: 'Irish Gaelic',
            value: 'ga',
          },
          {
            label: 'Italian',
            value: 'it',
          },
          {
            label: 'Japanese',
            value: 'ja',
          },
          {
            label: 'Korean',
            value: 'ko',
          },
          {
            label: 'Kurdish (Sorani)',
            value: 'ckb',
          },
          {
            label: 'Latvian',
            value: 'lv',
          },
          {
            label: 'Lithuanian',
            value: 'lt',
          },
          {
            label: 'Maori',
            value: 'mi',
          },
          {
            label: 'Norwegian',
            value: 'nb',
          },
          {
            label: 'Persian',
            value: 'fa',
          },
          {
            label: 'Polish',
            value: 'pl',
          },
          {
            label: 'Portuguese',
            value: 'pt',
          },
          {
            label: 'Romanian',
            value: 'ro',
          },
          {
            label: 'Russian',
            value: 'ru',
          },
          {
            label: 'Scots Gaelic',
            value: 'gd',
          },
          {
            label: 'Serbian',
            value: 'sr',
          },
          {
            label: 'Slovak',
            value: 'sk',
          },
          {
            label: 'Slovenian',
            value: 'sl',
          },
          {
            label: 'Spanish',
            value: 'es',
          },
          {
            label: 'Swedish',
            value: 'sv',
          },
          {
            label: 'Thai',
            value: 'th',
          },
          {
            label: 'Turkish',
            value: 'tr',
          },
          {
            label: 'Ukrainian',
            value: 'uk',
          },
          {
            label: 'Vietnamese',
            value: 'vi',
          },
          {
            label: 'Welsh',
            value: 'cy',
          },
          {
            label: 'Zulu',
            value: 'zu',
          },
          {
            label: 'Hebrew',
            value: 'he',
          },
          {
            label: 'Chinese (Simplified)',
            value: 'zh-cn',
          },
        ],
      },
    ],
  },
  {
    id: 'videoSensing',
    sourceFile: 'src/extensions/scratch3_video_sensing/index.js',
    blocks: [
      {
        opcode: 'videoSensing_whenMotionGreaterThan',
        blockType: 'hat',
        arguments: [
          {
            name: 'REFERENCE',
            type: 'number',
            defaultValue: '10',
          },
        ],
      },
      {
        opcode: 'videoSensing_videoOn',
        blockType: 'reporter',
        arguments: [
          {
            name: 'ATTRIBUTE',
            type: 'number',
            defaultValue: 'motion',
            menu: 'ATTRIBUTE',
          },
          {
            name: 'SUBJECT',
            type: 'number',
            defaultValue: 'this sprite',
            menu: 'SUBJECT',
          },
        ],
      },
      {
        opcode: 'videoSensing_videoToggle',
        blockType: 'command',
        arguments: [
          {
            name: 'VIDEO_STATE',
            type: 'number',
            defaultValue: 'on',
            menu: 'VIDEO_STATE',
          },
        ],
      },
      {
        opcode: 'videoSensing_setVideoTransparency',
        blockType: 'command',
        arguments: [
          {
            name: 'TRANSPARENCY',
            type: 'number',
            defaultValue: '50',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'ATTRIBUTE',
        acceptReporters: true,
        items: [
          {
            label: 'motion',
            value: 'motion',
          },
          {
            label: 'direction',
            value: 'direction',
          },
        ],
      },
      {
        name: 'SUBJECT',
        acceptReporters: true,
        items: [
          {
            label: 'sprite',
            value: 'this sprite',
          },
          {
            label: 'stage',
            value: 'Stage',
          },
        ],
      },
      {
        name: 'VIDEO_STATE',
        acceptReporters: true,
        items: [
          {
            label: 'off',
            value: 'off',
          },
          {
            label: 'on',
            value: 'on',
          },
          {
            label: 'on flipped',
            value: 'on-flipped',
          },
        ],
      },
    ],
  },
  {
    id: 'ev3',
    sourceFile: 'src/extensions/scratch3_ev3/index.js',
    blocks: [
      {
        opcode: 'ev3_motorTurnClockwise',
        blockType: 'command',
        arguments: [
          {
            name: 'PORT',
            type: 'string',
            defaultValue: '0',
            menu: 'motorPorts',
          },
          {
            name: 'TIME',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'ev3_motorTurnCounterClockwise',
        blockType: 'command',
        arguments: [
          {
            name: 'PORT',
            type: 'string',
            defaultValue: '0',
            menu: 'motorPorts',
          },
          {
            name: 'TIME',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'ev3_motorSetPower',
        blockType: 'command',
        arguments: [
          {
            name: 'PORT',
            type: 'string',
            defaultValue: '0',
            menu: 'motorPorts',
          },
          {
            name: 'POWER',
            type: 'number',
            defaultValue: '100',
          },
        ],
      },
      {
        opcode: 'ev3_getMotorPosition',
        blockType: 'reporter',
        arguments: [
          {
            name: 'PORT',
            type: 'string',
            defaultValue: '0',
            menu: 'motorPorts',
          },
        ],
      },
      {
        opcode: 'ev3_whenButtonPressed',
        blockType: 'hat',
        arguments: [
          {
            name: 'PORT',
            type: 'string',
            defaultValue: '0',
            menu: 'sensorPorts',
          },
        ],
      },
      {
        opcode: 'ev3_whenDistanceLessThan',
        blockType: 'hat',
        arguments: [
          {
            name: 'DISTANCE',
            type: 'number',
            defaultValue: '5',
          },
        ],
      },
      {
        opcode: 'ev3_whenBrightnessLessThan',
        blockType: 'hat',
        arguments: [
          {
            name: 'DISTANCE',
            type: 'number',
            defaultValue: '50',
          },
        ],
      },
      {
        opcode: 'ev3_buttonPressed',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'PORT',
            type: 'string',
            defaultValue: '0',
            menu: 'sensorPorts',
          },
        ],
      },
      {
        opcode: 'ev3_getDistance',
        blockType: 'reporter',
        arguments: [],
      },
      {
        opcode: 'ev3_getBrightness',
        blockType: 'reporter',
        arguments: [],
      },
      {
        opcode: 'ev3_beep',
        blockType: 'command',
        arguments: [
          {
            name: 'NOTE',
            type: 'note',
            defaultValue: '60',
          },
          {
            name: 'TIME',
            type: 'number',
            defaultValue: '0.5',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'motorPorts',
        acceptReporters: true,
        items: [
          {
            label: 'A',
            value: '0',
          },
          {
            label: 'B',
            value: '1',
          },
          {
            label: 'C',
            value: '2',
          },
          {
            label: 'D',
            value: '3',
          },
        ],
      },
      {
        name: 'sensorPorts',
        acceptReporters: true,
        items: [
          {
            label: '1',
            value: '0',
          },
          {
            label: '2',
            value: '1',
          },
          {
            label: '3',
            value: '2',
          },
          {
            label: '4',
            value: '3',
          },
        ],
      },
    ],
  },
  {
    id: 'makeymakey',
    sourceFile: 'src/extensions/scratch3_makeymakey/index.js',
    blocks: [
      {
        opcode: 'makeymakey_whenMakeyKeyPressed',
        blockType: 'hat',
        arguments: [
          {
            name: 'KEY',
            type: 'string',
            defaultValue: 'SPACE',
            menu: 'KEY',
          },
        ],
      },
      {
        opcode: 'makeymakey_whenCodePressed',
        blockType: 'hat',
        arguments: [
          {
            name: 'SEQUENCE',
            type: 'string',
            defaultValue: 'LEFT UP RIGHT',
            menu: 'SEQUENCE',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'KEY',
        acceptReporters: true,
        items: [
          {
            label: 'space',
            value: 'SPACE',
          },
          {
            label: 'up arrow',
            value: 'UP',
          },
          {
            label: 'down arrow',
            value: 'DOWN',
          },
          {
            label: 'right arrow',
            value: 'RIGHT',
          },
          {
            label: 'left arrow',
            value: 'LEFT',
          },
          {
            label: 'w',
            value: 'w',
          },
          {
            label: 'a',
            value: 'a',
          },
          {
            label: 's',
            value: 's',
          },
          {
            label: 'd',
            value: 'd',
          },
          {
            label: 'f',
            value: 'f',
          },
          {
            label: 'g',
            value: 'g',
          },
        ],
      },
      {
        name: 'SEQUENCE',
        acceptReporters: true,
        items: [
          {
            label: 'left up right',
            value: 'LEFT UP RIGHT',
          },
          {
            label: 'right up left',
            value: 'RIGHT UP LEFT',
          },
          {
            label: 'left right',
            value: 'LEFT RIGHT',
          },
          {
            label: 'right left',
            value: 'RIGHT LEFT',
          },
          {
            label: 'up down',
            value: 'UP DOWN',
          },
          {
            label: 'down up',
            value: 'DOWN UP',
          },
          {
            label: 'up right down left',
            value: 'UP RIGHT DOWN LEFT',
          },
          {
            label: 'up left down right',
            value: 'UP LEFT DOWN RIGHT',
          },
          {
            label: 'up up down down left right left right',
            value: 'UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT',
          },
        ],
      },
    ],
  },
  {
    id: 'boost',
    sourceFile: 'src/extensions/scratch3_boost/index.js',
    blocks: [
      {
        opcode: 'boost_motorOnFor',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'A',
            menu: 'MOTOR_ID',
          },
          {
            name: 'DURATION',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'boost_motorOnForRotation',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'A',
            menu: 'MOTOR_ID',
          },
          {
            name: 'ROTATION',
            type: 'number',
            defaultValue: '1',
          },
        ],
      },
      {
        opcode: 'boost_motorOn',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'A',
            menu: 'MOTOR_ID',
          },
        ],
      },
      {
        opcode: 'boost_motorOff',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'A',
            menu: 'MOTOR_ID',
          },
        ],
      },
      {
        opcode: 'boost_setMotorPower',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'ABCD',
            menu: 'MOTOR_ID',
          },
          {
            name: 'POWER',
            type: 'number',
            defaultValue: '100',
          },
        ],
      },
      {
        opcode: 'boost_setMotorDirection',
        blockType: 'command',
        arguments: [
          {
            name: 'MOTOR_ID',
            type: 'string',
            defaultValue: 'A',
            menu: 'MOTOR_ID',
          },
          {
            name: 'MOTOR_DIRECTION',
            type: 'string',
            defaultValue: 'this way',
            menu: 'MOTOR_DIRECTION',
          },
        ],
      },
      {
        opcode: 'boost_getMotorPosition',
        blockType: 'reporter',
        arguments: [
          {
            name: 'MOTOR_REPORTER_ID',
            type: 'string',
            defaultValue: 'A',
            menu: 'MOTOR_REPORTER_ID',
          },
        ],
      },
      {
        opcode: 'boost_whenColor',
        blockType: 'hat',
        arguments: [
          {
            name: 'COLOR',
            type: 'string',
            defaultValue: 'any',
            menu: 'COLOR',
          },
        ],
      },
      {
        opcode: 'boost_seeingColor',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'COLOR',
            type: 'string',
            defaultValue: 'any',
            menu: 'COLOR',
          },
        ],
      },
      {
        opcode: 'boost_whenTilted',
        blockType: 'hat',
        arguments: [
          {
            name: 'TILT_DIRECTION_ANY',
            type: 'string',
            defaultValue: 'any',
            menu: 'TILT_DIRECTION_ANY',
          },
        ],
      },
      {
        opcode: 'boost_getTiltAngle',
        blockType: 'reporter',
        arguments: [
          {
            name: 'TILT_DIRECTION',
            type: 'string',
            defaultValue: 'up',
            menu: 'TILT_DIRECTION',
          },
        ],
      },
      {
        opcode: 'boost_setLightHue',
        blockType: 'command',
        arguments: [
          {
            name: 'HUE',
            type: 'number',
            defaultValue: '50',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'MOTOR_ID',
        acceptReporters: true,
        items: [
          {
            label: 'A',
            value: 'A',
          },
          {
            label: 'B',
            value: 'B',
          },
          {
            label: 'C',
            value: 'C',
          },
          {
            label: 'D',
            value: 'D',
          },
          {
            label: 'AB',
            value: 'AB',
          },
          {
            label: 'ABCD',
            value: 'ABCD',
          },
        ],
      },
      {
        name: 'MOTOR_REPORTER_ID',
        acceptReporters: true,
        items: [
          {
            label: 'A',
            value: 'A',
          },
          {
            label: 'B',
            value: 'B',
          },
          {
            label: 'C',
            value: 'C',
          },
          {
            label: 'D',
            value: 'D',
          },
        ],
      },
      {
        name: 'MOTOR_DIRECTION',
        acceptReporters: true,
        items: [
          {
            label: 'this way',
            value: 'this way',
          },
          {
            label: 'that way',
            value: 'that way',
          },
          {
            label: 'reverse',
            value: 'reverse',
          },
        ],
      },
      {
        name: 'TILT_DIRECTION',
        acceptReporters: true,
        items: [
          {
            label: 'up',
            value: 'up',
          },
          {
            label: 'down',
            value: 'down',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
        ],
      },
      {
        name: 'TILT_DIRECTION_ANY',
        acceptReporters: true,
        items: [
          {
            label: 'up',
            value: 'up',
          },
          {
            label: 'down',
            value: 'down',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
          {
            label: 'any',
            value: 'any',
          },
        ],
      },
      {
        name: 'COLOR',
        acceptReporters: true,
        items: [
          {
            label: 'red',
            value: 'red',
          },
          {
            label: 'blue',
            value: 'blue',
          },
          {
            label: 'green',
            value: 'green',
          },
          {
            label: 'yellow',
            value: 'yellow',
          },
          {
            label: 'white',
            value: 'white',
          },
          {
            label: 'black',
            value: 'black',
          },
          {
            label: 'any color',
            value: 'any',
          },
        ],
      },
    ],
  },
  {
    id: 'gdxfor',
    sourceFile: 'src/extensions/scratch3_gdx_for/index.js',
    blocks: [
      {
        opcode: 'gdxfor_whenGesture',
        blockType: 'hat',
        arguments: [
          {
            name: 'GESTURE',
            type: 'string',
            defaultValue: 'shaken',
            menu: 'gestureOptions',
          },
        ],
      },
      {
        opcode: 'gdxfor_whenForcePushedOrPulled',
        blockType: 'hat',
        arguments: [
          {
            name: 'PUSH_PULL',
            type: 'string',
            defaultValue: 'pushed',
            menu: 'pushPullOptions',
          },
        ],
      },
      {
        opcode: 'gdxfor_getForce',
        blockType: 'reporter',
        arguments: [],
      },
      {
        opcode: 'gdxfor_whenTilted',
        blockType: 'hat',
        arguments: [
          {
            name: 'TILT',
            type: 'string',
            defaultValue: 'any',
            menu: 'tiltAnyOptions',
          },
        ],
      },
      {
        opcode: 'gdxfor_isTilted',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'TILT',
            type: 'string',
            defaultValue: 'any',
            menu: 'tiltAnyOptions',
          },
        ],
      },
      {
        opcode: 'gdxfor_getTilt',
        blockType: 'reporter',
        arguments: [
          {
            name: 'TILT',
            type: 'string',
            defaultValue: 'front',
            menu: 'tiltOptions',
          },
        ],
      },
      {
        opcode: 'gdxfor_isFreeFalling',
        blockType: 'Boolean',
        arguments: [],
      },
      {
        opcode: 'gdxfor_getSpinSpeed',
        blockType: 'reporter',
        arguments: [
          {
            name: 'DIRECTION',
            type: 'string',
            defaultValue: 'z',
            menu: 'axisOptions',
          },
        ],
      },
      {
        opcode: 'gdxfor_getAcceleration',
        blockType: 'reporter',
        arguments: [
          {
            name: 'DIRECTION',
            type: 'string',
            defaultValue: 'x',
            menu: 'axisOptions',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'pushPullOptions',
        acceptReporters: true,
        items: [
          {
            label: 'pushed',
            value: 'pushed',
          },
          {
            label: 'pulled',
            value: 'pulled',
          },
        ],
      },
      {
        name: 'gestureOptions',
        acceptReporters: true,
        items: [
          {
            label: 'shaken',
            value: 'shaken',
          },
          {
            label: 'started falling',
            value: 'started falling',
          },
          {
            label: 'turned face up',
            value: 'turned face up',
          },
          {
            label: 'turned face down',
            value: 'turned face down',
          },
        ],
      },
      {
        name: 'axisOptions',
        acceptReporters: true,
        items: [
          {
            label: 'x',
            value: 'x',
          },
          {
            label: 'y',
            value: 'y',
          },
          {
            label: 'z',
            value: 'z',
          },
        ],
      },
      {
        name: 'tiltOptions',
        acceptReporters: true,
        items: [
          {
            label: 'front',
            value: 'front',
          },
          {
            label: 'back',
            value: 'back',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
        ],
      },
      {
        name: 'tiltAnyOptions',
        acceptReporters: true,
        items: [
          {
            label: 'front',
            value: 'front',
          },
          {
            label: 'back',
            value: 'back',
          },
          {
            label: 'left',
            value: 'left',
          },
          {
            label: 'right',
            value: 'right',
          },
          {
            label: 'any',
            value: 'any',
          },
        ],
      },
    ],
  },
  {
    id: 'tw',
    sourceFile: 'src/extensions/tw/index.js',
    blocks: [
      {
        opcode: 'tw_getLastKeyPressed',
        blockType: 'reporter',
        arguments: [],
      },
      {
        opcode: 'tw_getButtonIsDown',
        blockType: 'Boolean',
        arguments: [
          {
            name: 'MOUSE_BUTTON',
            type: 'number',
            defaultValue: '0',
            menu: 'mouseButton',
          },
        ],
      },
    ],
    menus: [
      {
        name: 'mouseButton',
        acceptReporters: true,
        items: [
          {
            label: '(0) primary',
            value: '0',
          },
          {
            label: '(1) middle',
            value: '1',
          },
          {
            label: '(2) secondary',
            value: '2',
          },
        ],
      },
    ],
  },
] as const;
