import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game, distance, distance3D, HZ } from '../src/game.mjs';
import { validateInputs, validateScenario } from '../src/validation.mjs';

const T = JSON.parse(readFileSync(new URL('../game.contract.json', import.meta.url))).tuning;
const isolated = { random_motes: false, random_shades: false, motes: [], shades: [] };
const make = (s = {}, night = 1) => new Game(T, { scenario: { ...isolated, ...s }, night });
const steps = (g, count, input = {}) => {
  const events = [];
  for (let i = 0; i < count; i++) events.push(...g.step(i === 0 ? input : {}));
  return events;
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-4, `${a} != ${b}`);

test('tick 0: origin, five stable ids, no events or setup points', () => {
  const g = make({ lanterns: [{ id: 'L1', lit: true }] });
  assert.equal(g.tick, 0); assert.equal(g.score, 0); assert.deepEqual(g.events, []);
  assert.deepEqual(g.player.pos, [0, 0, 0]); assert.deepEqual(g.lanterns.map(l => l.id), ['L1','L2','L3','L4','L5']);
  assert.equal(g.lanterns[1].lit, false); assert.equal(g.lanterns[0].lit, true);
});

test('speed is metres/sec and movement persists across missing frames (Phase 2: 6 m/s)', () => {
  const g = make(); steps(g, 60, { move: [0, 1] });
  near(g.player.pos[2], T.player_speed); near(g.timeLeft, T.night1_duration_s - 1);
});

test('diagonal normalization prevents extra speed', () => {
  const g = make(); steps(g, 60, { move: [1, 1] });
  near(distance(g.player.pos, [0, 0, 0]), T.player_speed);
});

test('90 degree camera yaw transforms +Z into +X', () => {
  const g = make(); steps(g, 60, { move: [0, 1], cam_yaw_deg: 90 });
  near(g.player.pos[0], T.player_speed); near(g.player.pos[2], 0);
});

test('jump is one edge, lands, and does not repeat while held', () => {
  const g = make(); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
  steps(g, 120); assert.equal(g.player.pos[1], 0);
  g.step({ jump: false }); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
});

test('falling off island (Y < -10) penalizes flame, drops motes, and respawns after 60 ticks', () => {
  // Move off island radius 40
  const g = make({ player: { pos: [39.5, 0, 0], carried: 4, flames: 3 } });
  steps(g, 90, { move: [1, 0] }); // moves past 40m, drops down
  assert.ok(g.player.pos[0] > 40);
  assert.equal(g.player.flames, 2);
  assert.equal(g.player.carried, 0);
  // Stop moving and wait for respawn
  steps(g, 60, { move: [0, 0] });
  assert.deepEqual(g.player.pos, [0, 0, 0]);
  assert.ok(g.player.invulnTicks > 0);
});

test('pickup includes exact XZ boundary and height difference (<= 1.5m)', () => {
  const g = make({
    player: { pos: [0, 0, 0] },
    motes: [[T.pickup_radius, 0, 0], [T.pickup_radius + 0.001, 0, 0], [0, 1.6, 0]]
  });
  const e = g.step();
  assert.equal(g.player.carried, 1);
  assert.equal(g.motes.length, 2);
  assert.equal(e[0].name, 'mote_picked');
  assert.equal(e[0].data.carried, 1);
});

test('initial capacity leaves additional motes available (Phase 3 starts at 10)', () => {
  const g = make({ player: { carried: T.carry_capacity - 1 }, motes: [[0, 0, 0], [0, 0, 0]] });
  g.step();
  assert.equal(g.player.carried, T.carry_capacity);
  assert.equal(g.motes.length, 1);
});

// Ticket-03 replaces +10/deposit with +5; edge-trigger and partial deposits are retained.
test('deposit partial then full emits once, scores +5 per deposit and preserves surplus', () => {
  const g = make({ player: { carried: 3 }, lanterns: [{ id: 'L1', pos: [0, 0, 0] }] });
  let e = g.step({ interact: true });
  assert.deepEqual(e.map(e => e.name), ['deposit']);
  assert.equal(g.lanterns[0].deposited, 3);
  assert.equal(g.score, 15); // 3 * 5
  g.player.carried = T.carry_capacity;
  e = g.step();
  assert.equal(e.length, 0);
  g.step({ interact: false });
  e = g.step({ interact: true });
  assert.deepEqual(e.map(e => e.name), ['deposit', 'lantern_lit']);
  assert.equal(g.player.carried, T.carry_capacity - (T.lantern_cost - 3));
  assert.equal(g.score, 15 + (T.lantern_cost - 3) * 5 + T.score.per_lantern);
});

