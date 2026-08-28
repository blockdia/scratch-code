import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arguments_ = process.argv.slice(2).filter((argument) => argument !== '--');
const dryRun = arguments_.includes('--dry-run');
const provenance = arguments_.includes('--provenance');
const unknownArguments = arguments_.filter(
  (argument) => argument !== '--dry-run' && argument !== '--provenance',
);

if (unknownArguments.length > 0) {
  throw new Error(`Unknown release arguments: ${unknownArguments.join(', ')}`);
}
if (dryRun && provenance) {
  throw new Error('--dry-run and --provenance cannot be used together.');
}
if (!dryRun) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    if (process.env.GITHUB_REF !== 'refs/heads/main') {
      throw new Error('GitHub releases must run from refs/heads/main.');
    }
  } else {
    const branch = execFileSync('git', ['branch', '--show-current'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }).trim();
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }).trim();
    if (branch !== 'main') throw new Error('Local releases must run from the main branch.');
    if (status.length > 0) throw new Error('Local releases require a clean working tree.');
  }
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const packageDirectories = readdirSync(join(repositoryRoot, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(repositoryRoot, 'packages', entry.name))
  .filter((directory) => existsSync(join(directory, 'package.json')));
const packages = packageDirectories
  .map((directory) => ({ directory, manifest: readJson(join(directory, 'package.json')) }))
  .filter(({ manifest }) => manifest.private !== true);
const packagesByName = new Map(packages.map((package_) => [package_.manifest.name, package_]));

const orderedPackages = [];
const visiting = new Set();
const visited = new Set();
const visit = (package_) => {
  const name = package_.manifest.name;
  if (visited.has(name)) return;
  if (visiting.has(name)) throw new Error(`Cyclic publish dependency involving ${name}.`);
  visiting.add(name);
  for (const dependencyName of Object.keys({
    ...package_.manifest.dependencies,
    ...package_.manifest.optionalDependencies,
    ...package_.manifest.peerDependencies,
  })) {
    const dependency = packagesByName.get(dependencyName);
    if (dependency) visit(dependency);
  }
  visiting.delete(name);
  visited.add(name);
  orderedPackages.push(package_);
};
for (const package_ of packages) visit(package_);

const expectedRepositoryUrl = 'git+https://github.com/blockdia/scratch-code.git';
const expectedRegistry = 'https://registry.npmjs.org/';
const validateSourceManifest = ({ directory, manifest }) => {
  const relativeDirectory = directory.slice(repositoryRoot.length + 1);
  if (typeof manifest.name !== 'string' || !manifest.name.startsWith('@scratch-code/')) {
    throw new Error(`${relativeDirectory} has an invalid publish name.`);
  }
  if (manifest.repository?.url !== expectedRepositoryUrl) {
    throw new Error(`${manifest.name} must publish from ${expectedRepositoryUrl}.`);
  }
  if (manifest.repository?.directory !== relativeDirectory) {
    throw new Error(`${manifest.name} has an incorrect repository.directory.`);
  }
  if (manifest.publishConfig?.access !== 'public') {
    throw new Error(`${manifest.name} must set publishConfig.access to public.`);
  }
  if (manifest.publishConfig?.registry !== expectedRegistry) {
    throw new Error(`${manifest.name} must publish to ${expectedRegistry}.`);
  }
};
for (const package_ of orderedPackages) validateSourceManifest(package_);

const collectExportTargets = (value, targets = []) => {
  if (typeof value === 'string') {
    if (value.startsWith('./')) targets.push(value.slice(2));
    return targets;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectExportTargets(nested, targets);
  }
  return targets;
};
const containsWorkspaceProtocol = (value) =>
  value &&
  typeof value === 'object' &&
  Object.values(value).some(
    (nested) =>
      (typeof nested === 'string' && nested.startsWith('workspace:')) ||
      containsWorkspaceProtocol(nested),
  );
const validateArchive = (archive) => {
  const entries = new Set(
    execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n'),
  );
  for (const required of ['package/package.json', 'package/README.md', 'package/LICENSE']) {
    if (!entries.has(required)) throw new Error(`${basename(archive)} is missing ${required}.`);
  }
  if ([...entries].some((entry) => /^package\/(src|test)\//u.test(entry))) {
    throw new Error(`${basename(archive)} contains source or test files.`);
  }
  const manifest = JSON.parse(
    execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }),
  );
  if (containsWorkspaceProtocol(manifest)) {
    throw new Error(`${manifest.name} still contains a workspace: dependency.`);
  }
  for (const target of collectExportTargets(manifest.exports)) {
    if (!entries.has(`package/${target}`)) {
      throw new Error(`${manifest.name} exports missing file ${target}.`);
    }
  }
  return manifest;
};

const archiveDirectory = mkdtempSync(join(tmpdir(), 'scratch-code-release-'));
try {
  const archives = [];
  for (const package_ of orderedPackages) {
    const before = new Set(readdirSync(archiveDirectory));
    const result = spawnSync(
      'pnpm',
      ['--dir', package_.directory, 'pack', '--pack-destination', archiveDirectory],
      { cwd: repositoryRoot, stdio: 'inherit' },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
    const created = readdirSync(archiveDirectory).filter(
      (name) => name.endsWith('.tgz') && !before.has(name),
    );
    if (created.length !== 1) {
      throw new Error(`${package_.manifest.name} produced ${created.length} release archives.`);
    }
    const archive = join(archiveDirectory, created[0]);
    const packedManifest = validateArchive(archive);
    if (
      packedManifest.name !== package_.manifest.name ||
      packedManifest.version !== package_.manifest.version
    ) {
      throw new Error(`${created[0]} does not match its source package manifest.`);
    }
    archives.push(archive);
  }

  for (const archive of archives) {
    const publishArguments = ['publish', archive, '--access', 'public'];
    if (dryRun) publishArguments.push('--dry-run');
    if (provenance) publishArguments.push('--provenance');
    const result = spawnSync('npm', publishArguments, {
      cwd: repositoryRoot,
      env: { ...process.env, npm_config_cache: join(archiveDirectory, 'npm-cache') },
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} finally {
  rmSync(archiveDirectory, { recursive: true, force: true });
}
