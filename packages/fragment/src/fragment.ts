import type { Script } from '@scratch-code/ast';
import { assertJsonValue } from '@scratch-code/ast';

import {
  analyzeScripts,
  collectProcedureCalls,
  collectTopProcedureDefinitions,
  type TopProcedureDefinition,
} from './analysis.js';
import { DuplicateProcedureDefinitionError } from './errors.js';
import type { CreateScratchFragmentOptions, ScratchFragment } from './types.js';

export const SCRATCH_FRAGMENT_VERSION = 1 as const;

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const sameDefinitionOccurrence = (
  left: TopProcedureDefinition,
  right: TopProcedureDefinition,
): boolean => {
  if (left.concreteId !== undefined && right.concreteId !== undefined) {
    return left.concreteId === right.concreteId;
  }
  return left.script === right.script && left.block === right.block;
};

const uniqueOccurrences = (
  definitions: readonly TopProcedureDefinition[],
): TopProcedureDefinition[] => {
  const unique: TopProcedureDefinition[] = [];
  for (const definition of definitions) {
    if (!unique.some((existing) => sameDefinitionOccurrence(existing, definition))) {
      unique.push(definition);
    }
  }
  return unique;
};

const duplicateDefinition = (
  proccode: string,
  definitions: readonly TopProcedureDefinition[],
): never => {
  throw new DuplicateProcedureDefinitionError(
    proccode,
    definitions.map((definition) => definition.concreteId ?? null),
  );
};

const definitionsByCode = (
  definitions: readonly TopProcedureDefinition[],
): Map<string, TopProcedureDefinition[]> => {
  const result = new Map<string, TopProcedureDefinition[]>();
  for (const definition of definitions) {
    result.set(definition.mutation.proccode, [
      ...(result.get(definition.mutation.proccode) ?? []),
      definition,
    ]);
  }
  return result;
};

/**
 * Create a standalone fragment and append the reachable custom-procedure
 * definitions available in sourceScripts.
 */
export const createScratchFragment = (
  selectedScripts: readonly Script[],
  options: CreateScratchFragmentOptions = {},
): ScratchFragment => {
  const selectedDefinitions = definitionsByCode(collectTopProcedureDefinitions(selectedScripts));
  const resolvedCodes = new Set<string>();
  for (const [proccode, definitions] of selectedDefinitions) {
    const unique = uniqueOccurrences(definitions);
    if (unique.length > 1) duplicateDefinition(proccode, unique);
    resolvedCodes.add(proccode);
  }

  const sourceScripts = options.sourceScripts ?? [];
  const sourceDefinitions = definitionsByCode(collectTopProcedureDefinitions(sourceScripts));
  const addedDefinitions = new Set<TopProcedureDefinition>();
  const queuedCodes = new Set<string>();
  const queue: string[] = [];
  const enqueueCalls = (scripts: readonly Script[]): void => {
    for (const call of collectProcedureCalls(scripts)) {
      if (!queuedCodes.has(call.proccode)) {
        queuedCodes.add(call.proccode);
        queue.push(call.proccode);
      }
    }
  };

  enqueueCalls(selectedScripts);
  for (let index = 0; index < queue.length; index += 1) {
    const proccode = queue[index]!;
    if (resolvedCodes.has(proccode)) continue;

    const candidates = uniqueOccurrences(sourceDefinitions.get(proccode) ?? []);
    if (candidates.length > 1) duplicateDefinition(proccode, candidates);
    const definition = candidates[0];
    if (definition === undefined) continue;

    resolvedCodes.add(proccode);
    addedDefinitions.add(definition);
    enqueueCalls([definition.script]);
  }

  const appendedOccurrences: TopProcedureDefinition[] = [];
  const appendedScripts = sourceScripts.filter((script) => {
    const definition = collectTopProcedureDefinitions([script])[0];
    if (
      definition === undefined ||
      ![...addedDefinitions].some((added) => sameDefinitionOccurrence(added, definition)) ||
      appendedOccurrences.some((appended) => sameDefinitionOccurrence(appended, definition))
    )
      return false;
    appendedOccurrences.push(definition);
    return true;
  });
  const fragmentScripts = [...selectedScripts, ...appendedScripts];
  assertJsonValue(fragmentScripts);
  const scripts = cloneJson(fragmentScripts) as Script[];
  const analysis = analyzeScripts(scripts);
  const seenProcedureDependencies = new Set<string>();
  const procedures = analysis.unresolvedProcedureCalls.flatMap((call) => {
    if (seenProcedureDependencies.has(call.proccode)) return [];
    seenProcedureDependencies.add(call.proccode);
    return [{ proccode: call.proccode }];
  });
  const fragment: ScratchFragment = {
    version: SCRATCH_FRAGMENT_VERSION,
    scripts,
    dependencies: {
      variables: analysis.variables,
      lists: analysis.lists,
      broadcasts: analysis.broadcasts,
      procedures,
      extensions: analysis.extensions,
    },
  };
  assertJsonValue(fragment);
  return fragment;
};
