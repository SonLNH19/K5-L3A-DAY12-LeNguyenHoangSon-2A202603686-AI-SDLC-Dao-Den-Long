import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { platform, arch, cpus, release } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT } from './build.mjs';
import { createDemoRoute } from './demo-route.mjs';

const dir = join(ROOT, 'docs/proof/phase-2');
mkdirSync(dir, { recursive: true });

const checks = [];
function run(name, extra = []) {
  const out = join(dir, name + '.jsonl');
  const flags = new Map([['--seed', '19'], ['--night', '1'], ['--ticks', '650'], ['--out', out]]);
  for (let i = 0; i < extra.length; i += 2) flags.set(extra[i], extra[i + 1]);
  const r = spawnSync(process.execPath, ['src/headless.mjs', ...Array.from(flags).flat()], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${name} failed: ${r.stderr}`);
  return readFileSync(out, 'utf8');
}

// 1. Run unit tests and write TAP output
console.log('Running test suite for TAP report...');
const tests = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/game.test.mjs', 'tests/headless.test.mjs'], { cwd: ROOT, encoding: 'utf8' });
writeFileSync(join(dir, 'tests.tap'), tests.stdout + tests.stderr);
if (tests.status !== 0) throw new Error('Test thất bại, xem tests.tap');

// 2. Run scenarios for every feature
console.log('Verifying headless scenarios...');
const scenarioList = [
  ['pickup', ['--scenario', 'tests/scenarios/pickup.json'], 'playing'],
  ['win', ['--scenario', 'tests/scenarios/win.json', '--inputs', 'tests/scenarios/win.inputs.json'], 'won'],
  ['lose', ['--scenario', 'tests/scenarios/lose.json'], 'lost'],
  ['dash', ['--scenario', 'tests/scenarios/dash.json', '--inputs', 'tests/scenarios/dash.inputs.json'], 'playing'],
  ['wind-charm', ['--night', '2', '--scenario', 'tests/scenarios/wind-charm.json', '--inputs', 'tests/scenarios/wind-charm.inputs.json'], 'playing'],
  ['jump-pad', ['--night', '2', '--scenario', 'tests/scenarios/jump-pad.json', '--inputs', 'tests/scenarios/jump-pad.inputs.json'], 'playing'],
  ['stray-wind', ['--night', '2', '--scenario', 'tests/scenarios/stray-wind.json', '--inputs', 'tests/scenarios/stray-wind.inputs.json'], 'playing'],
  ['fall', ['--scenario', 'tests/scenarios/fall.json', '--inputs', 'tests/scenarios/fall.inputs.json'], 'playing'],
  ['pause', ['--scenario', 'tests/scenarios/pause.json', '--inputs', 'tests/scenarios/pause.inputs.json'], 'playing'],
  ['night2', ['--night', '2', '--scenario', 'tests/scenarios/night2.json'], 'playing'],
  ['night3', ['--night', '3', '--scenario', 'tests/scenarios/night3.json'], 'playing']
];

for (const [name, args, expected] of scenarioList) {
  const raw = run(name, args);
  const end = JSON.parse(raw.trim().split('\n').at(-1));
  if (end.state !== expected) throw new Error(`${name}: kết quả sai (${end.state} != ${expected})`);
  checks.push({ name, expected, end });
}

// 3. Determinism check
console.log('Verifying determinism on all 3 nights...');
for (const n of ['1', '2', '3']) {
  const a = run(`determinism-night${n}-a`, ['--night', n]);
  const b = run(`determinism-night${n}-b`, ['--night', n]);
  if (a !== b) throw new Error(`Night ${n} output không tất định`);
}

// 4. Full default run
console.log('Generating and verifying full default world win route...');
const route = createDemoRoute(12);
if (route.end.state !== 'won') throw new Error('Không hoàn thành được lượt chơi mặc định');
const routePath = join(dir, 'full-run.inputs.json');
writeFileSync(routePath, JSON.stringify({ frames: route.frames }) + '\n');
writeFileSync(join(dir, 'full-run.summary.json'), JSON.stringify({
  seed: 12,
  end: route.end,
  seconds: route.end.ticks / 60,
  snapshot: route.snapshot,
  note: 'Default game; no scenario overrides or state edits. Inputs generated from observable positions.'
}, null, 2) + '\n');

const fullOut = join(dir, 'full-run.jsonl');
const full = spawnSync(process.execPath, ['src/headless.mjs', '--seed', '12', '--night', '1', '--ticks', '18000', '--inputs', routePath, '--out', fullOut], { cwd: ROOT, encoding: 'utf8' });
if (full.status !== 0) throw new Error(full.stderr);
const replayEnd = JSON.parse(readFileSync(fullOut, 'utf8').trim().split('\n').at(-1));
if (JSON.stringify(replayEnd) !== JSON.stringify(route.end)) throw new Error('CLI replay không khớp lượt chơi mặc định');
checks.push({ name: 'full-default-run', expected: 'won', end: replayEnd });

// 5. Performance benchmark for DoD (21,600 ticks headless <= 30 seconds)
console.log('Benchmarking full 21,600 ticks headless runtime...');
const perfOut = join(dir, 'benchmark-21600.jsonl');
const t0 = performance.now();
const perfRun = spawnSync(process.execPath, ['src/headless.mjs', '--seed', '1', '--night', '3', '--ticks', '21600', '--out', perfOut], { cwd: ROOT, encoding: 'utf8' });
const durationSec = (performance.now() - t0) / 1000;
if (perfRun.status !== 0) throw new Error(perfRun.stderr);
console.log(`21,600 ticks finished in ${durationSec.toFixed(3)}s (threshold: <= 30s)`);

const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
const report = {
  generated_at: new Date().toISOString(),
  phase: 'phase-2',
  contract_version: '1.1',
  platform: platform(),
  arch: arch(),
  os_release: release(),
  cpu: cpus()[0]?.model,
  node: process.version,
  base_commit: git.stdout.trim(),
  benchmark_21600_ticks_seconds: durationSec,
  benchmark_target_seconds: 30,
  benchmark_passed: durationSec <= 30,
  checks,
  determinism: {
    identical_night1: true,
    identical_night2: true,
    identical_night3: true
  },
  limits: [
    'Không chứng minh test ẩn của giảng viên đạt.',
    'Nền tảng khác chỉ được xác nhận bằng job CI tương ứng hoặc chạy thật.',
    'Ảnh và kiểm tra GUI nằm trong bộ browser test riêng.'
  ]
};
writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Đã lưu bằng chứng thật Phase 2 tại docs/proof/phase-2/');
