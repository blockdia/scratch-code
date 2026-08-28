import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import { createTurboWarpBlockRegistry } from '@scratch-code/turbowarp-blocks';
import {
  deserializeSb3Blocks,
  InvalidBlockGraphError,
  serializeSb3Blocks,
} from '@scratch-code/sb3';

const directory = process.argv.slice(2).find((argument) => argument !== '--');
if (!directory) throw new Error('Usage: test:corpus -- /path/to/sb3-projects');

const registry = createTurboWarpBlockRegistry();
const primitiveOpcodes = { 12: 'data_variable', 13: 'data_listcontents' };
let checkedProjects = 0;
let checkedTargets = 0;
let checkedBlocks = 0;
let skippedProjects = 0;
let rejectedTargets = 0;
let sourceBytes = 0;
let semanticAstBytes = 0;
let fullAstBytes = 0;

const semanticAst = (scripts) =>
  JSON.parse(
    JSON.stringify(scripts, (key, value) => {
      if (key !== 'metadata' || typeof value !== 'object' || value === null) return value;
      const scratch = value.scratch;
      return scratch === undefined ? undefined : { scratch };
    }),
  );

const firstDifference = (actual, expected, path = 'blocks') => {
  if (Object.is(actual, expected)) return null;
  if (
    typeof actual !== 'object' ||
    actual === null ||
    typeof expected !== 'object' ||
    expected === null
  ) {
    return `${path}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`;
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) return `${path}: container type differs`;
  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);
  for (const key of new Set([...actualKeys, ...expectedKeys])) {
    if (!(key in actual)) return `${path}.${key}: missing from actual`;
    if (!(key in expected)) return `${path}.${key}: unexpected in actual`;
    const difference = firstDifference(actual[key], expected[key], `${path}.${key}`);
    if (difference) return difference;
  }
  return null;
};

for (const filename of readdirSync(directory)
  .filter((name) => name.endsWith('.sb3'))
  .sort()) {
  const path = resolve(directory, filename);
  const project = JSON.parse(
    execFileSync('unzip', ['-p', path, 'project.json'], {
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024,
    }),
  );
  const missing = new Set();
  for (const target of project.targets) {
    for (const block of Object.values(target.blocks)) {
      const opcode = Array.isArray(block) ? primitiveOpcodes[block[0]] : block.opcode;
      if (opcode && !registry.has(opcode)) missing.add(opcode);
    }
  }
  if (missing.size > 0) {
    skippedProjects += 1;
    console.log(`SKIP ${basename(path)}: ${[...missing].sort().join(', ')}`);
    continue;
  }
  for (const target of project.targets) {
    let firstAst;
    try {
      firstAst = deserializeSb3Blocks(target.blocks, registry);
    } catch (error) {
      if (!(error instanceof InvalidBlockGraphError)) throw error;
      rejectedTargets += 1;
      console.log(`REJECT ${basename(path)} / ${target.name}: ${error.message}`);
      continue;
    }
    const firstCanonical = serializeSb3Blocks(firstAst);
    const secondAst = deserializeSb3Blocks(firstCanonical, registry);
    const secondCanonical = serializeSb3Blocks(secondAst);
    const semanticDifference = firstDifference(
      semanticAst(secondAst),
      semanticAst(firstAst),
      'ast',
    );
    if (semanticDifference) throw new Error(`${filename} / ${target.name}: ${semanticDifference}`);
    const canonicalDifference = firstDifference(secondCanonical, firstCanonical);
    if (canonicalDifference)
      throw new Error(
        `${filename} / ${target.name}: unstable canonical form: ${canonicalDifference}`,
      );
    checkedTargets += 1;
    checkedBlocks += Object.keys(target.blocks).length;
    sourceBytes += JSON.stringify(target.blocks).length;
    semanticAstBytes += JSON.stringify(semanticAst(firstAst)).length;
    fullAstBytes += JSON.stringify(firstAst).length;
  }
  checkedProjects += 1;
}

console.log(
  JSON.stringify({
    checkedProjects,
    checkedTargets,
    checkedBlocks,
    skippedProjects,
    rejectedTargets,
    sourceBytes,
    semanticAstBytes,
    fullAstBytes,
    provenanceBytes: fullAstBytes - semanticAstBytes,
  }),
);
