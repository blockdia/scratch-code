import type { Block, Input, ObscuredShadow, Script } from '@scratch-code/ast';
import { walk } from '@scratch-code/ast';
import type { BlockSpecRegistry, DefaultInput } from '@scratch-code/block-spec';

import { DuplicateBlockIdError, InvalidGeneratedBlockIdError } from './errors.js';
import { generateScratchBlockId } from './id.js';
import type { BlockIdGenerator, MaterializeOptions, ScratchBlockIdNode } from './types.js';

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const currentBlockId = (block: Readonly<ScratchBlockIdNode>): string | undefined => {
  const id = block.metadata?.scratch?.id;
  return id === '' ? undefined : id;
};

const reserveExistingIds = (scripts: readonly Script[]): Set<string> => {
  const result = new Set<string>();
  for (const script of scripts) {
    walk(script, {
      enter(node) {
        if (
          node.kind !== 'block' &&
          (node.kind !== 'input' ||
            node.type === 'block' ||
            node.type === 'script' ||
            node.type === 'empty')
        )
          return;
        const id = currentBlockId(node);
        if (id === undefined) return;
        if (result.has(id)) throw new DuplicateBlockIdError(id);
        result.add(id);
      },
    });
  }
  return result;
};

const assignBlockId = (
  block: ScratchBlockIdNode,
  usedIds: Set<string>,
  generateBlockId: BlockIdGenerator,
): void => {
  if (currentBlockId(block) !== undefined) return;
  const generated = generateBlockId(block, usedIds);
  if (typeof generated !== 'string' || generated.length === 0) {
    throw new InvalidGeneratedBlockIdError(generated);
  }
  if (usedIds.has(generated)) throw new DuplicateBlockIdError(generated);
  usedIds.add(generated);
  block.metadata = {
    ...(block.metadata ?? {}),
    scratch: { ...(block.metadata?.scratch ?? {}), id: generated },
  };
};

const cloneDefault = (default_: DefaultInput): Input => cloneJson(default_) as Input;

const cloneObscuredDefault = (default_: DefaultInput | undefined): ObscuredShadow | undefined => {
  if (default_ === undefined || default_.type === 'empty' || default_.type === 'script')
    return undefined;
  return cloneJson(default_) as ObscuredShadow;
};

const markBlockShadow = (input: Input | ObscuredShadow): void => {
  if (input.type === 'block') input.value.shadow = true;
};

interface MaterializeState<TContext> {
  readonly registry: BlockSpecRegistry<TContext>;
  readonly options: MaterializeOptions<TContext>;
  readonly generateBlockId: BlockIdGenerator;
  readonly usedIds: Set<string>;
}

const materializeInput = <TContext>(state: MaterializeState<TContext>, input: Input): void => {
  if (input.type === 'block') materializeBlock(state, input.value, false);
  else if (input.type === 'script') materializeScript(state, input.value);
  else if (input.type !== 'empty') assignBlockId(input, state.usedIds, state.generateBlockId);

  if (input.obscuredShadow !== undefined) {
    markBlockShadow(input.obscuredShadow);
    materializeObscuredShadow(state, input.obscuredShadow);
  }
};

const materializeObscuredShadow = <TContext>(
  state: MaterializeState<TContext>,
  input: ObscuredShadow,
): void => {
  if (input.type === 'block') materializeBlock(state, input.value, false);
  else assignBlockId(input, state.usedIds, state.generateBlockId);
  if (input.obscuredShadow !== undefined) {
    markBlockShadow(input.obscuredShadow);
    materializeObscuredShadow(state, input.obscuredShadow);
  }
};

const materializeBlock = <TContext>(
  state: MaterializeState<TContext>,
  block: Block,
  hasNext: boolean,
): void => {
  assignBlockId(block, state.usedIds, state.generateBlockId);
  const context = state.options.contextForBlock?.(block, { hasNext }) as TContext;
  const spec = state.registry.resolveRequired(block.opcode, context);
  const declaredInputs = new Set(Object.keys(spec.inputs));

  for (const [name, inputSpec] of Object.entries(spec.inputs)) {
    let input = block.inputs[name];
    if (input === undefined || input.type === 'empty') {
      const promoted = input?.obscuredShadow;
      input =
        promoted ??
        (inputSpec.default === undefined
          ? { kind: 'input', type: 'empty' }
          : cloneDefault(inputSpec.default));
      markBlockShadow(input);
      block.inputs[name] = input;
    } else if (input.type === 'block') {
      const defaultBlock =
        inputSpec.default?.type === 'block' ? inputSpec.default.value : undefined;
      const isShadow = input.value.shadow === true || defaultBlock?.opcode === input.value.opcode;
      if (isShadow) input.value.shadow = true;
      else if (input.obscuredShadow === undefined) {
        const obscuredShadow = cloneObscuredDefault(inputSpec.default);
        if (obscuredShadow !== undefined) {
          input.obscuredShadow = obscuredShadow;
          markBlockShadow(input.obscuredShadow);
        }
      }
    } else if (input.type === 'script' && input.obscuredShadow === undefined) {
      const obscuredShadow = cloneObscuredDefault(inputSpec.default);
      if (obscuredShadow !== undefined) {
        input.obscuredShadow = obscuredShadow;
        markBlockShadow(input.obscuredShadow);
      }
    }
    materializeInput(state, input);
  }

  for (const [name, input] of Object.entries(block.inputs)) {
    if (!declaredInputs.has(name)) materializeInput(state, input);
  }
};

const materializeScript = <TContext>(state: MaterializeState<TContext>, script: Script): void => {
  script.blocks.forEach((block, index) => {
    materializeBlock(state, block, index < script.blocks.length - 1);
  });
};

/** Return a deep-cloned AST with spec defaults, shadow flags, and block IDs completed. */
export const materialize = <TContext>(
  scripts: readonly Script[],
  registry: BlockSpecRegistry<TContext>,
  options: MaterializeOptions<TContext> = {},
): Script[] => {
  const result = cloneJson(scripts) as Script[];
  const state: MaterializeState<TContext> = {
    registry,
    options,
    generateBlockId: options.generateBlockId ?? generateScratchBlockId,
    usedIds: reserveExistingIds(result),
  };
  for (const script of result) materializeScript(state, script);
  return result;
};
