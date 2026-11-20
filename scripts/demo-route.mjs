import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Game, distance } from '../src/game.mjs';
import { ROOT } from './build.mjs';

export function createDemoRoute(seed = 4, night = 1) {
  const tuning = JSON.parse(readFileSync(join(ROOT, 'game.contract.json'), 'utf8')).tuning;
  const game = new Game(tuning, { seed, night });
  const frames = [];
  const maxTicks = (night === 1 ? tuning.night1_duration_s : (night === 2 ? tuning.night2_duration_s : tuning.night3_duration_s)) * 60;

  while (game.state === 'playing' && game.tick < maxTicks) {
    const pos = game.player.pos;
    const litLamps = game.lanterns.filter(l => l.lit);
    const remaining=l=>(l.ever_lit?tuning.relight_cost:tuning.lantern_cost)-l.deposited;
    const unlitLamps = game.lanterns.filter(l => !l.lit).sort((a, b) => distance(pos, a.pos)+remaining(a)*8 - distance(pos, b.pos)-remaining(b)*8);
    const required = Math.ceil(tuning.win_ratio * game.lanterns.length);
    const urgent = [...litLamps].filter(l=>l.fuel<(litLamps.length<required?25:50)).sort((a,b)=>a.fuel-b.fuel || distance(pos,a.pos)-distance(pos,b.pos))[0];
    const lamp = urgent && game.player.carried>0 ? urgent : (litLamps.length<required ? unlitLamps[0] : null);

    // Nearest motes
    const risk=m=>game.shades.some(s=>s.state!=='stunned'&&distance(m.pos,s.pos)<4)?15:0;
    const motes = [...game.motes].sort((a, b) => distance(pos, a.pos)+risk(a) - distance(pos, b.pos)-risk(b));
    const mote = motes[0];

    // Deposit if carried >= 7 or carried >= needed, or carried >= 4 and close to lamp
    const needed = lamp ? (lamp.lit ? Math.ceil((100-lamp.fuel)/10) : (lamp.ever_lit?tuning.relight_cost:tuning.lantern_cost)-lamp.deposited) : 0;
    const shouldGoLamp = lamp && (game.player.carried >= Math.min(lamp.lit?3:7, needed) || (game.player.carried >= 3 && distance(pos, lamp.pos) < 12.0) || !mote);
    const safeLamp=[...litLamps].filter(l=>l.fuel>=30).sort((a,b)=>distance(pos,a.pos)-distance(pos,b.pos))[0];
    const target = shouldGoLamp ? lamp : (game.player.carried<game.player.capacity?(mote??lamp):safeLamp);

    let move = [0, 0];
    let interact = false;
    let dash = false;

    // Check danger from shades
    const activeShades = game.shades.filter(s => s.state !== 'stunned' && s.state !== 'recoil');
    const closeShades = activeShades.filter(s => distance(pos, s.pos) < 3.0);
    const nearestShade = closeShades.sort((a, b) => distance(pos, a.pos) - distance(pos, b.pos))[0];

    const threat = Boolean(nearestShade);
    const canPulse = game.player.carried >= tuning.pulse_cost && game.player.pulseCdTicks <= 0 && !game.input.pulse;
    const pulse = threat && canPulse;

    if (threat && !canPulse && nearestShade) {
      // Evade shade: move away from shade or towards nearest lit lantern safe zone
      const nearestLit = litLamps.sort((a, b) => distance(pos, a.pos) - distance(pos, b.pos))[0];
      if (nearestLit && distance(pos, nearestLit.pos) < 15.0) {
        const ex = nearestLit.pos[0] - pos[0];
        const ez = nearestLit.pos[2] - pos[2];
        const ed = Math.hypot(ex, ez);
        if (ed > 0) move = [ex / ed, ez / ed];
      } else {
        const awayX = pos[0] - nearestShade.pos[0];
        const awayZ = pos[2] - nearestShade.pos[2];
        const ad = Math.hypot(awayX, awayZ);
        if (ad > 0) move = [awayX / ad, awayZ / ad];
      }
      if (game.player.dashCdTicks <= 0 && !game.input.dash) {
        dash = true;
      }
    } else if (target) {
      const dx = target.pos[0] - pos[0];
      const dz = target.pos[2] - pos[2];
      const d = Math.hypot(dx, dz);
      const atLamp = target === lamp && d <= tuning.interact_radius;
      if (atLamp) {
        interact = !game.input.interact;
      } else if (d > 0) {
        move = [dx / Math.max(1, d), dz / Math.max(1, d)];
        if (d > 3.0 && game.player.dashCdTicks <= 0 && !game.input.dash && !threat) {
          dash = true;
        }
      }
    }

    const frame = { tick: game.tick, move, cam_yaw_deg: 0, interact, pulse, dash };
    frames.push(frame);
    game.step(frame);
  }

  return { seed, night, frames, end: game.end(), snapshot: game.snapshot() };
}

if (process.argv.includes('--write')) {
  const route = createDemoRoute();
  const dir = join(ROOT, 'docs/proof/phase-3');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'full-run.inputs.json'), JSON.stringify({ frames: route.frames }) + '\n');
  writeFileSync(join(dir, 'full-run.summary.json'), JSON.stringify({
    seed: route.seed,
    night: route.night,
    end: route.end,
    seconds: route.end.ticks / 60,
    snapshot: route.snapshot,
    note: 'Default game, no scenario overrides or state edits; inputs generated using observable positions.'
  }, null, 2) + '\n');
  console.log(`Default world ${route.end.state} in ${route.end.ticks} ticks (${(route.end.ticks / 60).toFixed(2)}s).`);
}
