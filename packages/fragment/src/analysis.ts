import type {
  Block,
  JsonValue,
  ProcedureCallMutation,
  ProcedurePrototypeMutation,
  Script,
} from '@scratch-code/ast';
import { assertJsonValue, walk } from '@scratch-code/ast';

import type { ResourceReference, ScriptAnalysis } from './types.js';

const CORE_OPCODE_PREFIXES = new Set([
  'argument',
  'colour',
  'control',
  'data',
  'event',
  'looks',
  'math',
  'motion',
  'operator',
  'procedures',
  'sensing',
  'sound',
]);

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const canonicalJson = (value: JsonValue): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.entries(value)
    .filter((entry): entry is [string, JsonValue] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
    .join(',')}}`;
};

const resourceKey = (reference: ResourceReference): string =>
  reference.id === undefined ? `value:${canonicalJson(reference.value)}` : `id:${reference.id}`;

const callKey = (mutation: ProcedureCallMutation): string =>
  [
    mutation.proccode,
    JSON.stringify(mutation.argumentIds),
    String(mutation.warp),
    mutation.returnType,
  ].join('\u0000');

const extensionIdForOpcode = (opcode: string): string | undefined => {
  const separator = opcode.indexOf('_');
  if (separator < 1) return undefined;
  const prefix = opcode.slice(0, separator).replace(/[^\w-]/g, '-');
  if (prefix.length === 0 || CORE_OPCODE_PREFIXES.has(prefix)) return undefined;
  return prefix;
};

export interface TopProcedureDefinition {
  readonly script: Script;
  readonly block: Block;
  readonly prototype: Block;
  readonly mutation: ProcedurePrototypeMutation;
  readonly concreteId?: string;
}

/** Procedure definitions are represented only by canonical top blocks. */
export const getTopProcedureDefinition = (script: Script): TopProcedureDefinition | undefined => {
  const block = script.blocks[0];
  if (block?.opcode !== 'procedures_definition') return undefined;
  const customBlock = block.inputs['custom_block'];
  if (customBlock?.type !== 'block') return undefined;
  const prototype = customBlock.value;
  if (
    prototype.opcode !== 'procedures_prototype' ||
    prototype.mutation?.type !== 'procedure-prototype'
  )
    return undefined;
  const blockId = block.metadata?.scratch?.id;
  const prototypeId = prototype.metadata?.scratch?.id;
  const concreteId =
    blockId !== undefined && blockId.length > 0
      ? blockId
      : prototypeId !== undefined && prototypeId.length > 0
        ? prototypeId
        : undefined;
  return {
    script,
    block,
    prototype,
    mutation: prototype.mutation,
    ...(concreteId === undefined ? {} : { concreteId }),
  };
};

export const collectTopProcedureDefinitions = (
  scripts: readonly Script[],
): TopProcedureDefinition[] =>
  scripts.flatMap((script) => {
    const definition = getTopProcedureDefinition(script);
    return definition === undefined ? [] : [definition];
  });

/** Calls may occur at any depth, including inside procedure bodies. */
export const collectProcedureCalls = (scripts: readonly Script[]): ProcedureCallMutation[] => {
  const calls: ProcedureCallMutation[] = [];
  for (const script of scripts) {
    walk(script, {
      enter(node) {
        if (node.kind === 'block' && node.mutation?.type === 'procedure-call') {
          calls.push(node.mutation);
        }
      },
    });
  }
  return calls;
};

/** Analyze semantic scripts without consulting a block registry or codec. */
export const analyzeScripts = (scripts: readonly Script[]): ScriptAnalysis => {
  assertJsonValue(scripts);

  const variables: ResourceReference[] = [];
  const lists: ResourceReference[] = [];
  const broadcasts: ResourceReference[] = [];
  const resourceKeys = {
    variable: new Set<string>(),
    list: new Set<string>(),
    broadcast: new Set<string>(),
  };
  const extensions: string[] = [];
  const extensionIds = new Set<string>();

  const addReference = (
    type: 'variable' | 'list' | 'broadcast',
    reference: ResourceReference,
  ): void => {
    const key = resourceKey(reference);
    if (resourceKeys[type].has(key)) return;
    resourceKeys[type].add(key);
    const target = type === 'variable' ? variables : type === 'list' ? lists : broadcasts;
    target.push(cloneJson(reference));
  };

  for (const script of scripts) {
    walk(script, {
      enter(node) {
        if (
          node.kind === 'field' &&
          (node.type === 'variable' || node.type === 'list' || node.type === 'broadcast')
        ) {
          addReference(node.type, {
            value: node.value,
            ...(node.id === undefined ? {} : { id: node.id }),
          });
        }
        if (node.kind === 'block') {
          const extensionId = extensionIdForOpcode(node.opcode);
          if (extensionId !== undefined && !extensionIds.has(extensionId)) {
            extensionIds.add(extensionId);
            extensions.push(extensionId);
          }
        }
      },
    });
  }

  const procedureDefinitions = collectTopProcedureDefinitions(scripts).map((definition) =>
    cloneJson(definition.mutation),
  );
  const definitionCodes = new Set(procedureDefinitions.map((definition) => definition.proccode));
  const procedureCalls: ProcedureCallMutation[] = [];
  const callKeys = new Set<string>();
  for (const mutation of collectProcedureCalls(scripts)) {
    const key = callKey(mutation);
    if (callKeys.has(key)) continue;
    callKeys.add(key);
    procedureCalls.push(cloneJson(mutation));
  }
  const unresolvedProcedureCalls = procedureCalls
    .filter((call) => !definitionCodes.has(call.proccode))
    .map(cloneJson);

  return {
    variables,
    lists,
    broadcasts,
    procedureDefinitions,
    procedureCalls,
    unresolvedProcedureCalls,
    extensions,
  };
};
