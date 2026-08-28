import type {
  AstDiagnostic,
  AstPathSegment,
  Block,
  Field,
  Input,
  JsonValue,
  ObscuredShadow,
  Script,
  SemanticMutation,
} from '@scratch-code/ast';
import { assertJsonValue, validateScripts } from '@scratch-code/ast';

import {
  blockSimilarityKey,
  jsonEqual,
  scriptSimilarityKey,
  semanticFingerprint,
  sortedKeys,
} from './canonical.js';
import { InvalidDiffInputError } from './errors.js';
import type {
  DiffChange,
  DiffEntityKind,
  DiffLocation,
  DiffMatchBasis,
  DiffMatchingStrategy,
  DiffModifyChange,
  DiffMoveRelation,
  DiffPair,
  DiffPropertyChange,
  DiffScriptsOptions,
  DiffValueState,
  SemanticDiffV1,
} from './types.js';

type PairableNode = Script | Block | Input | Field | SemanticMutation;

interface NodeInfo<T extends Script | Block> {
  readonly node: T;
  readonly location: DiffLocation;
  readonly parentOwner: Script | Input | null;
  readonly parentRole: 'scripts' | 'blocks' | 'value';
  readonly index?: number;
}

interface TreeIndex {
  readonly scripts: Map<Script, NodeInfo<Script>>;
  readonly blocks: Map<Block, NodeInfo<Block>>;
  readonly scriptOrder: NodeInfo<Script>[];
  readonly blockOrder: NodeInfo<Block>[];
}

interface PairDraft {
  readonly kind: DiffEntityKind;
  readonly basis: DiffMatchBasis;
  readonly before: DiffLocation;
  readonly after: DiffLocation;
  readonly beforeNode: PairableNode;
  readonly afterNode: PairableNode;
  active: boolean;
}

interface AddDraft {
  readonly type: 'add';
  readonly target: DiffLocation;
  readonly pair?: PairDraft;
}

interface RemoveDraft {
  readonly type: 'remove';
  readonly target: DiffLocation;
  readonly pair?: PairDraft;
}

interface ModifyDraft {
  readonly type: 'modify';
  readonly kind: DiffEntityKind;
  readonly pair: PairDraft;
  readonly before: DiffLocation;
  readonly after: DiffLocation;
  readonly properties: readonly DiffPropertyChange[];
}

type ChangeDraft = AddDraft | RemoveDraft | ModifyDraft;

interface MoveDraft {
  readonly pair: PairDraft;
  readonly remove: RemoveDraft;
  readonly add: AddDraft;
}

const defaultMatching: readonly DiffMatchingStrategy[] = [
  { kind: 'scratch-id' },
  { kind: 'ordered' },
  { kind: 'similarity' },
];

const cloneJson = <T extends JsonValue>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const pathWith = (
  path: readonly AstPathSegment[],
  ...segments: readonly AstPathSegment[]
): readonly AstPathSegment[] => [...path, ...segments];

const scratchIdFor = (node: Script | Block | Input | Field): string | undefined => {
  if (node.kind === 'block') {
    const id = node.metadata?.scratch?.id;
    return id === undefined || id.length === 0 ? undefined : id;
  }
  if (
    node.kind === 'input' &&
    node.type !== 'block' &&
    node.type !== 'script' &&
    node.type !== 'empty'
  ) {
    const id = node.metadata?.scratch?.id;
    return id === undefined || id.length === 0 ? undefined : id;
  }
  return undefined;
};

const locationFor = (
  kind: DiffEntityKind,
  path: readonly AstPathSegment[],
  node?: Script | Block | Input | Field,
): DiffLocation => {
  const scratchId = node === undefined ? undefined : scratchIdFor(node);
  return {
    kind,
    path: [...path],
    ...(scratchId === undefined ? {} : { scratchId }),
  };
};

