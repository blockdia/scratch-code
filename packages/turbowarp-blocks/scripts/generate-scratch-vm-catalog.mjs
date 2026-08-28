import fs from 'node:fs';
import path from 'node:path';

import { extractScratchVm } from './extract-scratch-vm.mjs';

const root = path.resolve(process.argv[2] ?? '');
const output = path.resolve(process.argv[3] ?? 'src/generated/scratch-vm-data.ts');
const manifestOutput = path.resolve(process.argv[4] ?? 'builtin-extensions-source-manifest.json');
const extensions = extractScratchVm(root);
const contents =
  '// Generated from the pinned scratch-vm source. Do not edit by hand.\n' +
  `export const scratchVmExtensionRecords = ${JSON.stringify(extensions, null, 2)} as const\n`;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, contents);
fs.writeFileSync(manifestOutput, `${JSON.stringify(extensions, null, 2)}\n`);
process.exit(0);
