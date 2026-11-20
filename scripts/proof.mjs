import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { platform, arch, cpus, release } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT } from './build.mjs';
import { createDemoRoute } from './demo-route.mjs';

const dir = join(ROOT, 'docs/proof/phase-3');
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
const tests = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/game.test.mjs', 'tests/headless.test.mjs', 'tests/phase3.test.mjs'], { cwd: ROOT, encoding: 'utf8' });
writeFileSync(join(dir, 'tests.tap'), tests.stdout + tests.stderr);
if (tests.status !== 0) throw new Error('Test thất bại, xem tests.tap');

// 2. Run scenarios for every feature
console.log('Verifying headless scenarios...');
const scenarioList = [
  ['pickup', ['--scenario', 'tests/scenarios/pickup.json'], 'playing'],
  ['no-early-win', ['--scenario', 'tests/scenarios/win.json', '--inputs', 'tests/scenarios/win.inputs.json'], 'playing'],
  ['dawn-win', ['--scenario', 'tests/scenarios/phase3-dawn.json', '--snapshot-every', '1'], 'won'],
  ['fuel-drain', ['--scenario', 'tests/scenarios/phase3-drain.json', '--ticks', '180', '--snapshot-every', '60'], 'playing'],
  ['refuel', ['--scenario', 'tests/scenarios/phase3-refuel.json', '--inputs', 'tests/scenarios/phase3-interact.inputs.json', '--ticks', '30', '--snapshot-every', '1'], 'playing'],
  ['relight', ['--scenario', 'tests/scenarios/phase3-relight.json', '--inputs', 'tests/scenarios/phase3-interact.inputs.json', '--ticks', '1', '--snapshot-every', '1'], 'playing'],
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

const fuelArgs=['--scenario','tests/scenarios/phase3-refuel.json','--inputs','tests/scenarios/phase3-interact.inputs.json','--ticks','120'];
const fuelA=run('determinism-fuel-a',fuelArgs),fuelB=run('determinism-fuel-b',fuelArgs);
if(fuelA!==fuelB)throw new Error('Fuel/refuel output không tất định');

// 4. Full default run
console.log('Generating and verifying full default world win route...');
const route = createDemoRoute(4);
if (route.end.state !== 'won') throw new Error('Không hoàn thành được lượt chơi mặc định');
const routePath = join(dir, 'full-run.inputs.json');
writeFileSync(routePath, JSON.stringify({ frames: route.frames }) + '\n');
writeFileSync(join(dir, 'full-run.summary.json'), JSON.stringify({
  seed: 4,
  end: route.end,
  seconds: route.end.ticks / 60,
  snapshot: route.snapshot,
  note: 'Default game; no scenario overrides or state edits. Inputs generated from observable positions.'
}, null, 2) + '\n');

const fullOut = join(dir, 'full-run.jsonl');
const full = spawnSync(process.execPath, ['src/headless.mjs', '--seed', '4', '--night', '1', '--ticks', '14400', '--inputs', routePath, '--out', fullOut], { cwd: ROOT, encoding: 'utf8' });
if (full.status !== 0) throw new Error(full.stderr);
const replayEnd = JSON.parse(readFileSync(fullOut, 'utf8').trim().split('\n').at(-1));
if (JSON.stringify(replayEnd) !== JSON.stringify(route.end)) throw new Error('CLI replay không khớp lượt chơi mặc định');
checks.push({ name: 'full-default-run', expected: 'won', end: replayEnd });

// 5. Retained Phase 2 headless throughput threshold, full current Night 3 (18,000 ticks).
// Isolate hazards so an early death cannot masquerade as a full-night benchmark.
console.log('Benchmarking a complete current Night 3 (18,000 ticks)...');
const perfScenario=join(dir,'benchmark.scenario.json');
writeFileSync(perfScenario,JSON.stringify({random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,motes:[],shades:[]})+'\n');
const perfOut = join(dir, 'benchmark-night3.jsonl');
const t0 = performance.now();
const perfRun = spawnSync(process.execPath, ['src/headless.mjs', '--seed', '1', '--night', '3', '--ticks', '18000', '--scenario',perfScenario,'--out', perfOut], { cwd: ROOT, encoding: 'utf8' });
const durationSec = (performance.now() - t0) / 1000;
if (perfRun.status !== 0) throw new Error(perfRun.stderr);
const perfEnd=JSON.parse(readFileSync(perfOut,'utf8').trim().split('\n').at(-1));
if(perfEnd.ticks!==18000)throw new Error('Benchmark stopped before the full current night');
if(durationSec>30)throw new Error('Benchmark exceeded retained Phase 2 threshold');
console.log(`18,000 actual ticks finished in ${durationSec.toFixed(3)}s (threshold: <= 30s)`);

const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
const report = {
  generated_at: new Date().toISOString(),
  phase: 'phase-3',
  contract_version: '1.2',
  platform: platform(),
  arch: arch(),
  os_release: release(),
  cpu: cpus()[0]?.model,
  node: process.version,
  base_commit: git.stdout.trim(),
  benchmark_actual_ticks: perfEnd.ticks,
  benchmark_seconds: durationSec,
  benchmark_note:'Current full Night 3 is 300s; no hazards/wind to avoid early exit. This is not a GPU/FPS benchmark.',
  benchmark_target_seconds: 30,
  benchmark_passed: durationSec <= 30,
  full_run_seed: 4,
  checks,
  determinism: {
    identical_night1: true,
    identical_night2: true,
    identical_night3: true,
    identical_fuel_refuel: true,
    fuel_sha256:createHash('sha256').update(fuelA).digest('hex')
  },
  limits: [
    'Không chứng minh test ẩn của giảng viên đạt.',
    'Nền tảng khác chỉ được xác nhận bằng job CI tương ứng hoặc chạy thật.',
    'Ảnh và kiểm tra GUI nằm trong bộ browser test riêng.'
  ]
};
writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const sourceHashes={};
for(const name of ['src/game.mjs','src/validation.mjs','src/headless.mjs','src/app.mjs','game.contract.json','scripts/proof.mjs','tests/phase3.test.mjs'])sourceHashes[name]=createHash('sha256').update(readFileSync(join(ROOT,name))).digest('hex');
writeFileSync(join(dir,'source-hashes.json'),JSON.stringify(sourceHashes,null,2)+'\n');
console.log('Đã lưu bằng chứng thật Phase 3 tại docs/proof/phase-3/');