test('interact at exact radius works; beyond radius does not', () => {
  const inside = make({ player: { carried: 1 }, lanterns: [{ id: 'L1', pos: [T.interact_radius, 0, 0] }] });
  assert.ok(inside.step({ interact: true }).some(e => e.name === 'deposit'));
  const outside = make({ player: { carried: 1 }, lanterns: [{ id: 'L1', pos: [T.interact_radius + 0.001, 0, 0] }] });
  assert.equal(outside.step({ interact: true }).length, 0);
});

test('nearest unlit lamp is selected deterministically', () => {
  const g = make({ player: { carried: 1 }, lanterns: [{ id: 'L1', pos: [1, 0, 0] }, { id: 'L2', pos: [-1, 0, 0] }] });
  g.step({ interact: true });
  assert.equal(g.lanterns[0].deposited, 1);
  assert.equal(g.lanterns[1].deposited, 0);
});

test('scenario lists replace defaults; unnamed lamps remain; no setup score', () => {
  const g = new Game(T, { scenario: { motes: [], shades: [], lanterns: [{ id: 'L2', pos: [1, 0, 2], deposited: T.lantern_cost }] } });
  assert.equal(g.motes.length, 0);
  assert.equal(g.shades.length, 0);
  assert.equal(g.lanterns.length, 5);
  assert.equal(g.lanterns[1].lit, true);
  assert.equal(g.score, 0);
});

test('shade is active immediately and moves declared speed', () => {
  const g = make({ shades: [{ id: 'S10', pos: [10, 0, 0] }] });
  steps(g, 60);
  near(g.shades[0].pos[0], 10 - T.shade_speed);
  assert.equal(g.shades[0].id, 'S10');
});

test('hit loses one flame with 90 ticks invulnerability and drops floor(carried/2)', () => {
  const g = make({ player: { carried: 5 }, shades: [{ pos: [0, 0, 0] }] });
  let e = g.step();
  assert.deepEqual(e[0].data, { by: 'shade', flames: T.flames - 1, dropped: 2, lost: false });
  assert.equal(g.player.carried, 3);
  assert.equal(g.player.invulnTicks, 90);
  assert.equal(g.motes.filter(m => m.kind === 'dropped').length, 2);
  // Recoil
  assert.equal(g.shades[0].state, 'recoil');
});

test('multiple shades do not bypass invulnerability in a single tick', () => {
  const g = make({ shades: [{ pos: [0, 0, 0] }, { pos: [0, 0, 0] }] });
  const e = g.step();
  assert.equal(e.filter(e => e.name === 'player_hit').length, 1);
});

test('pulse charges 3 motes, stuns 120 ticks, pushes 4m in 15 ticks, scores +5', () => {
  const g = make({ player: { carried: 5 }, shades: [{ id: 'S1', pos: [T.pulse_radius, 0, 0] }, { id: 'S2', pos: [T.pulse_radius + 0.01, 0, 0] }] });
  const e = g.step({ pulse: true });
  assert.deepEqual(e.find(e => e.name === 'pulse').data.stunned_ids, ['S1']);
  assert.equal(g.player.carried, 5 - T.pulse_cost);
  assert.equal(g.shades[0].state, 'stunned');
  assert.equal(g.score, T.score.per_stun);
  steps(g, 15);
  near(g.shades[0].pos[0], T.pulse_radius + T.pulse_push_m);
});

test('pulse without enough light does nothing', () => {
  const g = make({ player: { carried: T.pulse_cost - 1 }, shades: [{ pos: [3, 0, 0] }] });
  assert.equal(g.step({ pulse: true }).some(e => e.name === 'pulse'), false);
});

