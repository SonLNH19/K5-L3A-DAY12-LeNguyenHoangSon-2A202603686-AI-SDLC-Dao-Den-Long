import { spawnSync } from 'node:child_process';
import { ROOT } from './build.mjs';
// Fail closed: a failing test stops this pipeline, so build cannot hide a test failure.
for (const args of [['--check','src/app.mjs'], ['--test', 'tests/game.test.mjs', 'tests/headless.test.mjs'], ['scripts/build.mjs']]) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
