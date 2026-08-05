import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectDir = process.cwd();
const manifestPath = resolve(projectDir, 'extension', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

if (manifest.manifest_version !== 3) {
  throw new Error(`Expected manifest_version 3, found ${manifest.manifest_version}`);
}

for (const relativePath of ['index.html', 'src/main.jsx', 'scripts/build-extension.mjs']) {
  await access(resolve(projectDir, relativePath));
}

const popup = manifest.action?.default_popup;
if (popup !== 'index.html') {
  throw new Error(`Expected action.default_popup to be index.html, found ${popup}`);
}

console.log(`Validated extension manifest: ${manifestPath}`);
