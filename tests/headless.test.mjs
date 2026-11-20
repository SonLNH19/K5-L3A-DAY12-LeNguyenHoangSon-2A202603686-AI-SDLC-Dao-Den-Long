import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../scripts/build.mjs';

function cli(extra = [], check = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-test-'));
  const out = join(dir, 'out.jsonl');
  try {
    const flags = new Map([['--seed', '19'], ['--night', '1'], ['--ticks', '20'], ['--out', out]]);
    for (let i = 0; i < extra.length; i += 2) flags.set(extra[i], extra[i + 1]);
    const result = spawnSync(process.execPath, ['src/headless.mjs', ...Array.from(flags).flat()], { cwd: ROOT, encoding: 'utf8' });
    let raw = '';
    try { raw = readFileSync(out, 'utf8'); } catch {}
    check(result, raw, dir);
    return { result, raw, lines: raw.trim() ? raw.trim().split('\n').map(s => JSON.parse(s)) : [] };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('CLI defaults snapshot 0,10,20 and mandatory end; output path accepts spaces', () => {
  const { result, lines } = cli(['--scenario', 'tests/scenarios/pickup.json']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(lines.filter(l => l.type === 'snapshot').map(l => l.tick), [0, 10, 20]);
  assert.equal(lines[0].player.carried, 0);
  assert.equal(lines[1].name, 'mote_picked');
  assert.equal(lines[1].tick, 1);
  assert.deepEqual(lines.at(-1), { type: 'end', ticks: 20, state: 'playing', score: 0 });
});

test('zero ticks emits initial snapshot then end, does not process input', () => {
  const { result, lines } = cli(['--ticks', '0', '--scenario', 'tests/scenarios/win.json', '--inputs', 'tests/scenarios/win.inputs.json']);
  assert.equal(result.status, 0);
  assert.equal(lines.length, 2);
  assert.equal(lines.at(-1).ticks, 0);
  assert.equal(lines[0].score, 0);
});

// Ticket-03 replaces early all_lit with waiting for dawn; original fixture remains useful.
test('all-lit scenario stays playing before dawn with new deposit score', () => {
  const { result, lines } = cli(['--scenario', 'tests/scenarios/win.json', '--inputs', 'tests/scenarios/win.inputs.json', '--snapshot-every', '1']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(lines.filter(l => l.type === 'event').map(l => l.name), ['deposit', 'lantern_lit']);
  assert.ok(lines.filter(l => l.type === 'event').every(l => l.tick === 1));
  assert.deepEqual(lines.at(-1), { type: 'end', ticks: 20, state: 'playing', score: 150 });
});

test('losing scenario stops at first tick and emits no_flames', () => {
  const { result, lines } = cli(['--scenario', 'tests/scenarios/lose.json']);
  assert.equal(result.status, 0);
  assert.equal(lines.at(-1).state, 'lost');
  assert.equal(lines.find(l => l.name === 'game_over').data.reason, 'no_flames');
  assert.equal(lines.at(-1).ticks, 1);
});

test('identical seeds produce byte-for-byte identical JSONL including spawning', () => {
  const a = cli(['--ticks', '650']);
  const b = cli(['--ticks', '650']);
  assert.equal(a.result.status, 0);
  assert.equal(b.result.status, 0);
  assert.equal(a.raw, b.raw);
});

test('different seeds change random layout', () => {
  assert.notEqual(cli().raw, cli(['--seed', '20']).raw);
});

test('custom snapshot interval runs exact N steps', () => {
  const { lines } = cli(['--scenario', 'tests/scenarios/pickup.json', '--ticks', '17', '--snapshot-every', '4']);
  assert.deepEqual(lines.filter(l => l.type === 'snapshot').map(l => l.tick), [0, 4, 8, 12, 16]);
  assert.equal(lines.at(-1).ticks, 17);
});

test('missing input file returns 2 with stderr', () => {
  const { result, raw } = cli(['--inputs', 'does-not-exist.json']);
  assert.equal(result.status, 2);
  assert.ok(result.stderr);
  assert.equal(raw, '');
});

test('invalid JSON and schema return 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-bad-'));
  try {
    const path = join(dir, 'bad.json');
    for (const value of ['not json', '{"frames":[{"tick":0},{"tick":0}]}', '{"frames":[{"tick":0,"pulse":2}]}']) {
      writeFileSync(path, value);
      const { result } = cli(['--inputs', path]);
      assert.equal(result.status, 2, result.stderr);
    }
    writeFileSync(path, '{"lanterns":[{"id":"L9"}]}');
    assert.equal(cli(['--scenario', path]).result.status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('invalid CLI exits nonzero; rejects negatives, fractional ticks and unknown night', () => {
  for (const args of [['--ticks', '-1'], ['--ticks', '1.2'], ['--night', '4'], ['--snapshot-every', '0'], ['--other', '1']]) {
    assert.notEqual(cli(args).result.status, 0);
  }
});

test('sparse frames retain move, yaw and button state correctly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lantern-frames-'));
  try {
    const path = join(dir, 'inputs.json');
    writeFileSync(path, JSON.stringify({
      frames: [
        { tick: 0, move: [0, 1], cam_yaw_deg: 90 },
        { tick: 30, move: [0, 0] },
        { tick: 40, jump: true }
      ]
    }));
    const { result, lines } = cli(['--ticks', '60', '--scenario', 'tests/scenarios/pickup.json', '--inputs', path]);
    assert.equal(result.status, 0, result.stderr);
    const last = lines.filter(l => l.type === 'snapshot').at(-1);
    assert.equal(last.player.pos[0], 3.0);
    assert.equal(last.player.pos[2], 0);
    assert.ok(last.player.pos[1] > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