test('pulse cooldown 180 ticks blocks new edge until ready', () => {
  const g = make({ player: { carried: 10 } });
  g.step({ pulse: true });
  g.step({ pulse: false });
  assert.equal(g.step({ pulse: true }).length, 0);
  steps(g, T.pulse_cooldown_s * HZ);
  g.step({ pulse: false });
  assert.equal(g.step({ pulse: true })[0].name, 'pulse');
  assert.equal(g.player.carried, 10 - 2 * T.pulse_cost);
});

test('lit lamp repels shades and protects player', () => {
  const g = make({ lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }], shades: [{ pos: [10, 0, 0] }] });
  steps(g, 300);
  assert.ok(distance(g.shades[0].pos, [0, 0, 0]) >= T.safe_radius);
  assert.equal(g.player.flames, T.flames);
});

// REPLACED: all_lit early win (v1.1) is forbidden by Ticket-03 §3.
test('lighting final lantern does not end night; winning dawn scores once and stops simulation', () => {
  const g = make({ player: { carried: T.lantern_cost }, lanterns: [{ id: 'L1', pos: [0, 0, 0] }, ...['L2', 'L3', 'L4', 'L5'].map(id => ({ id, lit: true }))] });
  const e = g.step({ interact: true });
  assert.equal(g.state, 'playing');
  assert.equal(e.at(-1).name, 'lantern_lit');
  assert.equal(e.some(item => item.name === 'game_over'), false);
  const dawn = make({ time_left_s: 1 / 60, lanterns: ['L1','L2','L3'].map(id=>({id,lit:true})) });
  assert.equal(dawn.step().at(-1).data.reason, 'dawn_survived');
  assert.equal(dawn.score, 3 * (50 + 99) + 3 * 50);
  assert.equal(dawn.state, 'won');
  const snapshot = dawn.snapshot();
  dawn.step();
  assert.deepEqual(dawn.snapshot(), snapshot);
});

test('loses with no_flames', () => {
  const g = make({ player: { flames: 1 }, shades: [{ pos: [0, 0, 0] }] });
  const e = g.step();
  assert.equal(g.state, 'lost');
  assert.equal(e.at(-1).data.reason, 'no_flames');
});

test('scenario time override counts down by executed steps and dawn ends early', () => {
  const g = make({ time_left_s: 1 / 60 });
  const e = g.step();
  assert.equal(g.timeLeft, 0);
  assert.equal(g.tick, 1);
  assert.equal(e.at(-1).data.reason, 'dawn');
});

// REPLACED: dawn now evaluates the final lit ratio, not all_lit priority.
test('last-tick lighting counts at dawn after interaction', () => {
  const g = make({ time_left_s: 1 / 60, player: { carried: T.lantern_cost }, lanterns: [{ id: 'L1', pos: [0, 0, 0] }, ...['L2', 'L3', 'L4', 'L5'].map(id => ({ id, lit: true }))] });
  g.step({ interact: true });
  assert.equal(g.state, 'won');
});

test('seed reproduces full state and spawn ids; explicit id does not collide', () => {
  const a = new Game(T, { seed: 42 });
  const b = new Game(T, { seed: 42 });
  steps(a, 650);
  steps(b, 650);
  assert.deepEqual(a.snapshot(), b.snapshot());
  const g = new Game(T, { scenario: { shades: [{ id: 'S1', pos: [30, 0, 30] }, { pos: [30, 0, -30] }] } });
  steps(g, 600);
  assert.equal(new Set(g.shades.map(s => s.id)).size, g.shades.length);
});

test('disabled random spawning stays disabled', () => {
  const g = make();
  steps(g, 1200);
  assert.equal(g.motes.length, 0);
  assert.equal(g.shades.length, 0);
});

test('coordinates have at most 3 decimal precision in snapshot', () => {
  const g = make();
  g.step({ move: [1, 1] });
  const p = g.snapshot().player.pos;
  p.forEach(n => near(n * 1000, Math.round(n * 1000)));
});

test('dash triggers, moves 14 m/s in facing direction for 12 ticks, emits dash event', () => {
  const g = make();
  const e = g.step({ dash: true });
  assert.equal(e.find(item => item.name === 'dash')?.type, 'event');
  assert.equal(g.player.dashTicksLeft, 12);
  steps(g, 12);
  assert.equal(g.player.dashTicksLeft, 0);
  // Total distance in 12 ticks = 12 * (14 / 60) = 2.8m in +Z direction
  near(g.player.pos[2], 2.8);
  // Cooldown is 90 ticks from start
  assert.equal(g.player.dashCdTicks, 90 - 12);
});