const createTreeIndex = (scripts: readonly Script[]): TreeIndex => {
  const index: TreeIndex = {
    scripts: new Map(),
    blocks: new Map(),
    scriptOrder: [],
    blockOrder: [],
  };

  const visitInput = (input: Input | ObscuredShadow, path: readonly AstPathSegment[]): void => {
    if (input.type === 'block') {
      visitBlock(input.value, pathWith(path, 'value'), input, 'value');
    } else if (input.type === 'script') {
      visitScript(input.value, pathWith(path, 'value'), input, 'value');
    }
    if (input.obscuredShadow !== undefined) {
      visitInput(input.obscuredShadow, pathWith(path, 'obscuredShadow'));
    }
  };

  const visitBlock = (
    block: Block,
    path: readonly AstPathSegment[],
    parentOwner: Script | Input,
    parentRole: 'blocks' | 'value',
    childIndex?: number,
  ): void => {
    const info: NodeInfo<Block> = {
      node: block,
      location: locationFor('block', path, block),
      parentOwner,
      parentRole,
      ...(childIndex === undefined ? {} : { index: childIndex }),
    };
    index.blocks.set(block, info);
    index.blockOrder.push(info);
    for (const key of sortedKeys(block.inputs)) {
      visitInput(block.inputs[key]!, pathWith(path, 'inputs', key));
    }
  };

  const visitScript = (
    script: Script,
    path: readonly AstPathSegment[],
    parentOwner: Input | null,
    parentRole: 'scripts' | 'value',
    childIndex?: number,
  ): void => {
    const info: NodeInfo<Script> = {
      node: script,
      location: locationFor('script', path, script),
      parentOwner,
      parentRole,
      ...(childIndex === undefined ? {} : { index: childIndex }),
    };
    index.scripts.set(script, info);
    index.scriptOrder.push(info);
    script.blocks.forEach((block, blockIndex) =>
      visitBlock(block, pathWith(path, 'blocks', blockIndex), script, 'blocks', blockIndex),
    );
  };

  scripts.forEach((script, scriptIndex) =>
    visitScript(script, ['scripts', scriptIndex], null, 'scripts', scriptIndex),
  );
  return index;
};

const stateAbsent = (): DiffValueState => ({ present: false });

const stateValue = (value: JsonValue): DiffValueState => ({
  present: true,
  value: cloneJson(value),
});

const stateEqual = (left: DiffValueState, right: DiffValueState): boolean => {
  if (left.present !== right.present) return false;
  return !left.present || (right.present && jsonEqual(left.value, right.value));
};

const property = (
  path: readonly AstPathSegment[],
  before: DiffValueState,
  after: DiffValueState,
): DiffPropertyChange | undefined =>
  stateEqual(before, after) ? undefined : { path: [...path], before, after };

const presentProperty = (
  path: readonly AstPathSegment[],
  before: JsonValue,
  after: JsonValue,
): DiffPropertyChange | undefined => property(path, stateValue(before), stateValue(after));

const pathCompare = (left: readonly AstPathSegment[], right: readonly AstPathSegment[]): number => {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index]!;
    const b = right[index]!;
    if (a === b) continue;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'number') return -1;
    if (typeof b === 'number') return 1;
    return a < b ? -1 : 1;
  }
  return left.length - right.length;
};

const isPathPrefix = (
  prefix: readonly AstPathSegment[],
  path: readonly AstPathSegment[],
): boolean =>
  prefix.length < path.length && prefix.every((segment, index) => segment === path[index]);

class DiffBuilder {
  readonly beforeIndex: TreeIndex;
  readonly afterIndex: TreeIndex;
  readonly strategies: readonly DiffMatchingStrategy[];
  readonly beforePairs = new Map<PairableNode, PairDraft>();
  readonly afterPairs = new Map<PairableNode, PairDraft>();
  readonly pairs: PairDraft[] = [];
  readonly changes: ChangeDraft[] = [];
  readonly comparedBlocks = new Set<PairDraft>();
  readonly comparedScripts = new Set<PairDraft>();
  readonly idBlockCandidates = new Map<Block, Block>();
  readonly idScriptCandidates = new Map<Script, Script>();

  constructor(
    before: readonly Script[],
    after: readonly Script[],
    strategies: readonly DiffMatchingStrategy[],
  ) {
    this.beforeIndex = createTreeIndex(before);
    this.afterIndex = createTreeIndex(after);
    this.strategies = strategies;
  }

  private registerPair(
    kind: DiffEntityKind,
    basis: DiffMatchBasis,
    beforeNode: PairableNode,
    afterNode: PairableNode,
    before: DiffLocation,
    after: DiffLocation,
  ): PairDraft | undefined {
    const existingBefore = this.beforePairs.get(beforeNode);
    const existingAfter = this.afterPairs.get(afterNode);
    if (existingBefore !== undefined || existingAfter !== undefined) {
      return existingBefore !== undefined && existingBefore === existingAfter
        ? existingBefore
        : undefined;
    }
    const pair: PairDraft = {
      kind,
      basis,
      before,
      after,
      beforeNode,
      afterNode,
      active: false,
    };
    this.beforePairs.set(beforeNode, pair);
    this.afterPairs.set(afterNode, pair);
    this.pairs.push(pair);
    return pair;
  }

  private activate(pair: PairDraft): PairDraft {
    pair.active = true;
    return pair;
  }

