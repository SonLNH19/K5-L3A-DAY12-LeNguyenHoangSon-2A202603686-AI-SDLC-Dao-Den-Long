import { validateScenario } from './validation.mjs';

export const HZ = 60;
export const WORLD = Object.freeze({ radius: 40, jump_speed: 7.5, gravity: 20, initial_motes: 95, mote_spawn_ticks: 180, shade_spawn_ticks: 600 });
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const round = n => { const r = Math.round(n * 1000) / 1000; return Object.is(r, -0) ? 0 : r; };
const roundedPos = p => p.map(round);
const EPS = 1e-9;
export function seededRandom(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export class Game {
  constructor(tuning, { seed = 1, scenario = {} } = {}) {
    validateScenario(scenario, tuning);
    this.t = structuredClone(tuning);
    this.random = seededRandom(seed);
    this.tick = 0; this.state = 'playing'; this.score = 0;
    this.initialTime = scenario.time_left_s ?? tuning.night1_duration_s;
    this.timeLeft = this.initialTime;
    this.player = { pos: [0, 0, 0], carried: 0, flames: tuning.flames, ...structuredClone(scenario.player ?? {}) };
    this.vy = 0; this.invulnerableUntil = 0; this.pulseReadyAt = 0;
    this.input = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false };
    this.events = []; this.moteId = 0; this.shadeId = 0;
    this.randomMotes = scenario.random_motes ?? true; this.randomShades = scenario.random_shades ?? true;
    this.lanterns = Array.from({ length: tuning.lantern_count_night1 }, (_, i) => {
      const a = i * Math.PI * 2 / 5;
      return { id: `L${i + 1}`, pos: [Math.sin(a) * 25, 0, Math.cos(a) * 25], deposited: 0, lit: false };
    });
    for (const patch of scenario.lanterns ?? []) {
      const l = this.lanterns.find(l => l.id === patch.id); Object.assign(l, structuredClone(patch));
      if (l.lit) l.deposited = tuning.lantern_cost;
      if (l.deposited >= tuning.lantern_cost) l.lit = true;
    }
    this.motes = [];
    if (scenario.motes) for (const pos of scenario.motes) this.addMote(pos);
    else if (this.randomMotes) {
      // Five nearby lights make the first collection visible, before the scattered lights.
      for (let i = 0; i < 5; i++) this.addMote([(i - 2) * 1.5, 0, 5]);
      while (this.motes.length < WORLD.initial_motes) this.addMote(this.randomPosition(35));
    }
    this.shades = []; this.usedShadeIds = new Set((scenario.shades ?? []).filter(s => s.id).map(s => s.id));
    if (scenario.shades) for (const s of scenario.shades) this.addShade(s.pos, s.id, false);
    else if (this.randomShades) {
      this.addShade([30, 0, -15], undefined, false); this.addShade([-28, 0, 20], undefined, false);
    }
  }
  randomPosition(radius) {
    const a = this.random() * Math.PI * 2, r = Math.sqrt(this.random()) * radius;
    return [Math.cos(a) * r, 0, Math.sin(a) * r];
  }
  addMote(pos) { this.motes.push({ id: `M${++this.moteId}`, pos: [...pos] }); }
  addShade(pos, id, emit = true) {
    if (!id) { do { id = `S${++this.shadeId}`; } while (this.usedShadeIds.has(id)); }
    this.usedShadeIds.add(id);
    const shade = { id, pos: [...pos], state: 'chase', stunnedUntil: 0 }; this.shades.push(shade);
    if (emit) this.emit('shade_spawned', { id });
    return shade;
  }
  emit(name, data) { this.events.push({ type: 'event', tick: this.tick, name, data }); }
  safeAt(pos) { return this.lanterns.some(l => l.lit && distance(l.pos, pos) <= this.t.safe_radius + EPS); }
  // Shades cannot enter lit circles. Resolve scenario-start-inside positions outward too.
  excludeSafeZones(pos) {
    const result = [...pos];
    for (let pass = 0; pass < 5; pass++) for (const l of this.lanterns) {
      if (!l.lit) continue;
      const d = distance(result, l.pos);
      if (d <= this.t.safe_radius + EPS) {
        const dx = d > EPS ? (result[0] - l.pos[0]) / d : 1;
        const dz = d > EPS ? (result[2] - l.pos[2]) / d : 0;
        result[0] = l.pos[0] + dx * (this.t.safe_radius + 0.00001);
        result[2] = l.pos[2] + dz * (this.t.safe_radius + 0.00001);
      }
    }
    return result;
  }
  step(patch = {}) {
    if (this.state !== 'playing') return [];
    const old = this.input;
    this.input = { ...old, ...patch };
    const edge = key => this.input[key] === true && !old[key];
    this.tick++; this.events = [];
    const t = this.t, p = this.player;
    let [x, z] = this.input.move; const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    const yaw = this.input.cam_yaw_deg * Math.PI / 180;
    const dx = x * Math.cos(yaw) + z * Math.sin(yaw), dz = -x * Math.sin(yaw) + z * Math.cos(yaw);
    p.pos[0] += dx * t.player_speed / HZ; p.pos[2] += dz * t.player_speed / HZ;
    const radius = Math.hypot(p.pos[0], p.pos[2]);
    // Restrict only movement, leaving scenario positions untouched in stationary tests.
    if (radius > WORLD.radius - 0.5 && len > 0) {
      p.pos[0] *= (WORLD.radius - 0.5) / radius; p.pos[2] *= (WORLD.radius - 0.5) / radius;
    }
    if (edge('jump') && p.pos[1] <= EPS) this.vy = WORLD.jump_speed;
    if (p.pos[1] > 0 || this.vy !== 0) {
      p.pos[1] = Math.max(0, p.pos[1] + this.vy / HZ); this.vy -= WORLD.gravity / HZ;
      if (p.pos[1] === 0) this.vy = 0;
    }
    this.motes = this.motes.filter(m => {
      if (p.carried < t.carry_capacity && distance(p.pos, m.pos) <= t.pickup_radius + EPS) {
        p.carried++; this.score += t.score.per_mote; this.emit('mote_picked', { carried: p.carried }); return false;
      }
      return true;
    });
    if (edge('interact') && p.carried > 0) {
      const candidates = this.lanterns.filter(l => !l.lit && distance(p.pos, l.pos) <= t.interact_radius + EPS);
      candidates.sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos) || (a.id < b.id ? -1 : 1));
      const l = candidates[0];
      if (l) {
        const amount = Math.min(p.carried, t.lantern_cost - l.deposited);
        p.carried -= amount; l.deposited += amount;
        this.emit('deposit', { lantern_id: l.id, amount, deposited: l.deposited });
        if (l.deposited >= t.lantern_cost) { l.lit = true; this.score += t.score.per_lantern; this.emit('lantern_lit', { lantern_id: l.id }); }
      }
    }
    if (edge('pulse') && p.carried >= t.pulse_cost && this.tick >= this.pulseReadyAt) {
      p.carried -= t.pulse_cost; this.pulseReadyAt = this.tick + Math.ceil(t.pulse_cooldown_s * HZ);
      const ids = [];
      for (const s of this.shades) if (distance(p.pos, s.pos) <= t.pulse_radius + EPS) {
        const d = distance(p.pos, s.pos), ux = d > EPS ? (s.pos[0] - p.pos[0]) / d : 1, uz = d > EPS ? (s.pos[2] - p.pos[2]) / d : 0;
        s.pos[0] += ux * t.pulse_push_m; s.pos[2] += uz * t.pulse_push_m;
        s.pos = this.excludeSafeZones(s.pos); s.state = 'stunned'; s.stunnedUntil = this.tick + Math.ceil(t.pulse_stun_s * HZ);
        ids.push(s.id); this.score += t.score.per_stun;
      }
      this.emit('pulse', { stunned_ids: ids });
    }
    if (this.randomMotes && this.tick % WORLD.mote_spawn_ticks === 0 && this.motes.length < WORLD.initial_motes) this.addMote(this.randomPosition(35));
    if (this.randomShades && this.tick % WORLD.shade_spawn_ticks === 0 && this.shades.length < 8) this.addShade(this.randomPosition(36));
    for (const s of this.shades) {
      if (s.state === 'stunned' && this.tick < s.stunnedUntil) continue;
      s.state = 'chase';
      const d = distance(s.pos, p.pos), amount = Math.min(d, t.shade_speed / HZ);
      const target = [...s.pos];
      if (d > EPS) { target[0] += (p.pos[0] - s.pos[0]) / d * amount; target[2] += (p.pos[2] - s.pos[2]) / d * amount; }
      s.pos = this.excludeSafeZones(target);
      if (this.safeAt(p.pos)) s.state = 'repelled';
      if (!this.safeAt(p.pos) && distance(s.pos, p.pos) <= t.shade_hit_radius + EPS && this.tick >= this.invulnerableUntil && p.flames > 0) {
        p.flames--; const dropped = Math.floor(p.carried * t.hit_drop_ratio); p.carried -= dropped;
        for (let i = 0; i < dropped; i++) this.addMote([p.pos[0] + 2.5 + i * 0.15, 0, p.pos[2]]);
        this.invulnerableUntil = this.tick + Math.ceil(t.invuln_s * HZ);
        this.emit('player_hit', { by: 'shade', flames: p.flames, dropped });
      }
    }
    this.timeLeft = Math.max(0, this.initialTime - this.tick / HZ);
    // Explicit tie rule: all_lit wins over no_flames, which wins over dawn.
    if (this.lanterns.every(l => l.lit)) this.finish('won', 'all_lit');
    else if (p.flames <= 0) this.finish('lost', 'no_flames');
    else if (this.timeLeft <= EPS) this.finish('lost', 'dawn');
    return this.events;
  }
  finish(state, reason) {
    this.state = state;
    if (state === 'won') this.score += Math.floor(this.timeLeft) * this.t.score.per_second_left + this.player.flames * this.t.score.per_flame_left;
    this.emit('game_over', { result: state, reason });
  }
  snapshot() {
    return { type: 'snapshot', tick: this.tick, sim_tick: this.tick, state: this.state, time_left_s: this.timeLeft, score: this.score,
      player: { pos: roundedPos(this.player.pos), flames: this.player.flames, carried: this.player.carried },
      lanterns: this.lanterns.map(l => ({ id: l.id, pos: roundedPos(l.pos), lit: l.lit, deposited: l.deposited })),
      shades: this.shades.map(s => ({ id: s.id, pos: roundedPos(s.pos), state: s.state })),
      motes_active: this.motes.length, motes: this.motes.map(m => ({ id: m.id, pos: roundedPos(m.pos) })) };
  }
  end() { return { type: 'end', ticks: this.tick, state: this.state, score: this.score }; }
}
