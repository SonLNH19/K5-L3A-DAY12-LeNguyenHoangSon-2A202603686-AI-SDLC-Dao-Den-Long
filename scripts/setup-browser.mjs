import {browserPath} from './browser-runtime.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
if(!browserPath()){
  const r=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/playwright/cli.js',import.meta.url)),'install','chromium'],{stdio:'inherit'});
  if(r.status!==0)throw new Error('Chưa cài được Chromium; chạy npx playwright install chromium');
}
console.log('Browser cho bench đã sẵn sàng.');
