import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Game, distance } from '../src/game.mjs';
import { ROOT } from './build.mjs';
// Generate inputs by playing the real default world; no state edits or scenario overrides.
export function createDemoRoute(seed = 12) {
  const tuning=JSON.parse(readFileSync(join(ROOT,'game.contract.json'),'utf8')).tuning;
  const game=new Game(tuning,{seed}),frames=[];
  while(game.state==='playing'&&game.tick<tuning.night1_duration_s*60){
    const pos=game.player.pos;
    const lamps=game.lanterns.filter(l=>!l.lit).sort((a,b)=>distance(pos,a.pos)-distance(pos,b.pos));
    const lamp=lamps[0];
    const needed=lamp?tuning.lantern_cost-lamp.deposited:0;
    const mote=[...game.motes].sort((a,b)=>distance(pos,a.pos)-distance(pos,b.pos))[0];
    const target=game.player.carried>=needed?lamp:mote;
    let move=[0,0],interact=false;
    if(target){
      const dx=target.pos[0]-pos[0],dz=target.pos[2]-pos[2],d=Math.hypot(dx,dz);
      const atLamp=target===lamp&&d<=tuning.interact_radius;
      if(atLamp)interact=!game.input.interact;
      else if(d>0)move=[dx/Math.max(1,d),dz/Math.max(1,d)];
    }
    const threat=game.shades.some(s=>s.state!=='stunned'&&distance(pos,s.pos)<5);
    const pulse=threat&&game.player.carried>=tuning.pulse_cost&&game.tick+1>=game.pulseReadyAt&&!game.input.pulse;
    const frame={tick:game.tick,move,cam_yaw_deg:0,interact,pulse};frames.push(frame);game.step(frame);
  }
  return {seed,frames,end:game.end(),snapshot:game.snapshot()};
}
if(process.argv.includes('--write')){
  const route=createDemoRoute();if(route.end.state!=='won')throw new Error(`Default route failed: ${JSON.stringify(route.end)}`);
  const dir=join(ROOT,'docs/proof/phase-1');mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'full-run.inputs.json'),JSON.stringify({frames:route.frames})+'\n');
  writeFileSync(join(dir,'full-run.summary.json'),JSON.stringify({seed:route.seed,end:route.end,seconds:route.end.ticks/60,snapshot:route.snapshot,note:'Default game, no scenario overrides or state edits; inputs generated using observable positions.'},null,2)+'\n');
  console.log(`Default world won in ${route.end.ticks} ticks (${(route.end.ticks/60).toFixed(2)}s).`);
}
