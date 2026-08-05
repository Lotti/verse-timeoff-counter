import { execFile } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, '..');
const buildDir = resolve(projectDir, 'build');
const distDir = resolve(projectDir, 'dist');
const extensionDir = resolve(projectDir, 'extension');
const iconDir = resolve(projectDir, 'public', 'icons');
const artifactDir = resolve(projectDir, 'web-ext-artifacts');
const execFileAsync = promisify(execFile);

const packageJson = JSON.parse(await readFile(resolve(projectDir, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(extensionDir, 'manifest.json'), 'utf8'));
const archiveName = `${packageJson.name.replaceAll('-', '_')}-${packageJson.version}.zip`;
const archivePath = resolve(artifactDir, archiveName);

manifest.version = packageJson.version;

await rm(buildDir, { force: true, recursive: true });
await rm(archivePath, { force: true });
await mkdir(buildDir, { recursive: true });
await mkdir(artifactDir, { recursive: true });
await cp(distDir, buildDir, { recursive: true });

for (const entry of await readdir(extensionDir, { withFileTypes: true })) {
  if (entry.name === 'manifest.json') {
    continue;
  }

  await cp(resolve(extensionDir, entry.name), resolve(buildDir, entry.name), {
    recursive: true,
  });
}

await cp(iconDir, resolve(buildDir, 'icons'), { recursive: true });
await writeFile(resolve(buildDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await execFileAsync('/usr/bin/zip', ['-rq', archivePath, '.'], { cwd: buildDir });

console.log(`Packaged extension: ${archivePath}`);