  prepareScratchIdPairs(): void {
    if (!this.strategies.some((strategy) => strategy.kind === 'scratch-id')) return;
    const beforeById = new Map<string, NodeInfo<Block>[]>();
    const afterById = new Map<string, NodeInfo<Block>[]>();
    const add = (target: Map<string, NodeInfo<Block>[]>, info: NodeInfo<Block>): void => {
      const id = info.location.scratchId;
      if (id === undefined) return;
      const existing = target.get(id);
      if (existing === undefined) target.set(id, [info]);
      else existing.push(info);
    };
    this.beforeIndex.blockOrder.forEach((info) => add(beforeById, info));
    this.afterIndex.blockOrder.forEach((info) => add(afterById, info));
    for (const [id, beforeInfos] of beforeById) {
      const afterInfos = afterById.get(id);
      if (beforeInfos.length !== 1 || afterInfos?.length !== 1) continue;
      const beforeInfo = beforeInfos[0]!;
      const afterInfo = afterInfos[0]!;
      this.idBlockCandidates.set(beforeInfo.node, afterInfo.node);
    }

    const beforeTopScripts = this.beforeIndex.scriptOrder.filter(
      (info) => info.parentOwner === null,
    );
    const afterTopScripts = this.afterIndex.scriptOrder.filter((info) => info.parentOwner === null);
    const beforeByIndex = new Map(
      beforeTopScripts.map((info) => [info.location.path[1] as number, info] as const),
    );
    const afterByIndex = new Map(
      afterTopScripts.map((info) => [info.location.path[1] as number, info] as const),
    );
    const forward = new Map<Script, Set<Script>>();
    const reverse = new Map<Script, Set<Script>>();
    for (const [beforeBlock, afterBlock] of this.idBlockCandidates) {
      const beforePath = this.beforeIndex.blocks.get(beforeBlock)!.location.path;
      const afterPath = this.afterIndex.blocks.get(afterBlock)!.location.path;
      const beforeRoot = beforeByIndex.get(beforePath[1] as number)?.node;
      const afterRoot = afterByIndex.get(afterPath[1] as number)?.node;
      if (beforeRoot === undefined || afterRoot === undefined) continue;
      const forwardTargets = forward.get(beforeRoot);
      if (forwardTargets === undefined) forward.set(beforeRoot, new Set([afterRoot]));
      else forwardTargets.add(afterRoot);
      const reverseSources = reverse.get(afterRoot);
      if (reverseSources === undefined) reverse.set(afterRoot, new Set([beforeRoot]));
      else reverseSources.add(beforeRoot);
    }
    for (const beforeInfo of beforeTopScripts) {
      const targets = forward.get(beforeInfo.node);
      if (targets?.size !== 1) continue;
      const afterNode = [...targets][0]!;
      if (reverse.get(afterNode)?.size !== 1) continue;
      this.idScriptCandidates.set(beforeInfo.node, afterNode);
    }
    if (this.strategies[0]?.kind === 'scratch-id') {
      for (const [beforeBlock, afterBlock] of this.idBlockCandidates) {
        const beforeInfo = this.beforeIndex.blocks.get(beforeBlock)!;
        const afterInfo = this.afterIndex.blocks.get(afterBlock)!;
        this.registerPair(
          'block',
          'scratch-id',
          beforeBlock,
          afterBlock,
          beforeInfo.location,
          afterInfo.location,
        );
      }
    }
  }

  private matchSequence<T extends Script | Block>(
    before: readonly NodeInfo<T>[],
    after: readonly NodeInfo<T>[],
  ): PairDraft[] {
    const afterNodes = new Set(after.map((info) => info.node));
    const afterInfoByNode = new Map(after.map((info) => [info.node, info] as const));
    const result: PairDraft[] = [];
    const selected = new Set<PairDraft>();
    const addPair = (pair: PairDraft | undefined): void => {
      if (pair === undefined || selected.has(pair)) return;
      selected.add(pair);
      result.push(pair);
    };

    for (const strategy of this.strategies) {
      if (strategy.kind === 'scratch-id') {
        for (const beforeInfo of before) {
          if (this.beforePairs.has(beforeInfo.node)) {
            const pair = this.beforePairs.get(beforeInfo.node)!;
            if (afterNodes.has(pair.afterNode as T)) addPair(pair);
            continue;
          }
          const afterNode =
            beforeInfo.node.kind === 'block'
              ? this.idBlockCandidates.get(beforeInfo.node)
              : this.idScriptCandidates.get(beforeInfo.node);
          if (afterNode === undefined || this.afterPairs.has(afterNode)) continue;
          const afterInfo = afterInfoByNode.get(afterNode as T);
          const registered = this.registerPair(
            beforeInfo.node.kind,
            'scratch-id',
            beforeInfo.node,
            afterNode,
            beforeInfo.location,
            afterInfo?.location ??
              (afterNode.kind === 'block'
                ? this.afterIndex.blocks.get(afterNode)!.location
                : this.afterIndex.scripts.get(afterNode)!.location),
          );
          if (afterInfo !== undefined) addPair(registered);
        }
        continue;
      }
      const remainingBefore = before.filter((info) => !this.beforePairs.has(info.node));
      const remainingAfter = after.filter((info) => !this.afterPairs.has(info.node));
      const beforeGroups = new Map<string, NodeInfo<T>[]>();
      const afterGroups = new Map<string, NodeInfo<T>[]>();
      const keyFor = (node: T): string =>
        strategy.kind === 'ordered'
          ? semanticFingerprint(node)
          : node.kind === 'block'
            ? blockSimilarityKey(node)
            : scriptSimilarityKey(node);
      const group = (target: Map<string, NodeInfo<T>[]>, info: NodeInfo<T>): void => {
        const key = keyFor(info.node);
        const existing = target.get(key);
        if (existing === undefined) target.set(key, [info]);
        else existing.push(info);
      };
      remainingBefore.forEach((info) => group(beforeGroups, info));
      remainingAfter.forEach((info) => group(afterGroups, info));
      const occurrences = new Map<string, number>();
      for (const beforeInfo of remainingBefore) {
        if (this.beforePairs.has(beforeInfo.node)) continue;
        const key = keyFor(beforeInfo.node);
        const beforeGroup = beforeGroups.get(key) ?? [];
        const afterGroup = afterGroups.get(key) ?? [];
        if (afterGroup.length === 0) continue;
        if (strategy.kind === 'similarity' && (beforeGroup.length !== 1 || afterGroup.length !== 1))
          continue;
        const occurrence = occurrences.get(key) ?? 0;
        occurrences.set(key, occurrence + 1);
        const afterInfo = afterGroup[occurrence];
        if (afterInfo === undefined || this.afterPairs.has(afterInfo.node)) continue;
        addPair(
          this.registerPair(
            beforeInfo.node.kind,
            strategy.kind,
            beforeInfo.node,
            afterInfo.node,
            beforeInfo.location,
            afterInfo.location,
          ),
        );
      }
    }
    return result;
  }

