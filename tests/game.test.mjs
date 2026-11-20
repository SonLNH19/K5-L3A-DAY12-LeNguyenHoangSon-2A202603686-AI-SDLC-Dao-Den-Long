import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game, distance, WORLD } from '../src/game.mjs';
import { validateInputs, validateScenario } from '../src/validation.mjs';
import { createDemoRoute } from '../scripts/demo-route.mjs';
const T = JSON.parse(readFileSync(new URL('../game.contract.json', import.meta.url))).tuning;
const isolated = { random_motes: false, random_shades: false, motes: [], shades: [] };
const make = (s = {}) => new Game(T, { scenario: { ...isolated, ...s } });
const steps = (g, count, input = {}) => { const events = []; for (let i = 0; i < count; i++) events.push(...g.step(i === 0 ? input : {})); return events; };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('tick 0: origin, five stable ids, no events or setup points', () => {
  const g = make({ lanterns: [{ id: 'L1', lit: true }] });
  assert.equal(g.tick, 0); assert.equal(g.score, 0); assert.deepEqual(g.events, []);
  assert.deepEqual(g.player.pos, [0, 0, 0]); assert.deepEqual(g.lanterns.map(l => l.id), ['L1','L2','L3','L4','L5']);
  assert.equal(g.lanterns[1].lit, false); assert.equal(g.lanterns[0].lit, true);
});
test('speed is metres/sec and movement persists across missing frames', () => {
  const g = make(); steps(g, 60, { move: [0, 1] }); near(g.player.pos[2], T.player_speed); near(g.timeLeft, T.night1_duration_s - 1);
});
test('diagonal normalization prevents extra speed', () => {
  const g = make(); steps(g, 60, { move: [1, 1] }); near(distance(g.player.pos, [0, 0, 0]), T.player_speed);
});
test('90 degree camera yaw transforms +Z into +X', () => {
  const g = make(); steps(g, 60, { move: [0, 1], cam_yaw_deg: 90 }); near(g.player.pos[0], T.player_speed); near(g.player.pos[2], 0);
});
test('jump is one edge, lands, and does not repeat while held', () => {
  const g = make(); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
  steps(g, 120); assert.equal(g.player.pos[1], 0); g.step({ jump: false }); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
});
test('island boundary prevents falling', () => {
  const g = make(); steps(g, 600, { move: [0, 1] }); near(g.player.pos[2], WORLD.radius - 0.5); assert.equal(g.player.flames, T.flames);
});
test('pickup includes exact XZ boundary and ignores altitude', () => {
  const g = make({ player: { pos: [0, 10, 0] }, motes: [[T.pickup_radius, 0, 0], [T.pickup_radius + 0.001, 0, 0]] });
  const e = g.step(); assert.equal(g.player.carried, 1); assert.equal(g.motes.length, 1); assert.equal(e[0].tick, 1); assert.equal(e[0].name, 'mote_picked'); assert.equal(g.score, T.score.per_mote);
});
test('capacity leaves additional motes available', () => {
  const g = make({ player: { carried: T.carry_capacity - 1 }, motes: [[0,0,0],[0,0,0]] }); g.step(); assert.equal(g.player.carried, T.carry_capacity); assert.equal(g.motes.length, 1);
});
test('deposit partial then full emits once and preserves surplus', () => {
  const g = make({ player: { carried: 3 }, lanterns: [{ id: 'L1', pos: [0,0,0] }] });
  let e = g.step({ interact: true }); assert.deepEqual(e.map(e => e.name), ['deposit']); assert.equal(g.lanterns[0].deposited, 3);
  g.player.carried = T.carry_capacity; e = g.step(); assert.equal(e.length, 0);
  g.step({ interact: false }); e = g.step({ interact: true }); assert.deepEqual(e.map(e => e.name), ['deposit','lantern_lit']);
  assert.equal(g.player.carried, T.carry_capacity - (T.lantern_cost - 3)); assert.equal(g.score, T.score.per_lantern);
});
test('interact at exact radius works; beyond radius does not', () => {
  const inside = make({ player: { carried: 1 }, lanterns: [{ id: 'L1', pos: [T.interact_radius, 0, 0] }] });
  assert.ok(inside.step({ interact: true }).some(e => e.name === 'deposit'));
  const outside = make({ player: { carried: 1 }, lanterns: [{ id: 'L1', pos: [T.interact_radius + .001, 0, 0] }] });
  assert.equal(outside.step({ interact: true }).length, 0);
});
test('nearest unlit lamp is selected deterministically', () => {
  const g = make({ player: { carried: 1 }, lanterns: [{id:'L1',pos:[1,0,0]},{id:'L2',pos:[-1,0,0]}] }); g.step({interact:true}); assert.equal(g.lanterns[0].deposited,1); assert.equal(g.lanterns[1].deposited,0);
});
test('scenario lists replace defaults; unnamed lamps remain; no setup score', () => {
  const g = new Game(T,{scenario:{motes:[],shades:[],lanterns:[{id:'L2',pos:[1,0,2],deposited:T.lantern_cost}]}});
  assert.equal(g.motes.length,0); assert.equal(g.shades.length,0); assert.equal(g.lanterns.length,5); assert.equal(g.lanterns[1].lit,true); assert.equal(g.score,0);
});
test('shade is active immediately and moves declared speed', () => {
  const g = make({ shades: [{ id:'S10',pos:[10,0,0] }] }); steps(g,60); near(g.shades[0].pos[0],10-T.shade_speed); assert.equal(g.shades[0].id,'S10');
});
test('hit loses one flame with declared invulnerability and zero drop', () => {
  const g = make({ player:{carried:5},shades:[{pos:[0,0,0]}] });
  let e = g.step(); assert.deepEqual(e[0].data,{by:'shade',flames:T.flames-1,dropped:0}); assert.equal(g.player.carried,5);
  steps(g,T.invuln_s*60-1); assert.equal(g.player.flames,T.flames-1); g.step(); assert.equal(g.player.flames,T.flames-2);
});
test('multiple shades do not bypass invulnerability in a single tick', () => {
  const g = make({shades:[{pos:[0,0,0]},{pos:[0,0,0]}]}); const e=g.step(); assert.equal(e.filter(e=>e.name==='player_hit').length,1);
});
test('pulse charges once and includes shade at exact radius', () => {
  const g=make({player:{carried:5},shades:[{id:'S1',pos:[T.pulse_radius,0,0]},{id:'S2',pos:[T.pulse_radius+.01,0,0]}]});
  const e=g.step({pulse:true}); assert.deepEqual(e.find(e=>e.name==='pulse').data.stunned_ids,['S1']); assert.equal(g.player.carried,5-T.pulse_cost);
  near(g.shades[0].pos[0],T.pulse_radius+T.pulse_push_m); assert.equal(g.shades[0].state,'stunned');
  g.step(); assert.equal(g.player.carried,5-T.pulse_cost); assert.equal(g.score,T.score.per_stun);
});
test('pulse without enough light does nothing', () => {
  const g=make({player:{carried:T.pulse_cost-1},shades:[{pos:[3,0,0]}]}); assert.equal(g.step({pulse:true}).some(e=>e.name==='pulse'),false);
});
test('pulse cooldown blocks new edge until ready', () => {
  const g=make({player:{carried:10}}); g.step({pulse:true}); g.step({pulse:false}); assert.equal(g.step({pulse:true}).length,0);
  steps(g,T.pulse_cooldown_s*60); g.step({pulse:false}); assert.equal(g.step({pulse:true})[0].name,'pulse'); assert.equal(g.player.carried,10-2*T.pulse_cost);
});
test('stun lasts declared time then chase resumes', () => {
  const g=make({player:{carried:3},shades:[{pos:[3,0,0]}]}); g.step({pulse:true}); const x=g.shades[0].pos[0]; steps(g,T.pulse_stun_s*60-1); near(g.shades[0].pos[0],x); g.step(); assert.ok(g.shades[0].pos[0]<x);
});
test('lit lamp repels shades and protects player', () => {
  const g=make({lanterns:[{id:'L1',pos:[0,0,0],lit:true}],shades:[{pos:[10,0,0]}]}); steps(g,300); assert.ok(distance(g.shades[0].pos,[0,0,0])>=T.safe_radius); assert.equal(g.player.flames,T.flames); assert.equal(g.shades[0].state,'repelled');
});
test('win scores once and stops simulation', () => {
  const g=make({player:{carried:T.lantern_cost},lanterns:[{id:'L1',pos:[0,0,0]},...['L2','L3','L4','L5'].map(id=>({id,lit:true}))]});
  const e=g.step({interact:true}); assert.equal(g.state,'won'); assert.equal(e.at(-1).data.reason,'all_lit');
  assert.equal(g.score,T.score.per_lantern+Math.floor(T.night1_duration_s-1/60)*T.score.per_second_left+T.flames*T.score.per_flame_left);
  const snapshot=g.snapshot(); g.step(); assert.deepEqual(g.snapshot(),snapshot);
});
test('loses with no_flames', () => {
  const g=make({player:{flames:1},shades:[{pos:[0,0,0]}]}); const e=g.step(); assert.equal(g.state,'lost'); assert.equal(e.at(-1).data.reason,'no_flames');
});
test('scenario time override counts down by executed steps and dawn ends early', () => {
  const g=make({time_left_s:1/60}); const e=g.step(); assert.equal(g.timeLeft,0); assert.equal(g.tick,1); assert.equal(e.at(-1).data.reason,'dawn');
});
test('explicit tie: last lamp beats dawn', () => {
  const g=make({time_left_s:1/60,player:{carried:T.lantern_cost},lanterns:[{id:'L1',pos:[0,0,0]},...['L2','L3','L4','L5'].map(id=>({id,lit:true}))]}); g.step({interact:true}); assert.equal(g.state,'won');
});
test('seed reproduces full state and spawn ids; explicit id does not collide', () => {
  const a=new Game(T,{seed:42}),b=new Game(T,{seed:42}); steps(a,650); steps(b,650); assert.deepEqual(a.snapshot(),b.snapshot());
  const g=new Game(T,{scenario:{shades:[{id:'S1',pos:[30,0,30]},{pos:[30,0,-30]}]}}); steps(g,600); assert.equal(new Set(g.shades.map(s=>s.id)).size,g.shades.length);
});
test('disabled random spawning stays disabled', () => {
  const g=make(); steps(g,1200); assert.equal(g.motes.length,0); assert.equal(g.shades.length,0);
});
test('coordinates have at most 3 decimal precision', () => {
  const g=make(); g.step({move:[1,1]}); const p=g.snapshot().player.pos; p.forEach(n=>near(n*1000,Math.round(n*1000)));
});
test('reject malformed input, duplicate ticks, nonboolean buttons', () => {
  for(const v of [{}, {frames:[{tick:0},{tick:0}]},{frames:[{tick:1},{tick:0}]},{frames:[{tick:0,move:[2,0]}]},{frames:[{tick:0,pulse:1}]}]) assert.throws(()=>validateInputs(v));
});
test('reject invalid scenario ranges, positions and duplicated ids', () => {
  for(const s of [{player:{carried:-1}},{player:{pos:[0,0]}},{shades:[{pos:[0,0,0],id:'S1'},{pos:[1,0,0],id:'S1'}]},{lanterns:[{id:'L6'}]},{random_shades:1},{time_left_s:-1}]) assert.throws(()=>validateScenario(s,T));
});
test('complete default world is winnable through inputs alone without editing state',()=>{
  const result=createDemoRoute(12);assert.equal(result.end.state,'won');assert.equal(result.snapshot.lanterns.filter(l=>l.lit).length,5);assert.ok(result.snapshot.player.flames>0);assert.ok(result.end.ticks<T.night1_duration_s*60);
});
