import type { Field, Input, NumericKind } from '@scratch-code/ast';
import type {
  BlockArgumentRef,
  BlockSpec,
  FieldSpec,
  InputAccepts,
  InputSpec,
  ReporterOutputType,
} from '@scratch-code/block-spec';

import { scratchVmExtensionRecords } from '../generated/scratch-vm-data.js';

interface ExtensionArgumentRecord {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly dynamicDefault?: true;
  readonly menu?: string;
}
interface ExtensionBlockRecord {
  readonly opcode: string;
  readonly blockType: string;
  readonly isTerminal?: true;
  readonly arguments: readonly ExtensionArgumentRecord[];
}
interface ExtensionMenuItemRecord {
  readonly label: string;
  readonly value: string;
}
interface ExtensionMenuRecord {
  readonly name: string;
  readonly acceptReporters: boolean;
  readonly items: readonly ExtensionMenuItemRecord[];
}
interface ExtensionRecord {
  readonly id: string;
  readonly sourceFile: string;
  readonly blocks: readonly ExtensionBlockRecord[];
  readonly menus: readonly ExtensionMenuRecord[];
}

const records = scratchVmExtensionRecords as unknown as readonly ExtensionRecord[];

const acceptsFor = (type: string): InputAccepts => {
  if (type === 'Boolean') return 'boolean';
  if (type === 'angle' || type === 'number') return 'number';
  if (type === 'color') return 'color';
  if (type === 'matrix') return 'matrix';
  if (type === 'note') return 'note';
  return 'string';
};

const numericDefault = (value: string, numericKind: NumericKind): Input => ({
  kind: 'input',
  type: 'number',
  value,
  metadata: { scratch: { numericKind } },
});

const menuDefault = (
  extension: ExtensionRecord,
  menu: ExtensionMenuRecord,
  value: string,
): Input => ({
  kind: 'input',
  type: 'block',
  value: {
    kind: 'block',
    opcode: `${extension.id}_menu_${menu.name}`,
    inputs: {},
    fields: {
      [menu.name]: { kind: 'field', type: 'dropdown', value },
    },
  },
});

const inputDefault = (
  extension: ExtensionRecord,
  argument: ExtensionArgumentRecord,
  menu: ExtensionMenuRecord | undefined,
): Input | undefined => {
  if (argument.dynamicDefault === true) return undefined;
  if (menu !== undefined) {
    const value = argument.defaultValue ?? menu.items[0]?.value ?? '';
    return menuDefault(extension, menu, value);
  }
  if (argument.type === 'Boolean') return undefined;
  if (argument.type === 'number') return numericDefault(argument.defaultValue ?? '0', 'number');
  if (argument.type === 'angle') return numericDefault(argument.defaultValue ?? '90', 'angle');
  if (argument.type === 'string')
    return { kind: 'input', type: 'string', value: argument.defaultValue ?? '' };
  if (argument.type === 'color') {
    if (argument.defaultValue !== undefined)
      return { kind: 'input', type: 'color', value: argument.defaultValue };
    return {
      kind: 'input',
      type: 'block',
      value: { kind: 'block', opcode: 'colour_picker', inputs: {}, fields: {} },
    };
  }
  if (argument.type === 'matrix') {
    return {
      kind: 'input',
      type: 'matrix',
      value: argument.defaultValue ?? '0000000000000000000000000',
    };
  }
  if (argument.type === 'note')
    return { kind: 'input', type: 'note', value: argument.defaultValue ?? '60' };
  if (argument.type === 'costume') {
    const field: Field = { kind: 'field', type: 'dropdown', value: argument.defaultValue ?? '' };
    return {
      kind: 'input',
      type: 'block',
      value: { kind: 'block', opcode: 'looks_costume', inputs: {}, fields: { COSTUME: field } },
    };
  }
  if (argument.type === 'sound') {
    const field: Field = { kind: 'field', type: 'dropdown', value: argument.defaultValue ?? '' };
    return {
      kind: 'input',
      type: 'block',
      value: {
        kind: 'block',
        opcode: 'sound_sounds_menu',
        inputs: {},
        fields: { SOUND_MENU: field },
      },
    };
  }
  return undefined;
};