  private matchSingle<T extends Script | Block>(
    before: NodeInfo<T>,
    after: NodeInfo<T>,
  ): PairDraft | undefined {
    const existingBefore = this.beforePairs.get(before.node);
    const existingAfter = this.afterPairs.get(after.node);
    if (existingBefore !== undefined || existingAfter !== undefined) {
      return existingBefore !== undefined && existingBefore === existingAfter
        ? existingBefore
        : undefined;
    }
    for (const strategy of this.strategies) {
      if (strategy.kind === 'scratch-id') {
        const afterNode =
          before.node.kind === 'block'
            ? this.idBlockCandidates.get(before.node)
            : this.idScriptCandidates.get(before.node);
        if (afterNode === after.node) {
          return this.registerPair(
            before.node.kind,
            'scratch-id',
            before.node,
            after.node,
            before.location,
            after.location,
          );
        }
        continue;
      }
      const matches =
        strategy.kind === 'ordered'
          ? semanticFingerprint(before.node) === semanticFingerprint(after.node)
          : before.node.kind === 'block' && after.node.kind === 'block'
            ? blockSimilarityKey(before.node) === blockSimilarityKey(after.node)
            : before.node.kind === 'script' && after.node.kind === 'script'
              ? scriptSimilarityKey(before.node) === scriptSimilarityKey(after.node)
              : false;
      if (matches) {
        return this.registerPair(
          before.node.kind,
          strategy.kind,
          before.node,
          after.node,
          before.location,
          after.location,
        );
      }
    }
    return undefined;
  }

  private pairKeyed(
    kind: 'input' | 'field' | 'mutation',
    beforeNode: Input | Field | SemanticMutation,
    afterNode: Input | Field | SemanticMutation,
    beforePath: readonly AstPathSegment[],
    afterPath: readonly AstPathSegment[],
  ): PairDraft {
    const beforeLocation = locationFor(
      kind,
      beforePath,
      kind === 'mutation' ? undefined : (beforeNode as Input | Field),
    );
    const afterLocation = locationFor(
      kind,
      afterPath,
      kind === 'mutation' ? undefined : (afterNode as Input | Field),
    );
    const pair = this.registerPair(
      kind,
      'key',
      beforeNode,
      afterNode,
      beforeLocation,
      afterLocation,
    );
    if (pair === undefined) throw new TypeError('Conflicting keyed diff pair.');
    return this.activate(pair);
  }

  private add(target: DiffLocation, pair?: PairDraft): AddDraft {
    const draft: AddDraft = { type: 'add', target, ...(pair === undefined ? {} : { pair }) };
    if (pair !== undefined) this.activate(pair);
    this.changes.push(draft);
    return draft;
  }

  private remove(target: DiffLocation, pair?: PairDraft): RemoveDraft {
    const draft: RemoveDraft = {
      type: 'remove',
      target,
      ...(pair === undefined ? {} : { pair }),
    };
    if (pair !== undefined) this.activate(pair);
    this.changes.push(draft);
    return draft;
  }

  private modify(pair: PairDraft, properties: readonly DiffPropertyChange[]): void {
    if (properties.length === 0) return;
    this.activate(pair);
    this.changes.push({
      type: 'modify',
      kind: pair.kind,
      pair,
      before: pair.before,
      after: pair.after,
      properties,
    });
  }

