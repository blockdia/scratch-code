import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = process.argv.slice(2).filter((argument) => argument !== '--');
if (args.length !== 2) {
  throw new Error('Usage: pnpm test:corpus -- /path/to/scratch-vm /path/to/sb3-projects');
}

const vmPath = resolve(args[0]);
const corpusPath = resolve(args[1]);
const run = (commandArgs) => {
  const result = spawnSync('pnpm', commandArgs, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(['--filter', '@scratch-code/sb3', 'test:corpus', '--', corpusPath]);
run(['--filter', '@scratch-code/vm-blocks', 'test:vm', '--', vmPath]);
run(['--filter', '@scratch-code/vm-blocks', 'test:corpus', '--', vmPath, corpusPath]);
