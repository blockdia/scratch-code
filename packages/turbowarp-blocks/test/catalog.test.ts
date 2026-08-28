import { describe, expect, it } from 'vitest';

import builtinExtensionManifest from '../builtin-extensions-source-manifest.json' with { type: 'json' };
import sourceManifest from '../source-manifest.json' with { type: 'json' };
import specsGolden from './fixtures/specs.golden.json' with { type: 'json' };

import {
  TURBOWARP_BLOCKS_SOURCE_REVISION,
  TURBOWARP_VM_SOURCE_REVISION,
  boostBlockSpecs,
  controlBlockSpecs,
  createTurboWarpBlockRegistry,
  dataBlockSpecs,
  eventBlockSpecs,
  ev3BlockSpecs,
  gdxforBlockSpecs,
  looksBlockSpecs,
  makeymakeyBlockSpecs,
  microbitBlockSpecs,
  motionBlockSpecs,
  musicBlockSpecs,
  operatorsBlockSpecs,
  penBlockSpecs,
  procedureBlockSpecs,
  sensingBlockSpecs,
  shadowBlockSpecs,
  soundBlockSpecs,
  text2speechBlockSpecs,
  translateBlockSpecs,
  turboWarpBlockSpecs,
  twBlockSpecs,
  videoSensingBlockSpecs,
  wedo2BlockSpecs,
} from '../src/index.js';