  diffTopScripts(): void {
    const before = this.beforeIndex.scriptOrder.filter((info) => info.parentOwner === null);
    const after = this.afterIndex.scriptOrder.filter((info) => info.parentOwner === null);
    this.diffScriptSequence(before, after);
  }

  private diffScriptSequence(
    before: readonly NodeInfo<Script>[],
    after: readonly NodeInfo<Script>[],
  ): void {
    const localPairs = this.matchSequence(before, after);
    const localBefore = new Set(localPairs.map((pair) => pair.beforeNode));
    const localAfter = new Set(localPairs.map((pair) => pair.afterNode));
    for (const info of before) {
      if (!localBefore.has(info.node)) this.remove(info.location);
    }
    for (const info of after) {
      if (!localAfter.has(info.node)) this.add(info.location);
    }
    for (const pair of localPairs) this.diffScript(this.activate(pair));
  }

  private diffScript(pair: PairDraft): void {
    if (this.comparedScripts.has(pair)) return;
    this.comparedScripts.add(pair);
    const before = pair.beforeNode as Script;
    const after = pair.afterNode as Script;
    const beforeInfos = before.blocks.map((block) => this.beforeIndex.blocks.get(block)!);
    const afterInfos = after.blocks.map((block) => this.afterIndex.blocks.get(block)!);
    this.diffBlockSequence(beforeInfos, afterInfos);
  }

  private diffBlockSequence(
    before: readonly NodeInfo<Block>[],
    after: readonly NodeInfo<Block>[],
  ): void {
    const localPairs = this.matchSequence(before, after);
    const localBefore = new Set(localPairs.map((pair) => pair.beforeNode));
    const localAfter = new Set(localPairs.map((pair) => pair.afterNode));
    for (const info of before) {
      if (localBefore.has(info.node)) continue;
      this.remove(info.location, this.beforePairs.get(info.node));
    }
    for (const info of after) {
      if (localAfter.has(info.node)) continue;
      this.add(info.location, this.afterPairs.get(info.node));
    }
    for (const pair of localPairs) this.diffBlock(this.activate(pair));
  }

  private diffBlock(pair: PairDraft): void {
    if (this.comparedBlocks.has(pair)) return;
    this.comparedBlocks.add(pair);
    const before = pair.beforeNode as Block;
    const after = pair.afterNode as Block;
    const ownProperties = [
      presentProperty(['opcode'], before.opcode, after.opcode),
      property(
        ['shadow'],
        before.shadow === true ? stateValue(true) : stateAbsent(),
        after.shadow === true ? stateValue(true) : stateAbsent(),
      ),
    ].filter((change): change is DiffPropertyChange => change !== undefined);
    this.modify(pair, ownProperties);
    this.diffMutation(before, after, pair.before.path, pair.after.path);
    this.diffFields(before, after, pair.before.path, pair.after.path);
    this.diffInputs(before, after, pair.before.path, pair.after.path);
  }

