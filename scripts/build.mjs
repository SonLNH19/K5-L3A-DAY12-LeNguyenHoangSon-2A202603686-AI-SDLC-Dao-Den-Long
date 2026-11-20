import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export function build() {
  const out = join(ROOT, 'dist');
  mkdirSync(join(out, 'src'), { recursive: true }); mkdirSync(join(out, 'vendor'), { recursive: true });
  for (const name of ['index.html', 'style.css', 'game.contract.json']) cpSync(join(ROOT, name), join(out, name));
  for (const name of ['app.mjs', 'game.mjs', 'validation.mjs','forest.mjs','phase4.mjs']) cpSync(join(ROOT, 'src', name), join(out, 'src', name));
  for (const name of ['three.module.js', 'three.core.js']) {
    const path = join(ROOT, 'node_modules/three/build', name);
    if (!existsSync(path)) throw new Error('Thiếu Three.js. Hãy chạy npm ci trước.');
    cpSync(path, join(out, 'vendor', name));
  }
  cpSync(join(ROOT,'node_modules/three/LICENSE'),join(out,'THREE-LICENSE.txt'));
  for (const name of ['LICENSE','CREDITS.md']) cpSync(join(ROOT,name),join(out,name));
  console.log('Build thành công: dist/ (web tĩnh, không dùng CDN).');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) build();