describe('TurboWarp catalog', () => {
  it('contains all 294 audited serializable definitions', () => {
    const categories = [
      motionBlockSpecs,
      looksBlockSpecs,
      soundBlockSpecs,
      eventBlockSpecs,
      controlBlockSpecs,
      sensingBlockSpecs,
      operatorsBlockSpecs,
      dataBlockSpecs,
      procedureBlockSpecs,
      shadowBlockSpecs,
      penBlockSpecs,
      wedo2BlockSpecs,
      musicBlockSpecs,
      microbitBlockSpecs,
      text2speechBlockSpecs,
      translateBlockSpecs,
      videoSensingBlockSpecs,
      ev3BlockSpecs,
      makeymakeyBlockSpecs,
      boostBlockSpecs,
      gdxforBlockSpecs,
      twBlockSpecs,
    ];
    const flattened = categories.flat();
    expect(flattened).toEqual(turboWarpBlockSpecs);
    expect(flattened).toHaveLength(294);
    expect(new Set(flattened.map((spec) => spec.opcode))).toHaveLength(294);
    expect(
      flattened
        .filter((spec) => spec.source?.scratchBlocks !== undefined)
        .map((spec) => spec.opcode)
        .sort(),
    ).toEqual(sourceManifest.map((record) => record.opcode).sort());
    const extensionOpcodes = builtinExtensionManifest.flatMap((extension) => [
      ...extension.blocks.map((block) => block.opcode),
      ...extension.menus
        .filter((menu) => menu.acceptReporters)
        .map((menu) => `${extension.id}_menu_${menu.name}`),
    ]);
    expect(
      flattened
        .filter((spec) => spec.source?.scratchVm !== undefined)
        .map((spec) => spec.opcode)
        .sort(),
    ).toEqual(extensionOpcodes.sort());
  });

  it('matches the committed semantic golden fixture', () => {
    const normalized = turboWarpBlockSpecs.map((spec) => ({
      opcode: spec.opcode,
      shape: spec.shape,
      ...(spec.hatStyle === undefined ? {} : { hatStyle: spec.hatStyle }),
      ...(spec.outputType === undefined ? {} : { outputType: spec.outputType }),
      arguments: spec.arguments,
      inputs: spec.inputs,
      fields: spec.fields,
      bindings: spec.bindings,
      source: spec.source,
    }));
    expect(normalized).toEqual(specsGolden);
  });

  it('keeps all definitions JSON-safe and all block defaults resolvable', () => {
    expect(JSON.parse(JSON.stringify(turboWarpBlockSpecs))).toEqual(turboWarpBlockSpecs);
    const opcodes = new Set(turboWarpBlockSpecs.map((spec) => spec.opcode));
    for (const spec of turboWarpBlockSpecs) {
      for (const input of Object.values(spec.inputs)) {
        if (input.default?.type === 'block')
          expect(opcodes.has(input.default.value.opcode)).toBe(true);
      }
    }
  });

  it('preserves canonical defaults and source revision', () => {
    expect(TURBOWARP_BLOCKS_SOURCE_REVISION).toBe('7c58de666658df1bb447d010132aa3914c10f41e');
    expect(TURBOWARP_VM_SOURCE_REVISION).toBe('96ed93bbb5c405b7bf48f673a379f1c595672373');
    const registry = createTurboWarpBlockRegistry();
    expect(registry.require('motion_movesteps').inputs['STEPS']?.default).toEqual({
      kind: 'input',
      type: 'number',
      value: '10',
      metadata: { scratch: { numericKind: 'number' } },
    });
    expect(registry.require('motion_movesteps')).toMatchObject({
      arguments: [{ kind: 'input', name: 'STEPS' }],
      bindings: { scratchblocks: { blockId: 'MOTION_MOVESTEPS' } },
      source: { scratchBlocks: { sourceFile: 'blocks_vertical/motion.js', definition: 'json' } },
    });
    const definition = registry.require('procedures_definition');
    expect(definition).toMatchObject({ shape: 'hat', hatStyle: 'define' });
    expect(definition.inputs['custom_block']?.default).toMatchObject({
      type: 'block',
      value: { opcode: 'procedures_prototype' },
    });
  });

  it('preserves built-in extension inputs and menu serialization', () => {
    const registry = createTurboWarpBlockRegistry();
    expect(registry.require('tw_getLastKeyPressed')).toMatchObject({
      shape: 'reporter',
      outputType: 'string',
      source: {
        scratchVm: { sourceFile: 'src/extensions/tw/index.js', definition: 'extension-info' },
      },
    });
    expect(registry.require('tw_getButtonIsDown')).toMatchObject({
      shape: 'boolean',
      arguments: [{ kind: 'input', name: 'MOUSE_BUTTON' }],
      inputs: {
        MOUSE_BUTTON: {
          connection: 'value',
          accepts: 'number',
          default: { type: 'block', value: { opcode: 'tw_menu_mouseButton' } },
        },
      },
    });
    expect(registry.require('tw_menu_mouseButton').fields['mouseButton']).toMatchObject({
      type: 'dropdown',
      default: { type: 'dropdown', value: '0' },
    });
    expect(registry.require('music_playDrumForBeats').inputs).toMatchObject({
      DRUM: {
        connection: 'value',
        accepts: 'number',
        default: { type: 'block', value: { opcode: 'music_menu_DRUM' } },
      },
      BEATS: {
        connection: 'value',
        accepts: 'number',
        default: { type: 'number', value: '0.25' },
      },
    });
    expect(registry.require('microbit_displaySymbol').inputs['MATRIX']?.default).toMatchObject({
      type: 'matrix',
      value: '0101010101100010101000100',
    });
    expect(registry.require('videoSensing_whenMotionGreaterThan')).toMatchObject({
      shape: 'hat',
      hatStyle: 'standard',
    });
    expect(registry.require('pen_setPenColorToColor').inputs['COLOR']?.default).toEqual({
      kind: 'input',
      type: 'block',
      value: { kind: 'block', opcode: 'colour_picker', inputs: {}, fields: {} },
    });
    expect(registry.require('translate_getTranslate').inputs['LANGUAGE']).toEqual({
      connection: 'value',
      accepts: 'string',
    });
  });

  it('creates complete isolated registries', () => {
    const first = createTurboWarpBlockRegistry();
    const second = createTurboWarpBlockRegistry();
    expect(first.size).toBe(294);
    first.unregister('motion_movesteps');
    expect(first.size).toBe(293);
    expect(second.has('motion_movesteps')).toBe(true);
    expect(second.resolveRequired('motion_movesteps', undefined)).toBe(
      second.require('motion_movesteps'),
    );
  });
});