  private diffMutation(
    beforeBlock: Block,
    afterBlock: Block,
    beforeBlockPath: readonly AstPathSegment[],
    afterBlockPath: readonly AstPathSegment[],
  ): void {
    const before = beforeBlock.mutation;
    const after = afterBlock.mutation;
    const beforePath = pathWith(beforeBlockPath, 'mutation');
    const afterPath = pathWith(afterBlockPath, 'mutation');
    if (before === undefined) {
      if (after !== undefined) this.add(locationFor('mutation', afterPath));
      return;
    }
    if (after === undefined) {
      this.remove(locationFor('mutation', beforePath));
      return;
    }
    const pair = this.pairKeyed('mutation', before, after, beforePath, afterPath);
    const beforeRecord = before as unknown as Record<string, JsonValue | undefined>;
    const afterRecord = after as unknown as Record<string, JsonValue | undefined>;
    const keys = [...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])].sort();
    const properties = keys.flatMap((key) => {
      const beforeValue = beforeRecord[key];
      const afterValue = afterRecord[key];
      const change = property(
        [key],
        beforeValue === undefined ? stateAbsent() : stateValue(beforeValue),
        afterValue === undefined ? stateAbsent() : stateValue(afterValue),
      );
      return change === undefined ? [] : [change];
    });
    this.modify(pair, properties);
  }

  private diffFields(
    beforeBlock: Block,
    afterBlock: Block,
    beforeBlockPath: readonly AstPathSegment[],
    afterBlockPath: readonly AstPathSegment[],
  ): void {
    const keys = [
      ...new Set([...Object.keys(beforeBlock.fields), ...Object.keys(afterBlock.fields)]),
    ].sort();
    for (const key of keys) {
      const before = beforeBlock.fields[key];
      const after = afterBlock.fields[key];
      const beforePath = pathWith(beforeBlockPath, 'fields', key);
      const afterPath = pathWith(afterBlockPath, 'fields', key);
      if (before === undefined) {
        if (after !== undefined) this.add(locationFor('field', afterPath, after));
        continue;
      }
      if (after === undefined) {
        this.remove(locationFor('field', beforePath, before));
        continue;
      }
      const pair = this.pairKeyed('field', before, after, beforePath, afterPath);
      const beforeId =
        'id' in before && before.id !== undefined ? stateValue(before.id) : stateAbsent();
      const afterId =
        'id' in after && after.id !== undefined ? stateValue(after.id) : stateAbsent();
      const properties = [
        presentProperty(['type'], before.type, after.type),
        presentProperty(['value'], before.value, after.value),
        property(['id'], beforeId, afterId),
      ].filter((change): change is DiffPropertyChange => change !== undefined);
      this.modify(pair, properties);
    }
  }

  private diffInputs(
    beforeBlock: Block,
    afterBlock: Block,
    beforeBlockPath: readonly AstPathSegment[],
    afterBlockPath: readonly AstPathSegment[],
  ): void {
    const keys = [
      ...new Set([...Object.keys(beforeBlock.inputs), ...Object.keys(afterBlock.inputs)]),
    ].sort();
    for (const key of keys) {
      const before = beforeBlock.inputs[key];
      const after = afterBlock.inputs[key];
      const beforePath = pathWith(beforeBlockPath, 'inputs', key);
      const afterPath = pathWith(afterBlockPath, 'inputs', key);
      if (before === undefined) {
        if (after !== undefined) this.add(locationFor('input', afterPath, after));
        continue;
      }
      if (after === undefined) {
        this.remove(locationFor('input', beforePath, before));
        continue;
      }
      const pair = this.pairKeyed('input', before, after, beforePath, afterPath);
      this.diffInput(before, after, pair);
    }
  }

  private diffInput(
    before: Input | ObscuredShadow,
    after: Input | ObscuredShadow,
    pair: PairDraft,
  ): void {
    const scalar = (input: Input | ObscuredShadow): JsonValue | undefined =>
      input.type === 'block' || input.type === 'script' || input.type === 'empty'
        ? undefined
        : input.value;
    const beforeScalar = scalar(before);
    const afterScalar = scalar(after);
    const properties = [
      presentProperty(['type'], before.type, after.type),
      property(
        ['value'],
        beforeScalar === undefined ? stateAbsent() : stateValue(beforeScalar),
        afterScalar === undefined ? stateAbsent() : stateValue(afterScalar),
      ),
    ].filter((change): change is DiffPropertyChange => change !== undefined);
    this.modify(pair, properties);
    this.diffInputValue(before, after, pair.before.path, pair.after.path);
    this.diffObscuredShadow(before, after, pair.before.path, pair.after.path);
  }

  private diffInputValue(
    before: Input | ObscuredShadow,
    after: Input | ObscuredShadow,
    beforePath: readonly AstPathSegment[],
    afterPath: readonly AstPathSegment[],
  ): void {
    if (before.type === 'block' && after.type === 'block') {
      this.diffSingleBlock(
        this.beforeIndex.blocks.get(before.value)!,
        this.afterIndex.blocks.get(after.value)!,
      );
      return;
    }
    if (before.type === 'script' && after.type === 'script') {
      this.diffSingleScript(
        this.beforeIndex.scripts.get(before.value)!,
        this.afterIndex.scripts.get(after.value)!,
      );
      return;
    }
    if (before.type === 'block') {
      const info = this.beforeIndex.blocks.get(before.value)!;
      this.remove(info.location, this.beforePairs.get(before.value));
    } else if (before.type === 'script') {
      this.remove(this.beforeIndex.scripts.get(before.value)!.location);
    }
    if (after.type === 'block') {
      const info = this.afterIndex.blocks.get(after.value)!;
      this.add(info.location, this.afterPairs.get(after.value));
    } else if (after.type === 'script') {
      this.add(this.afterIndex.scripts.get(after.value)!.location);
    }
    void [beforePath, afterPath];
  }

  private diffObscuredShadow(
    before: Input | ObscuredShadow,
    after: Input | ObscuredShadow,
    beforePath: readonly AstPathSegment[],
    afterPath: readonly AstPathSegment[],
  ): void {
    const beforeShadow = before.obscuredShadow;
    const afterShadow = after.obscuredShadow;
    const beforeShadowPath = pathWith(beforePath, 'obscuredShadow');
    const afterShadowPath = pathWith(afterPath, 'obscuredShadow');
    if (beforeShadow === undefined) {
      if (afterShadow !== undefined) this.add(locationFor('input', afterShadowPath, afterShadow));
      return;
    }
    if (afterShadow === undefined) {
      this.remove(locationFor('input', beforeShadowPath, beforeShadow));
      return;
    }
    const pair = this.pairKeyed(
      'input',
      beforeShadow,
      afterShadow,
      beforeShadowPath,
      afterShadowPath,
    );
    this.diffInput(beforeShadow, afterShadow, pair);
  }

  private diffSingleBlock(before: NodeInfo<Block>, after: NodeInfo<Block>): void {
    const pair = this.matchSingle(before, after);
    if (pair === undefined) {
      this.remove(before.location, this.beforePairs.get(before.node));
      this.add(after.location, this.afterPairs.get(after.node));
      return;
    }
    this.diffBlock(this.activate(pair));
  }

  private diffSingleScript(before: NodeInfo<Script>, after: NodeInfo<Script>): void {
    const pair = this.matchSingle(before, after);
    if (pair === undefined) {
      this.remove(before.location);
      this.add(after.location);
      return;
    }
    this.diffScript(this.activate(pair));
  }

  compareExternalIdPairs(): void {
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (const info of this.beforeIndex.blockOrder) {
        const pair = this.beforePairs.get(info.node);
        if (
          pair?.basis !== 'scratch-id' ||
          this.comparedBlocks.has(pair) ||
          !this.parentIsAvailable(info, this.beforePairs)
        )
          continue;
        const afterInfo = this.afterIndex.blocks.get(pair.afterNode as Block);
        if (afterInfo === undefined || !this.parentIsAvailable(afterInfo, this.afterPairs))
          continue;
        this.diffBlock(this.activate(pair));
        progressed = true;
      }
    }
  }

  private parentIsAvailable<T extends Script | Block>(
    info: NodeInfo<T>,
    pairs: Map<PairableNode, PairDraft>,
  ): boolean {
    if (info.parentOwner === null) return true;
    return pairs.get(info.parentOwner)?.active === true;
  }

  private parentEquivalent(
    before: NodeInfo<Script | Block>,
    after: NodeInfo<Script | Block>,
  ): boolean {
    if (before.parentOwner === null || after.parentOwner === null) {
      return (
        before.parentOwner === null &&
        after.parentOwner === null &&
        before.parentRole === after.parentRole
      );
    }
    const ownerPair = this.beforePairs.get(before.parentOwner);
    return (
      ownerPair?.active === true &&
      ownerPair.afterNode === after.parentOwner &&
      before.parentRole === after.parentRole
    );
  }

  private longestIncreasingPairs(pairs: readonly PairDraft[]): Set<PairDraft> {
    const previous = new Array<number>(pairs.length).fill(-1);
    const tails: number[] = [];
    const afterIndex = (pair: PairDraft): number =>
      this.afterIndex.blocks.get(pair.afterNode as Block)?.index ??
      this.afterIndex.scripts.get(pair.afterNode as Script)?.index ??
      0;
    for (let current = 0; current < pairs.length; current += 1) {
      const value = afterIndex(pairs[current]!);
      let low = 0;
      let high = tails.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (afterIndex(pairs[tails[middle]!]!) < value) low = middle + 1;
        else high = middle;
      }
      if (low > 0) previous[current] = tails[low - 1]!;
      tails[low] = current;
    }
    const kept = new Set<PairDraft>();
    for (let cursor = tails.at(-1) ?? -1; cursor >= 0; cursor = previous[cursor]!)
      kept.add(pairs[cursor]!);
    return kept;
  }

  detectMoves(): MoveDraft[] {
    const moved = new Set<PairDraft>();
    const activePairs = this.pairs.filter((pair) => pair.active);
    for (const pair of activePairs) {
      if (pair.kind !== 'block' && pair.kind !== 'script') continue;
      const beforeInfo =
        pair.kind === 'block'
          ? this.beforeIndex.blocks.get(pair.beforeNode as Block)
          : this.beforeIndex.scripts.get(pair.beforeNode as Script);
      const afterInfo =
        pair.kind === 'block'
          ? this.afterIndex.blocks.get(pair.afterNode as Block)
          : this.afterIndex.scripts.get(pair.afterNode as Script);
      if (
        beforeInfo !== undefined &&
        afterInfo !== undefined &&
        !this.parentEquivalent(beforeInfo, afterInfo)
      )
        moved.add(pair);
    }

    const sequenceGroups: PairDraft[][] = [];
    const topScripts = activePairs
      .filter((pair) => pair.kind === 'script')
      .filter((pair) => {
        const before = this.beforeIndex.scripts.get(pair.beforeNode as Script)!;
        const after = this.afterIndex.scripts.get(pair.afterNode as Script)!;
        return before.parentOwner === null && after.parentOwner === null;
      })
      .sort(
        (left, right) =>
          (this.beforeIndex.scripts.get(left.beforeNode as Script)?.index ?? 0) -
          (this.beforeIndex.scripts.get(right.beforeNode as Script)?.index ?? 0),
      );
    sequenceGroups.push(topScripts);

    for (const scriptPair of activePairs.filter((pair) => pair.kind === 'script')) {
      const beforeScript = scriptPair.beforeNode as Script;
      const afterScript = scriptPair.afterNode as Script;
      const children = activePairs
        .filter((pair) => pair.kind === 'block')
        .filter((pair) => {
          const before = this.beforeIndex.blocks.get(pair.beforeNode as Block)!;
          const after = this.afterIndex.blocks.get(pair.afterNode as Block)!;
          return before.parentOwner === beforeScript && after.parentOwner === afterScript;
        })
        .sort(
          (left, right) =>
            (this.beforeIndex.blocks.get(left.beforeNode as Block)?.index ?? 0) -
            (this.beforeIndex.blocks.get(right.beforeNode as Block)?.index ?? 0),
        );
      sequenceGroups.push(children);
    }
    for (const group of sequenceGroups) {
      const kept = this.longestIncreasingPairs(group);
      for (const pair of group) if (!kept.has(pair)) moved.add(pair);
    }

    const orderedMoved = [...moved].sort((left, right) => {
      const length = left.before.path.length - right.before.path.length;
      return length !== 0 ? length : pathCompare(left.before.path, right.before.path);
    });
    const roots: PairDraft[] = [];
    for (const pair of orderedMoved) {
      if (
        roots.some(
          (root) =>
            isPathPrefix(root.before.path, pair.before.path) &&
            isPathPrefix(root.after.path, pair.after.path),
        )
      )
        continue;
      roots.push(pair);
    }

    return roots.map((pair) => {
      let remove = this.changes.find(
        (change): change is RemoveDraft => change.type === 'remove' && change.pair === pair,
      );
      let add = this.changes.find(
        (change): change is AddDraft => change.type === 'add' && change.pair === pair,
      );
      remove ??= this.remove(pair.before, pair);
      add ??= this.add(pair.after, pair);
      return { pair, remove, add };
    });
  }

  finish(moveDrafts: readonly MoveDraft[]): SemanticDiffV1 {
    const activePairs = this.pairs
      .filter((pair) => pair.active)
      .sort((left, right) => {
        const before = pathCompare(left.before.path, right.before.path);
        return before !== 0 ? before : pathCompare(left.after.path, right.after.path);
      });
    const pairIds = new Map(activePairs.map((pair, index) => [pair, `pair-${String(index)}`]));
    const pairs: DiffPair[] = activePairs.map((pair) => ({
      id: pairIds.get(pair)!,
      kind: pair.kind,
      basis: pair.basis,
      before: pair.before,
      after: pair.after,
    }));
    const changeIds = new Map<ChangeDraft, string>();
    const changes: DiffChange[] = this.changes.map((change, index) => {
      const id = `change-${String(index)}`;
      changeIds.set(change, id);
      if (change.type === 'add' || change.type === 'remove') {
        return {
          id,
          type: change.type,
          target: change.target,
          ...(change.pair === undefined ? {} : { pairId: pairIds.get(change.pair)! }),
        };
      }
      const result: DiffModifyChange = {
        id,
        type: 'modify',
        kind: change.kind,
        pairId: pairIds.get(change.pair)!,
        before: change.before,
        after: change.after,
        properties: change.properties,
      };
      return result;
    });
    const relations: DiffMoveRelation[] = moveDrafts.map((move, index) => ({
      id: `relation-${String(index)}`,
      type: 'move',
      pairId: pairIds.get(move.pair)!,
      before: move.pair.before,
      after: move.pair.after,
      removeChangeId: changeIds.get(move.remove)!,
      addChangeId: changeIds.get(move.add)!,
    }));
    return { version: 1, pairs, changes, relations };
  }
}