test('wind charm boosts speed to 7.2 m/s and eliminates dash cooldown', () => {
  const g = make({ charms: [{ id: 'C1', pos: [0, 0, 0], available: true }] }, 2);
  const e = g.step();
  assert.equal(e.find(item => item.name === 'charm_picked')?.data.charm_id, 'C1');
  assert.equal(g.player.charmTicks, 600);
  // Run with charm for 60 ticks
  steps(g, 60, { move: [0, 1] });
  near(g.player.pos[2], 7.2);
  // Dash has 0 cooldown
  g.step({ dash: true });
  assert.equal(g.player.dashCdTicks, 0);
});

test('jump pad on Night 2 launches player towards Island B center with Vy=14, Vhoriz=24', () => {
  const g = make({ player: { pos: [20, 0, 18] } }, 2);
  g.step();
  assert.equal(g.player.padActive, true);
  assert.equal(g.player.vel[1], 14.0);
  near(Math.hypot(g.player.vel[0], g.player.vel[2]), 24.0);
});

test('stray wind (Gió Lạc) chases when carried >= 5 and dist <= 15m, steals min(3, carried)', () => {
  const g = make({
    player: { pos: [0, 0, 0], carried: 6 },
    drifters: [{ id: 'D1', pos: [5, 0, 0], state: 'idle', stolen: 0 }]
  }, 2);
  // In 1 tick: distance is 5m <= 15m and carried >= 5 -> state becomes chase
  g.step();
  assert.equal(g.drifters[0].state, 'chase');
  // Teleport drifter close to steal
  g.drifters[0].pos = [0.8, 0, 0];
  const e = g.step();
  const steal = e.find(item => item.name === 'drifter_steal');
  assert.ok(steal);
  assert.equal(steal.data.amount, 3);
  assert.equal(g.player.carried, 3);
  assert.equal(g.drifters[0].state, 'flee');
});

test('pulse on fleeing stray wind carrying stolen motes causes drifter_drop and drops motes', () => {
  const g = make({
    player: { pos: [0, 0, 0], carried: 3 },
    drifters: [{ id: 'D1', pos: [3, 0, 0], state: 'flee', stolen: 3 }]
  }, 2);
  g.drifters[0].fleeTicks = 100;
  const e = g.step({ pulse: true });
  const drop = e.find(item => item.name === 'drifter_drop');
  assert.ok(drop);
  assert.equal(drop.data.amount, 3);
  assert.equal(g.drifters[0].stolen, 0);
  assert.equal(g.motes.filter(m => m.kind === 'dropped').length, 3);
});

test('pause input toggles paused state and freezes simulation timers', () => {
  const g = make();
  const e1 = g.step({ pause: true });
  assert.equal(e1.find(item => item.name === 'paused')?.type, 'event');
  assert.equal(g.snapshot().state, 'paused');
  const tick1 = g.tick;
  const sim1 = g.simTick;
  const time1 = g.timeLeft;
  g.step();
  assert.equal(g.tick, tick1 + 1);
  assert.equal(g.simTick, sim1);
  assert.equal(g.timeLeft, time1);
  g.step({ pause: false });
  const e2 = g.step({ pause: true });
  assert.equal(e2.find(item => item.name === 'resumed')?.type, 'event');
  assert.equal(g.snapshot().state, 'playing');
});

test('reject malformed input, duplicate ticks, nonboolean buttons', () => {
  for (const v of [{}, { frames: [{ tick: 0 }, { tick: 0 }] }, { frames: [{ tick: 1 }, { tick: 0 }] }, { frames: [{ tick: 0, move: [2, 0] }] }, { frames: [{ tick: 0, pulse: 1 }] }]) {
    assert.throws(() => validateInputs(v));
  }
});

test('reject invalid scenario ranges, positions and duplicated ids', () => {
  for (const v of ['not object', { night: 4 }, { player: { carried: 11 } }, { lanterns: [{ id: 'L8' }] }, { shades: [{ id: 'S1' }, { id: 'S1' }] }]) {
    assert.throws(() => validateScenario(v, T));
  }
});
