import type { Block, Input, ObscuredShadow, Script } from '@scratch-code/ast';
import { materialize } from '@scratch-code/materialize';
import {
  createTurboWarpBlockRegistry,
  getTurboWarpBlockResolveContext,
} from '@scratch-code/turbowarp-blocks';

const inputProjection = (input: Input | ObscuredShadow): unknown => ({
  type: input.type,
  ...(input.type === 'block'
    ? { value: blockProjection(input.value) }
    : input.type === 'script'
      ? { value: scriptProjection(input.value) }
      : input.type === 'empty'
        ? {}
        : { value: input.value }),
  ...(input.obscuredShadow === undefined
    ? {}
    : { obscuredShadow: inputProjection(input.obscuredShadow) }),
});

const blockProjection = (block: Block): unknown => ({
  opcode: block.opcode,
  ...(block.shadow === true ? { shadow: true } : {}),
  fields: Object.fromEntries(
    Object.entries(block.fields).map(([name, field]) => [
      name,
      {
        type: field.type,
        value: field.value,
        ...('id' in field && field.id !== undefined ? { id: field.id } : {}),
      },
    ]),
  ),
  inputs: Object.fromEntries(
    Object.entries(block.inputs).map(([name, input]) => [name, inputProjection(input)]),
  ),
  ...(block.mutation === undefined ? {} : { mutation: block.mutation }),
});

const scriptProjection = (script: Script): unknown => ({
  blocks: script.blocks.map(blockProjection),
  ...(script.metadata?.scratch?.x === undefined ? {} : { x: script.metadata.scratch.x }),
  ...(script.metadata?.scratch?.y === undefined ? {} : { y: script.metadata.scratch.y }),
});

export const semanticProjection = (scripts: readonly Script[]): unknown =>
  scripts.map(scriptProjection);

const surfaceInputProjection = (input: Input | ObscuredShadow): unknown => {
  if (input.type === 'block') return { type: 'block', value: surfaceBlockProjection(input.value) };
  if (input.type === 'script')
    return { type: 'script', value: surfaceProjection([input.value])[0] };
  if (input.type === 'empty') return { type: 'empty' };
  return { type: input.type, value: input.value };
};

const surfaceBlockProjection = (block: Block): unknown => ({
  opcode: block.opcode,
  fields: Object.fromEntries(
    Object.entries(block.fields).map(([name, field]) => [
      name,
      {
        type: field.type,
        value: field.value,
      },
    ]),
  ),
  inputs: Object.fromEntries(
    Object.entries(block.inputs).map(([name, input]) => [name, surfaceInputProjection(input)]),
  ),
  ...(block.mutation === undefined ? {} : { mutation: block.mutation }),
});

export const surfaceProjection = (scripts: readonly Script[]): unknown[] =>
  scripts.map((script) => ({ blocks: script.blocks.map(surfaceBlockProjection) }));

export const materializeDeterministically = (scripts: readonly Script[]): Script[] => {
  let nextId = 1;
  return materialize(scripts, createTurboWarpBlockRegistry(), {
    contextForBlock: (block, { hasNext }) => getTurboWarpBlockResolveContext(block, hasNext),
    generateBlockId: () => `fixture-${nextId++}`,
  });
};