const inputDiagnostics = (
  before: readonly Script[],
  after: readonly Script[],
): readonly { side: 'before' | 'after'; diagnostics: readonly AstDiagnostic[] }[] => {
  const beforeDiagnostics = validateScripts(before);
  const afterDiagnostics = validateScripts(after);
  return [
    ...(beforeDiagnostics.length === 0
      ? []
      : [{ side: 'before' as const, diagnostics: beforeDiagnostics }]),
    ...(afterDiagnostics.length === 0
      ? []
      : [{ side: 'after' as const, diagnostics: afterDiagnostics }]),
  ];
};

/** Compare semantic scripts without consulting a block registry or modifying either input. */
export const diffScripts = (
  before: readonly Script[],
  after: readonly Script[],
  options: DiffScriptsOptions = {},
): SemanticDiffV1 => {
  const diagnostics = inputDiagnostics(before, after);
  if (diagnostics.length > 0) throw new InvalidDiffInputError(diagnostics);
  const builder = new DiffBuilder(before, after, options.matching ?? defaultMatching);
  builder.prepareScratchIdPairs();
  builder.diffTopScripts();
  builder.compareExternalIdPairs();
  const moves = builder.detectMoves();
  const result = builder.finish(moves);
  assertJsonValue(result);
  return result;
};
