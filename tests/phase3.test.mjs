import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game, HZ, distance } from '../src/game.mjs';
import { validateScenario } from '../src/validation.mjs';
const T=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
const make=(s={},night=1,t=T)=>new Game(t,{night,scenario:{random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,motes:[],shades:[],...s}});
function steps(g,n,patch={}){const events=[];for(let i=0;i<n;i++)events.push(...g.step(i?{}:patch));return events;}
const lit=(count,fuel=100)=>Array.from({length:count},(_,i)=>({id:`L${i+1}`,lit:true,fuel}));

test('v1.2 uses exact durations, thresholds and initial capacities on three nights',()=>{
  for(const [night,duration,total,needed]of [[1,240,5,3],[2,270,6,4],[3,300,7,5]]){
    const g=make({},night);assert.equal(g.initialTime,duration);assert.equal(g.lanterns.length,total);assert.equal(Math.ceil(total*T.win_ratio),needed);assert.equal(g.snapshot().player.capacity,10);
  }
});
test('scenario-lit lamps default to fuel=100, ever_lit=true; no score/capacity reward',()=>{
  const g=make({lanterns:lit(5)});assert.equal(g.score,0);assert.equal(g.player.capacity,10);assert.equal(g.player.successful_lights,0);
  for(const l of g.snapshot().lanterns){assert.equal(l.fuel,100);assert.equal(l.ever_lit,true);assert.equal(l.relit_count,0);}
});
test('one unit/second oil decay uses exact integers, no floating drift',()=>{
  const g=make({lanterns:lit(1)});steps(g,60);assert.equal(g.lanterns[0].fuelUnits,99*60);assert.equal(g.snapshot().lanterns[0].fuel,99);
  steps(g,5939);assert.equal(g.lanterns[0].fuelUnits,1);assert.equal(g.lanterns[0].lit,true);
  const events=g.step();assert.equal(g.lanterns[0].fuelUnits,0);assert.equal(g.lanterns[0].lit,false);assert.equal(g.lanterns[0].deposited,0);assert.equal(g.lanterns[0].ever_lit,true);assert.deepEqual(events.find(e=>e.name==='lantern_out').data,{lantern_id:'L1'});
});
test('first light costs 10; relight costs 5; capacity grows only on successful lighting',()=>{
  const g=make({player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0]}]});let e=g.step({interact:true});
  assert.equal(e.find(e=>e.name==='lantern_lit').data.relight,false);assert.equal(g.player.capacity,12);assert.equal(g.score,150);assert.equal(g.lanterns[0].fuel,100);
  // Advance to an authentic extinction; inject no fuel edits or setup rewards.
  steps(g,6000,{interact:false});assert.equal(g.lanterns[0].lit,false);
  // Scenario controls starting inventory for the separate relight case.
  const r=make({player:{carried:5,successful_lights:1},lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true}]});e=r.step({interact:true});
  assert.equal(e.find(e=>e.name==='lantern_lit').data.relight,true);assert.equal(r.player.capacity,14);assert.equal(r.player.successful_lights,2);assert.equal(r.score,65);assert.equal(r.lanterns[0].relit_count,1);assert.equal(r.lanterns[0].fuel,100);
});
test('partial relight preserves progress, capacity stays unchanged until complete',()=>{
  const g=make({player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true}]});g.step({interact:true});assert.equal(g.lanterns[0].deposited,3);assert.equal(g.player.capacity,10);assert.equal(g.score,15);
});
test('capacity formula caps at 20 and resets with each new night',()=>{
  for(const n of [0,1,2,4,5,10])assert.equal(make({player:{successful_lights:n}}).player.capacity,Math.min(20,10+2*n));
  assert.equal(make({},2).player.successful_lights,0);assert.equal(make({},2).player.capacity,10);
  const g=make({player:{successful_lights:5,carried:19},motes:[[0,0,0],[0,0,0]]});g.step();assert.equal(g.player.carried,20);assert.equal(g.motes.length,1);
});
test('refuel uses ceiling, clamps to 100, scores +5/mote, no new lighting reward',()=>{
  const g=make({player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:85}]});const e=g.step({interact:true});
  assert.deepEqual(e.find(e=>e.name==='refuel').data,{lantern_id:'L1',amount:2,fuel:100});assert.equal(g.player.carried,8);assert.equal(g.score,10);assert.equal(g.player.successful_lights,0);assert.equal(g.lanterns[0].relit_count,0);
});
test('refuel is limited by inventory and held interaction does not repeat',()=>{
  const g=make({player:{carried:1},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:50}]});g.step({interact:true});assert.equal(g.lanterns[0].fuelUnits,60*60-1);assert.equal(g.player.carried,0);assert.equal(g.step().some(e=>e.name==='refuel'),false);
});
test('full lamp is not eligible and cannot hide a receiving lamp (zero-decay unit fixture)',()=>{
  const t={...T,fuel_decay_per_s:0};const g=make({player:{carried:2},lanterns:[{id:'L1',pos:[0,0,0],lit:true},{id:'L2',pos:[1,0,0]}]},1,t);
  const e=g.step({interact:true});assert.equal(e.some(e=>e.name==='refuel'),false);assert.equal(e.find(e=>e.name==='deposit').data.lantern_id,'L2');
});
test('interaction includes receiving lit lamps and ties choose lower id',()=>{
  const g=make({player:{carried:1},lanterns:[{id:'L1',pos:[1,0,0],lit:true,fuel:90},{id:'L2',pos:[-1,0,0]}]});assert.equal(g.step({interact:true}).find(e=>e.name==='refuel').data.lantern_id,'L1');
});
test('fuel loss precedes interaction: extinguishing at step2 allows same-tick relight',()=>{
  const g=make({player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:1/60}]});const e=g.step({interact:true});
  assert.deepEqual(e.map(e=>e.name),['lantern_out','deposit','lantern_lit']);assert.equal(g.lanterns[0].fuel,100);assert.equal(g.lanterns[0].relit_count,1);assert.equal(g.score,65);
});
test('safe boundary fuel=30 is safe, below 30 is unsafe; decay applies before movement',()=>{
  const g=make({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:30}]});assert.equal(g.isSafeAt([6,0,0]),true);g.step();assert.equal(g.isSafeAt([0,0,0]),false);
});
test('wander chooses nearest weak lamp with deterministic id tie, ignoring nearer dark lamp',()=>{
  const g=make({player:{pos:[-30,0,0]},lanterns:[{id:'L1',pos:[20,0,1],lit:true,fuel:20},{id:'L2',pos:[20,0,-1],lit:true,fuel:20},{id:'L3',pos:[20,0,0]}],shades:[{id:'S1',pos:[20,0,0],state:'wander'}]});g.step();assert.equal(g.shades[0].target_lantern_id,'L1');assert.equal(g.shades[0].state,'drain');
});
test('wander without weak lamps moves toward nearest unlit lamp',()=>{
  const g=make({player:{pos:[-30,0,0]},lanterns:[{id:'L1',pos:[25,0,0]}],shades:[{pos:[20,0,0],state:'wander'}]});g.step();assert.equal(g.shades[0].target_lantern_id,'L1');assert.ok(g.shades[0].pos[0]>20);
});
test('chase keeps player target even when a weak lamp is near',()=>{
  const g=make({player:{pos:[0,0,0]},lanterns:[{id:'L1',pos:[10,0,0],lit:true,fuel:20}],shades:[{pos:[10,0,0],state:'chase'}]});g.step();assert.equal(g.shades[0].state,'chase');assert.ok(g.shades[0].pos[0]<10);
});
test('two stationary drainers stack with natural decay, emit once per 60 active drain ticks',()=>{
  const g=make({player:{pos:[-30,0,0]},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:29}],shades:[{id:'S1',pos:[20,0,0],state:'drain',target_lantern_id:'L1'},{id:'S2',pos:[21,0,0],state:'drain',target_lantern_id:'L1'}]});
  const before=g.shades.map(s=>[...s.pos]);const e=steps(g,60);assert.equal(g.lanterns[0].fuel,18);assert.deepEqual(g.shades.map(s=>s.pos),before);assert.equal(e.filter(e=>e.name==='fuel_drain').length,2);assert.ok(e.filter(e=>e.name==='fuel_drain').every(e=>e.tick===60&&e.data.fuel===18));
});
test('drain turns chase within 6m; beyond 6m it does not use normal 12m detection',()=>{
  const g=make({player:{pos:[12,0,0]},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:20}],shades:[{pos:[20,0,0],state:'drain',target_lantern_id:'L1'}]});g.step();assert.equal(g.shades[0].state,'drain');
  const near=make({player:{pos:[14,0,0]},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:20}],shades:[{pos:[20,0,0],state:'drain',target_lantern_id:'L1'}]});near.step();assert.equal(near.shades[0].state,'chase');
});
test('extinguished target releases drain and stops all future fuel events',()=>{
  const g=make({player:{pos:[-30,0,0]},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:.1}],shades:[{pos:[20,0,0],state:'drain',target_lantern_id:'L1'}]});const e=g.step();assert.equal(e.some(e=>e.name==='lantern_out'),true);assert.equal(g.shades[0].state,'wander');assert.equal(steps(g,60).some(e=>e.name==='fuel_drain'),false);
});
test('refueling to at least 30 restores safety, pushes out within 30 ticks without damage',()=>{
  const g=make({player:{pos:[0,0,0],carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{pos:[1,0,0],state:'drain',target_lantern_id:'L1'}]});const e=g.step({interact:true});assert.ok(g.lanterns[0].fuel>=30);assert.equal(e.some(e=>e.name==='player_hit'),false);assert.equal(g.shades[0].state,'wander');
  const tail=steps(g,29,{interact:false});assert.equal(tail.some(e=>e.name==='player_hit'),false);assert.ok(distance(g.shades[0].pos,[0,0,0])>=6);assert.equal(g.player.flames,3);
});
test('pulse scores total +15 for drain and +5 for other shade',()=>{
  const g=make({player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[4,0,0],state:'drain',target_lantern_id:'L1'},{id:'S2',pos:[-4,0,0],state:'wander'}]});const e=g.step({pulse:true});assert.equal(e.find(e=>e.name==='pulse').data.stunned_ids.length,2);assert.equal(g.score,20);assert.equal(g.shades[0].state,'stunned');
});
test('stun expiry returns to wander rather than reacquiring chase in the same tick',()=>{
  const g=make({shades:[{pos:[10,0,0],state:'stunned',state_ticks_left:1}]});g.step();assert.equal(g.shades[0].state,'wander');
});
test('drain displaced beyond 2m returns wander without switching to chase at 8m',()=>{
  const g=make({player:{pos:[9,0,0]},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:20}],shades:[{pos:[17,0,0],state:'drain',target_lantern_id:'L1'}]});g.step();assert.equal(g.shades[0].state,'wander');
});
test('dawn thresholds are 3/5, 4/6, 5/7; no early win and no time reward',()=>{
  for(const [night,required]of [[1,3],[2,4],[3,5]]){
    for(const count of [required-1,required]){const g=make({time_left_s:1/60,lanterns:lit(count)},night);const e=g.step();assert.equal(g.state,count===required?'won':'lost');assert.equal(e.at(-1).data.reason,count===required?'dawn_survived':'dawn');assert.equal(g.score,count===required?count*149+150:0);}
  }
  const g=make({lanterns:lit(5)});steps(g,60);assert.equal(g.state,'playing');assert.equal(g.score,0);
});
test('last-tick fuel exhaustion counts before dawn; no_flames outranks enough lights',()=>{
  const g=make({time_left_s:1/60,lanterns:[...lit(2),{id:'L3',lit:true,fuel:1/60}]});assert.equal(g.step().at(-1).data.reason,'dawn');
  const h=make({time_left_s:1/60,player:{pos:[-30,0,0],flames:1},lanterns:lit(3),shades:[{pos:[-30,0,0]}]});assert.equal(h.step().at(-1).data.reason,'no_flames');assert.equal(h.state,'lost');assert.equal(h.score,0);
});
test('pause freezes oil, drain counter, successful lights and dawn',()=>{
  const g=make({lanterns:lit(1,20)});g.step({pause:true});const units=g.lanterns[0].fuelUnits;steps(g,120);assert.equal(g.lanterns[0].fuelUnits,units);assert.equal(g.simTick,0);assert.equal(g.player.capacity,10);
});
test('scenario capacity validation uses successful_lights and rejects bad oil/state',()=>{
  assert.doesNotThrow(()=>validateScenario({player:{successful_lights:5,carried:20},shades:[{pos:[0,0,0],state:'drain',target_lantern_id:'L1'}]},T));
  for(const s of [{player:{successful_lights:-1}},{player:{successful_lights:1,carried:13}},{lanterns:[{id:'L1',fuel:101}]},{lanterns:[{id:'L1',lit:true,fuel:0}]},{shades:[{pos:[0,0,0],target_lantern_id:'L9'}]}])assert.throws(()=>validateScenario(s,T));
});