const reporterOutputTypes: Readonly<Record<string, ReporterOutputType>> = {
  wedo2_getDistance: 'number',
  wedo2_getTiltAngle: 'number',
  music_getTempo: 'number',
  microbit_getTiltAngle: 'number',
  translate_getTranslate: 'string',
  translate_getViewerLanguage: 'string',
  videoSensing_videoOn: 'number',
  ev3_getMotorPosition: 'number',
  ev3_getDistance: 'number',
  ev3_getBrightness: 'number',
  boost_getMotorPosition: 'number',
  boost_getTiltAngle: 'number',
  gdxfor_getForce: 'number',
  gdxfor_getTilt: 'number',
  gdxfor_getSpinSpeed: 'number',
  gdxfor_getAcceleration: 'number',
  tw_getLastKeyPressed: 'string',
};

const shapeFor = (block: ExtensionBlockRecord): Pick<BlockSpec, 'shape'> & Partial<BlockSpec> => {
  if (block.blockType === 'Boolean') return { shape: 'boolean' };
  if (block.blockType === 'reporter') {
    return { shape: 'reporter', outputType: reporterOutputTypes[block.opcode] ?? 'any' };
  }
  if (block.blockType === 'hat' || block.blockType === 'event') {
    return { shape: 'hat', hatStyle: 'standard' };
  }
  if (block.isTerminal === true) return { shape: 'terminal' };
  return { shape: 'command' };
};

const createBlockSpec = (extension: ExtensionRecord, block: ExtensionBlockRecord): BlockSpec => {
  const menus = new Map(extension.menus.map((menu) => [menu.name, menu]));
  const inputs: Record<string, InputSpec> = {};
  const fields: Record<string, FieldSpec> = {};
  const arguments_: BlockArgumentRef[] = [];
  for (const argument of block.arguments) {
    const menu = argument.menu === undefined ? undefined : menus.get(argument.menu);
    if (argument.menu !== undefined && menu === undefined) {
      throw new Error(`${block.opcode} references missing menu ${argument.menu}`);
    }
    if (menu !== undefined && !menu.acceptReporters) {
      const value = argument.defaultValue ?? menu.items[0]?.value ?? '';
      fields[argument.name] = {
        type: 'dropdown',
        default: { kind: 'field', type: 'dropdown', value },
        bindings: { scratchblocks: { shape: 'dropdown', options: menu.items } },
      };
      arguments_.push({ kind: 'field', name: argument.name });
      continue;
    }
    const default_ = inputDefault(extension, argument, menu);
    inputs[argument.name] = {
      connection: 'value',
      accepts: acceptsFor(argument.type),
      ...(default_ === undefined ? {} : { default: default_ }),
    };
    arguments_.push({ kind: 'input', name: argument.name });
  }
  return {
    opcode: block.opcode,
    inputs,
    fields,
    arguments: arguments_,
    bindings: { scratchblocks: {} },
    source: {
      scratchVm: { sourceFile: extension.sourceFile, definition: 'extension-info' },
    },
    ...shapeFor(block),
  } as BlockSpec;
};

const createMenuSpec = (extension: ExtensionRecord, menu: ExtensionMenuRecord): BlockSpec => ({
  opcode: `${extension.id}_menu_${menu.name}`,
  shape: 'reporter',
  outputType: 'string',
  inputs: {},
  fields: {
    [menu.name]: {
      type: 'dropdown',
      default: { kind: 'field', type: 'dropdown', value: menu.items[0]?.value ?? '' },
      bindings: { scratchblocks: { shape: 'dropdown', options: menu.items } },
    },
  },
  arguments: [{ kind: 'field', name: menu.name }],
  bindings: { scratchblocks: {} },
  source: {
    scratchVm: { sourceFile: extension.sourceFile, definition: 'extension-info' },
  },
});

export const specsByExtensionId = new Map<string, readonly BlockSpec[]>(
  records.map((extension) => [
    extension.id,
    [
      ...extension.blocks.map((block) => createBlockSpec(extension, block)),
      ...extension.menus
        .filter((menu) => menu.acceptReporters)
        .map((menu) => createMenuSpec(extension, menu)),
    ],
  ]),
);

export const scratchVmExtensionCatalogRecords = records;
