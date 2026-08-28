import type {
  Block,
  Field,
  Input,
  JsonObject,
  JsonValue,
  ObscuredShadow,
  Script,
  SemanticMutation,
} from '@scratch-code/ast';

const compareKey = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export const sortedKeys = (value: Readonly<Record<string, unknown>>): string[] =>
  Object.keys(value).sort(compareKey);

export const canonicalJson = (value: JsonValue): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${sortedKeys(value)
    .flatMap((key) => {
      const child = value[key];
      return child === undefined ? [] : [`${JSON.stringify(key)}:${canonicalJson(child)}`];
    })
    .join(',')}}`;
};

const mutationValue = (mutation: SemanticMutation): JsonObject => mutation as unknown as JsonObject;

const fieldValue = (field: Field): JsonObject => ({
  kind: 'field',
  type: field.type,
  value: field.value,
  ...('id' in field && field.id !== undefined ? { id: field.id } : {}),
});

const inputValue = (input: Input | ObscuredShadow): JsonObject => ({
  kind: 'input',
  type: input.type,
  ...(input.type === 'block'
    ? { value: blockValue(input.value) }
    : input.type === 'script'
      ? { value: scriptValue(input.value) }
      : input.type === 'empty'
        ? {}
        : { value: input.value }),
  ...(input.obscuredShadow === undefined
    ? {}
    : { obscuredShadow: inputValue(input.obscuredShadow) }),
});

const blockValue = (block: Block): JsonObject => ({
  kind: 'block',
  opcode: block.opcode,
  ...(block.shadow === true ? { shadow: true } : {}),
  fields: Object.fromEntries(
    sortedKeys(block.fields).map((key) => [key, fieldValue(block.fields[key]!)]),
  ),
  inputs: Object.fromEntries(
    sortedKeys(block.inputs).map((key) => [key, inputValue(block.inputs[key]!)]),
  ),
  ...(block.mutation === undefined ? {} : { mutation: mutationValue(block.mutation) }),
});

const scriptValue = (script: Script): JsonObject => ({
  kind: 'script',
  blocks: script.blocks.map(blockValue),
});

export const semanticFingerprint = (node: Script | Block): string =>
  canonicalJson(node.kind === 'script' ? scriptValue(node) : blockValue(node));

export const jsonEqual = (left: JsonValue, right: JsonValue): boolean =>
  canonicalJson(left) === canonicalJson(right);

const keySignature = (value: Readonly<Record<string, { readonly type: string }>>): string =>
  sortedKeys(value)
    .map((key) => `${JSON.stringify(key)}:${value[key]!.type}`)
    .join(',');

export const blockSimilarityKey = (block: Block): string =>
  [
    block.opcode,
    block.shadow === true ? 'shadow' : 'block',
    keySignature(block.fields),
    keySignature(block.inputs),
    block.mutation?.type ?? '',
  ].join('\u0000');

export const scriptSimilarityKey = (script: Script): string => {
  if (script.blocks.length === 0) return 'empty';
  return [script.blocks[0]!.opcode, script.blocks.at(-1)!.opcode].join('\u0000');
};
