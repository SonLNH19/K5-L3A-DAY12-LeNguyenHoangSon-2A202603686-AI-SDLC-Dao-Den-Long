import { validateScenario } from './validation.mjs';

export const HZ = 60;
export const EPS = 1e-9;
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
export const distance3D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const round = n => { const r = Math.round(n * 1000) / 1000; return Object.is(r, -0) ? 0 : r; };
const roundedPos = p => p.map(round);

export function seededRandom(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6D2B79F5;
    let t = n;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function getNightConfig(night) {
  if (night === 2) {
    return {
      duration_s: 270,
      lanterns: [
        { id: 'L1', pos: [0, 0, 20] },
        { id: 'L2', pos: [17, 0, -10] },
        { id: 'L3', pos: [-17, 0, -10] },
        { id: 'L4', pos: [70, 0, 20] },
        { id: 'L5', pos: [87, 0, -10] },
        { id: 'L6', pos: [53, 0, -10] }
      ],
      moteSpawnPoints: (() => {
        const pts = [];
        for (const deg of [0, 90, 180, 270]) {
          const rad = deg * Math.PI / 180;
          pts.push([10 * Math.cos(rad), 0, 10 * Math.sin(rad)]);
        }
        for (let deg = 0; deg < 360; deg += 45) {
          const rad = deg * Math.PI / 180;
          pts.push([22 * Math.cos(rad), 0, 22 * Math.sin(rad)]);
        }
        const bPts = pts.map(p => [p[0] + 70, 0, p[2]]);
        return [...pts, ...bPts];
      })(),
      shadeSpawnPoints: (() => {
        const pts = [];
        for (let deg = 22.5; deg < 360; deg += 45) {
          const rad = deg * Math.PI / 180;
          pts.push([26 * Math.cos(rad), 0, 26 * Math.sin(rad)]);
        }
        const bPts = pts.map(p => [p[0] + 70, 0, p[2]]);
        return [...pts, ...bPts];
      })(),
      shadeMax: 8,
      shadeSpawnInterval: 420,
      shadeSpeed: 4.0,
      charms: [{ id: 'C1', pos: [35, 0, 0] }],
      hasDrifters: true
    };
  }
  if (night === 3) {
    return {
      duration_s: 300,
      lanterns: [
        { id: 'L1', pos: [0, 6, 6] },
        { id: 'L2', pos: [18, 3, 10] },
        { id: 'L3', pos: [-18, 3, 10] },
        { id: 'L4', pos: [35, 0, -10] },
        { id: 'L5', pos: [-35, 0, -10] },
        { id: 'L6', pos: [20, 0, -35] },
        { id: 'L7', pos: [-20, 0, -35] }
      ],
      moteSpawnPoints: (() => {
        const pts = [];
        for (let deg = 0; deg < 360; deg += 20) {
          const rad = deg * Math.PI / 180;
          pts.push([34 * Math.cos(rad), 0, 34 * Math.sin(rad)]);
        }
        for (let deg = 20; deg <= 160; deg += 20) {
          const rad = deg * Math.PI / 180;
          pts.push([18 * Math.cos(rad), 3, 18 * Math.sin(rad)]);
        }
        for (const deg of [45, 135, 225, 315]) {
          const rad = deg * Math.PI / 180;
          pts.push([5 * Math.cos(rad), 6, 5 * Math.sin(rad)]);
        }
        return pts;
      })(),
      shadeSpawnPoints: (() => {
        const pts = [];
        for (let deg = 0; deg < 360; deg += 22.5) {
          const rad = deg * Math.PI / 180;
          pts.push([43 * Math.cos(rad), 0, 43 * Math.sin(rad)]);
        }
        return pts;
      })(),
      shadeMax: 10,
      shadeSpawnInterval: 360,
      shadeSpeed: 4.5,
      charms: [{ id: 'C1', pos: [30, 0, 25] }, { id: 'C2', pos: [-30, 0, 25] }],
      hasDrifters: true,
      hasStrongWind: true
    };
  }
  // Night 1
  return {
    duration_s: 240,
    lanterns: [
      { id: 'L1', pos: [0, 0, 25] },
      { id: 'L2', pos: [23.8, 0, 7.7] },
      { id: 'L3', pos: [14.7, 0, -20.2] },
      { id: 'L4', pos: [-14.7, 0, -20.2] },
      { id: 'L5', pos: [-23.8, 0, 7.7] }
    ],
    moteSpawnPoints: (() => {
      const pts = [];
      for (let deg = 0; deg < 360; deg += 45) {
        const rad = deg * Math.PI / 180;
        pts.push([12 * Math.cos(rad), 0, 12 * Math.sin(rad)]);
      }
      for (let deg = 0; deg < 360; deg += 22.5) {
        const rad = deg * Math.PI / 180;
        pts.push([33 * Math.cos(rad), 0, 33 * Math.sin(rad)]);
      }
      return pts;
    })(),
    shadeSpawnPoints: (() => {
      const pts = [];
      for (let deg = 15; deg < 360; deg += 30) {
        const rad = deg * Math.PI / 180;
        pts.push([37 * Math.cos(rad), 0, 37 * Math.sin(rad)]);
      }
      return pts;
    })(),
    shadeMax: 6,
    shadeSpawnInterval: 480,
    shadeSpeed: 4.0,
    charms: [],
    hasDrifters: false
  };
}

export class Game {
  constructor(tuning, { seed = 1, scenario = {}, night = 1, benchmark = false } = {}) {
    validateScenario(scenario, tuning);
    this.t = structuredClone(tuning);
    this.isScenario = Boolean(scenario && Object.keys(scenario).length > 0);
    this.scenarioNight = scenario.night;
    this.night = scenario.night ?? night ?? 1;
    this.config = getNightConfig(this.night);
    this.random = seededRandom(seed);
    this.tick = 0;
    this.simTick = 0;
    this.state = 'playing';
    this.paused = false;
    this.score = 0;
    this.benchmark=benchmark;

    const defaultDuration = this.night === 1 ? this.t.night1_duration_s : (this.night === 2 ? this.t.night2_duration_s : this.t.night3_duration_s);
    this.initialTime = scenario.time_left_s ?? defaultDuration;
    this.timeLeft = this.initialTime;

    this.player = {
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      grounded: true,
      carried: 0,
      flames: this.t.flames,
      facingYaw: 0,
      invulnTicks: 0,
      dashCdTicks: 0,
      dashTicksLeft: 0,
      dashDir: [0, 0],
      pulseCdTicks: 0,
      charmTicks: 0,
      fallingWait: 0,
      padActive: false,
      padVel: [0, 0],
      successful_lights: 0,
      ...structuredClone(scenario.player ?? {})
    };
    Object.defineProperty(this.player, 'capacity', { enumerable: true, get: () => Math.min(this.t.capacity_max, this.t.carry_capacity + 2 * this.player.successful_lights) });
    if (scenario.player?.invuln_ticks) this.player.invulnTicks = scenario.player.invuln_ticks;
    if (scenario.player?.dash_cd_ticks) this.player.dashCdTicks = scenario.player.dash_cd_ticks;
    if (scenario.player?.pulse_cd_ticks) this.player.pulseCdTicks = scenario.player.pulse_cd_ticks;
    if (scenario.player?.charm_ticks) this.player.charmTicks = scenario.player.charm_ticks;

    this.input = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false, pause: false };
    this.events = [];
    this.moteId = 0;
    this.shadeId = 0;
    this.drifterId = 0;

    this.randomMotes = scenario.random_motes ?? true;
    this.randomShades = scenario.random_shades ?? true;
    this.randomDrifters = scenario.random_drifters ?? true;
    this.windEnabled = scenario.wind_enabled ?? Boolean(this.config.hasStrongWind);
    this.wind = { active: false, dir_deg: 0, timer: 0 };

    // Lanterns
    this.lanterns = this.config.lanterns.map(l => ({
      id: l.id,
      pos: [...l.pos],
      deposited: 0,
      lit: false,
      fuelUnits: 0,
      ever_lit: false,
      relit_count: 0
    }));
    for (const patch of scenario.lanterns ?? []) {
      const l = this.lanterns.find(item => item.id === patch.id);
      if (l) {
        Object.assign(l, structuredClone(patch));
        const cost = l.ever_lit ? this.t.relight_cost : this.t.lantern_cost;
        if (l.deposited >= cost) l.lit = true;
        if (l.lit) {
          l.deposited = cost;
          l.fuelUnits = Math.round((patch.fuel ?? this.t.fuel_max) * HZ);
          l.ever_lit = true;
        } else l.fuelUnits = 0;
      }
    }
    for (const l of this.lanterns) Object.defineProperty(l, 'fuel', { configurable: true, enumerable: true, get() { return this.fuelUnits / HZ; } });

    // Charms
    this.charms = (this.config.charms || []).map(c => ({
      id: c.id,
      pos: [...c.pos],
      available: true,
      respawnTicks: 0
    }));
    if (scenario.charms) {
      this.charms = scenario.charms.map(c => ({
        id: c.id,
        pos: [...(c.pos ?? [0, 0, 0])],
        available: c.available ?? true,
        respawnTicks: c.respawn_ticks ?? 0
      }));
    }

    // Motes
    this.motes = [];
    if (scenario.motes) {
      for (const pos of scenario.motes) this.addMote(pos, 'random');
    } else if (this.randomMotes) {
      // 20 motes initially at spawn points
      const pts = [...this.config.moteSpawnPoints];
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      for (let i = 0; i < Math.min(20, pts.length); i++) {
        this.addMote(pts[i], 'random');
      }
    }

    // Shades
    this.shades = [];
    this.usedShadeIds = new Set((scenario.shades ?? []).filter(s => s.id).map(s => s.id));
    if (scenario.shades) {
      for (const s of scenario.shades) {
        const shade = this.addShade(s.pos, s.id, false, s.state, s.state_ticks_left);
        shade.target_lantern_id = s.target_lantern_id ?? null;
      }
    }

    // Drifters (Gió Lạc)
    this.drifters = [];
    if (scenario.drifters) {
      for (const d of scenario.drifters) {
        this.drifters.push({
          id: d.id,
          pos: [...d.pos],
          state: d.state ?? 'idle',
          stolen: d.stolen ?? 0,
          fleeTicks: 0,
          despawnTicks: 0
        });
      }
    }
  }

  addMote(pos, kind = 'random', ttlTicks = Infinity) {
    const mote = {
      id: `M${++this.moteId}`,
      pos: [...pos],
      kind,
      ttlTicks
    };
    this.motes.push(mote);
    return mote;
  }

  addShade(pos, id, emit = true, state = 'chase', stateTicks = 0) {
    if (!id) {
      do { id = `S${++this.shadeId}`; } while (this.usedShadeIds.has(id));
    }
    this.usedShadeIds.add(id);
    const shade = {
      id,
      pos: [...pos],
      state,
      stateTicksLeft: stateTicks,
      stunnedTicks: state === 'stunned' ? stateTicks : 0,
      recoilTicks: state === 'recoil' ? stateTicks : 0,
      recoilDir: [0, 0],
      pushVel: [0, 0],
      pushTicks: 0,
      target_lantern_id: null,
      drainTicks: 0,
      safePushTicks: 0
    };
    this.shades.push(shade);
    if (emit) this.emit('shade_spawned', { id });
    return shade;
  }

  emit(name, data) {
    this.events.push({ type: 'event', tick: this.tick, name, data });
  }

  getGroundHeight(x, z, currentY = 0) {
    if (this.night === 1) {
      if (Math.hypot(x, z) <= 40 + EPS) return 0;
      return -Infinity;
    }
    if (this.night === 2) {
      const inA = Math.hypot(x, z) <= 28 + EPS;
      const inB = Math.hypot(x - 70, z) <= 28 + EPS;
      const inBridge = x >= 26 - EPS && x <= 44 + EPS && Math.abs(z) <= 2 + EPS;
      if (inA || inB || inBridge) return 0;
      return -Infinity;
    }
    if (this.night === 3) {
      const r = Math.hypot(x, z);
      if (r > 45 + EPS) return -Infinity;

      // Bell tower obstacle at center of Tier 2
      if (r <= 2.0 && currentY >= 5.5) {
        // solid cylinder
      }

      // Tier 2: disc radius 8 at Y=6
      if (r <= 8.0 + EPS) return 6;

      // Tier 1: annulus 12..24 in z > 0 at Y=3
      if (z > -EPS && r >= 12.0 - EPS && r <= 24.0 + EPS) return 3;

      // Ramps: foot at r=30 (Y=0) to top at r=24 (Y=3), width 3m (perp <= 1.5)
      // Angle 30 deg
      const rad30 = 30 * Math.PI / 180;
      const perp30 = Math.abs(x * -Math.sin(rad30) + z * Math.cos(rad30));
      const radPos30 = x * Math.cos(rad30) + z * Math.sin(rad30);
      if (perp30 <= 1.5 + EPS && radPos30 >= 24.0 - EPS && radPos30 <= 30.0 + EPS) {
        return ((30.0 - radPos30) / 6.0) * 3.0;
      }

      // Angle 150 deg
      const rad150 = 150 * Math.PI / 180;
      const perp150 = Math.abs(x * -Math.sin(rad150) + z * Math.cos(rad150));
      const radPos150 = x * Math.cos(rad150) + z * Math.sin(rad150);
      if (perp150 <= 1.5 + EPS && radPos150 >= 24.0 - EPS && radPos150 <= 30.0 + EPS) {
        return ((30.0 - radPos150) / 6.0) * 3.0;
      }

      // Tier 0
      return 0;
    }
    return 0;
  }

  isSafeAt(pos) {
    return this.lanterns.some(l => l.lit && l.fuelUnits >= this.t.low_fuel_threshold * HZ && distance(l.pos, pos) <= this.t.safe_radius + EPS);
  }

  excludeSafeZones(pos) {
    const res = [...pos];
    for (let pass = 0; pass < 5; pass++) {
      for (const l of this.lanterns) {
        if (!l.lit || l.fuelUnits < this.t.low_fuel_threshold * HZ) continue;
        const d = distance(res, l.pos);
        if (d <= this.t.safe_radius + EPS) {
          const dx = d > EPS ? (res[0] - l.pos[0]) / d : 1;
          const dz = d > EPS ? (res[2] - l.pos[2]) / d : 0;
          res[0] = l.pos[0] + dx * (this.t.safe_radius + 0.0001);
          res[2] = l.pos[2] + dz * (this.t.safe_radius + 0.0001);
        }
      }
    }
    return res;
  }

  startSafePush(lantern) {
    for (const shade of this.shades) {
      if (distance(shade.pos, lantern.pos) <= this.t.safe_radius + EPS) {
        shade.safePushTicks = 30;
        shade.safePushLantern = lantern.id;
        if (shade.state === 'drain') shade.state = 'wander';
        shade.target_lantern_id = null;
        shade.drainTicks = 0;
      }
    }
  }

  updateFuel() {
    const drains = new Map();
    for (const shade of this.shades) {
      const lamp = this.lanterns.find(l => l.id === shade.target_lantern_id);
      if (shade.state === 'drain' && lamp?.lit && lamp.fuelUnits < this.t.low_fuel_threshold * HZ && distance(shade.pos, lamp.pos) <= 2 + EPS) {
        const list = drains.get(lamp.id) ?? []; list.push(shade); drains.set(lamp.id, list);
      } else shade.drainTicks = 0;
    }
    for (const lamp of this.lanterns) {
      if (!lamp.lit) continue;
      const shades = drains.get(lamp.id) ?? [];
      lamp.fuelUnits = Math.max(0, lamp.fuelUnits - Math.round(this.t.fuel_decay_per_s) - shades.length * Math.round(this.t.drain_per_s));
      for (const shade of shades) {
        shade.drainTicks++;
        if (shade.drainTicks % HZ === 0) this.emit('fuel_drain', { lantern_id: lamp.id, shade_id: shade.id, fuel: Math.round(lamp.fuel * 10) / 10 });
      }
      if (lamp.fuelUnits <= 0) {
        lamp.lit = false; lamp.deposited = 0; lamp.ever_lit = true;
        this.emit('lantern_out', { lantern_id: lamp.id });
      }
    }
  }

  moveWanderingShade(s,speed) {
    const weak=this.lanterns.filter(l=>l.lit&&l.fuelUnits<this.t.low_fuel_threshold*HZ);
    const choices=weak.length?weak:this.lanterns.filter(l=>!l.lit);
    choices.sort((a,b)=>distance(s.pos,a.pos)-distance(s.pos,b.pos)||(a.id<b.id?-1:1));
    const target=choices[0];s.target_lantern_id=target?.id??null;
    if(!target)return;
    const d=distance(s.pos,target.pos);
    if(target.lit&&d<=2+EPS){s.state='drain';s.drainTicks=0;}
    else if(d>EPS){const amount=Math.min(d,speed/HZ);s.pos=this.excludeSafeZones([s.pos[0]+(target.pos[0]-s.pos[0])/d*amount,s.pos[1],s.pos[2]+(target.pos[2]-s.pos[2])/d*amount]);if(target.lit&&distance(s.pos,target.pos)<=2+EPS){s.state='drain';s.drainTicks=0;}}
  }

  step(patch = {}) {
    if(this.benchmark){this.tick++;this.simTick++;this.events=[];for(const shade of this.shades)this.moveWanderingShade(shade,this.config.shadeSpeed);return this.events;}
    if (this.state !== 'playing' && this.state !== 'paused') return [];

    const old = this.input;
    this.input = { ...old, ...patch };
    const edge = key => Boolean(this.input[key]) && !old[key];

    this.events = [];

    // 1. Read input: handle pause first
    if (edge('pause')) {
      this.paused = !this.paused;
      if (this.paused) {
        this.emit('paused', {});
      } else {
        this.emit('resumed', {});
      }
    }

    if (this.paused) {
      this.tick++;
      return this.events;
    }

    this.tick++;
    this.simTick++;

    if (this.simTick === 1 && (!this.isScenario || this.scenarioNight !== undefined)) {
      this.emit('night_start', { night: this.night });
    }

    const t = this.t;
    const p = this.player;

    // 2. Decrement counters
    this.timeLeft = Math.max(0, this.initialTime - this.simTick / HZ);
    // Phase 3: oil loss/drain is step 2, before movement, pickup and interaction.
    this.updateFuel();

    if (p.invulnTicks > 0) p.invulnTicks--;
    if (p.dashCdTicks > 0) p.dashCdTicks--;
    if (p.dashTicksLeft > 0) p.dashTicksLeft--;
    if (p.pulseCdTicks > 0) p.pulseCdTicks--;
    if (p.charmTicks > 0) p.charmTicks--;
    if (p.fallingWait > 0) {
      p.fallingWait--;
      if (p.fallingWait === 0) {
        // Respawn at starting point
        p.pos = [0, 0, 0];
        p.vel = [0, 0, 0];
        p.padActive = false;
        p.invulnTicks = 90;
      }
    }

    // Decrement shades timers
    for (const s of this.shades) {
      s.recoveredThisTick = false;
      if (s.stateTicksLeft > 0) s.stateTicksLeft--;
      if (s.stunnedTicks > 0) {
        s.stunnedTicks--;
        if (s.stunnedTicks === 0 && s.state === 'stunned') { s.state = 'wander'; s.recoveredThisTick = true; }
      }
      if (s.recoilTicks > 0) {
        s.recoilTicks--;
        if (s.recoilTicks === 0 && s.state === 'recoil') s.state = 'chase';
      }
    }

    // Decrement charms respawn
    for (const c of this.charms) {
      if (!c.available && c.respawnTicks > 0) {
        c.respawnTicks--;
        if (c.respawnTicks === 0) c.available = true;
      }
    }

    // Decrement dropped motes TTL
    this.motes = this.motes.filter(m => {
      if (m.kind === 'dropped') {
        m.ttlTicks--;
        return m.ttlTicks > 0;
      }
      return true;
    });

    // Wind updates (Night 3)
    if (this.windEnabled) {
      this.wind.timer++;
      const cycle = this.wind.timer % 1800; // 30s cycle
      if (cycle >= 1500) { // lasts 5s (300 ticks) from 1500 to 1800
        if (!this.wind.active) {
          this.wind.active = true;
          this.wind.dir_deg = Math.floor(this.random() * 360);
        }
      } else {
        this.wind.active = false;
      }
    }

    // 3. Move May (if not waiting for fall respawn)
    if (p.fallingWait === 0) {
      // Facing direction
      let [mx, mz] = this.input.move;
      const mlen = Math.hypot(mx, mz);
      if (mlen > 1) { mx /= mlen; mz /= mlen; }
      const yaw = this.input.cam_yaw_deg * Math.PI / 180;
      const moveDx = mx * Math.cos(yaw) + mz * Math.sin(yaw);
      const moveDz = -mx * Math.sin(yaw) + mz * Math.cos(yaw);
      if (Math.hypot(moveDx, moveDz) > EPS) {
        p.facingYaw = this.input.cam_yaw_deg;
      }

      // Dash trigger
      if (edge('dash') && p.dashTicksLeft <= 0 && p.dashCdTicks <= 0) {
        p.dashTicksLeft = 12; // 0.2s
        p.dashCdTicks = p.charmTicks > 0 ? 0 : 90; // 1.5s
        let dDx = moveDx, dDz = moveDz;
        if (Math.hypot(dDx, dDz) <= EPS) {
          dDx = Math.sin(yaw);
          dDz = Math.cos(yaw);
        }
        const dLen = Math.hypot(dDx, dDz);
        p.dashDir = dLen > EPS ? [dDx / dLen, dDz / dLen] : [0, 1];
        this.emit('dash', {});
      }

      // Determine movement velocities
      let vx = 0, vz = 0;
      const curSpeed = p.charmTicks > 0 ? 7.2 : t.player_speed;

      if (p.dashTicksLeft > 0) {
        vx = p.dashDir[0] * t.dash_speed;
        vz = p.dashDir[1] * t.dash_speed;
        // Air dash maintains height: vy = 0
        p.vel[1] = 0;
      } else if (p.padActive) {
        vx = p.padVel[0];
        vz = p.padVel[1];
      } else {
        vx = moveDx * curSpeed;
        vz = moveDz * curSpeed;
      }

      // Strong wind push
      if (this.wind.active) {
        const wrad = this.wind.dir_deg * Math.PI / 180;
        vx += 2.0 * Math.cos(wrad);
        vz += 2.0 * Math.sin(wrad);
      }

      // Jump
      if (edge('jump') && p.grounded && p.dashTicksLeft <= 0) {
        p.vel[1] = 7.0;
        p.grounded = false;
      }

      // Apply vertical gravity (unless dashing)
      if (p.dashTicksLeft <= 0) {
        p.vel[1] -= 20.0 / HZ;
      }

      p.pos[0] += vx / HZ;
      p.pos[2] += vz / HZ;
      p.pos[1] += p.vel[1] / HZ;
      p.vel[0] = vx;
      p.vel[2] = vz;

      // Ground / Height check
      const groundY = this.getGroundHeight(p.pos[0], p.pos[2], p.pos[1]);
      if (p.pos[1] <= groundY + EPS && groundY !== -Infinity) {
        p.pos[1] = groundY;
        p.vel[1] = 0;
        p.grounded = true;
        p.padActive = false;
      } else if (groundY === -Infinity || p.pos[1] > groundY + EPS) {
        p.grounded = false;
      }

      // Bell tower cylinder collision on Night 3 (Tier 2, r <= 2.0)
      if (this.night === 3 && p.pos[1] >= 5.5) {
        const tr = Math.hypot(p.pos[0], p.pos[2]);
        if (tr < 2.0 + EPS) {
          const factor = (2.0 + 0.001) / Math.max(EPS, tr);
          p.pos[0] *= factor;
          p.pos[2] *= factor;
        }
      }

      // Jump pads check
      if (this.night === 2) {
        // Pad A at (20, 0, 18)
        if (Math.hypot(p.pos[0] - 20, p.pos[2] - 18) <= 1.0 + EPS && Math.abs(p.pos[1]) <= 0.5) {
          const dx = 50 / 53.1413, dz = -18 / 53.1413;
          p.padVel = [24.0 * dx, 24.0 * dz];
          p.vel = [24.0 * dx, 14.0, 24.0 * dz];
          p.padActive = true;
          p.grounded = false;
        }
        // Pad B at (50, 0, -18)
        if (Math.hypot(p.pos[0] - 50, p.pos[2] + 18) <= 1.0 + EPS && Math.abs(p.pos[1]) <= 0.5) {
          const dx = -50 / 53.1413, dz = 18 / 53.1413;
          p.padVel = [24.0 * dx, 24.0 * dz];
          p.vel = [24.0 * dx, 14.0, 24.0 * dz];
          p.padActive = true;
          p.grounded = false;
        }
      } else if (this.night === 3) {
        // Pad at (0, 3, 13)
        if (Math.hypot(p.pos[0], p.pos[2] - 13) <= 1.0 + EPS && Math.abs(p.pos[1] - 3) <= 0.5) {
          p.padVel = [0, -8.0];
          p.vel[1] = 12.0;
          p.padActive = true;
          p.grounded = false;
        }
      }

      // Fall off island check (Y < -10)
      if (p.pos[1] < -10) {
        p.flames--;
        p.carried = 0;
        this.emit('player_hit', { by: 'fall', flames: p.flames, lost: true });
        // Phase 3: even a final-tick fall is resolved by the end-of-tick loss check.
        p.fallingWait = 60; // 60 ticks wait
      }
    }

    // 4. Pickup fireflies and charms (if not waiting for respawn)
    if (p.fallingWait === 0) {
      this.motes = this.motes.filter(m => {
        if (p.carried < p.capacity) {
          const xz = distance(p.pos, m.pos);
          const dy = Math.abs(p.pos[1] - m.pos[1]);
          const canPick = m.kind !== 'dropped' || m.ttlTicks < 480;
          if (canPick && xz <= t.pickup_radius + EPS && dy <= t.pickup_height + EPS) {
            p.carried++;
            this.emit('mote_picked', { carried: p.carried });
            return false;
          }
        }
        return true;
      });

      for (const c of this.charms) {
        if (c.available) {
          const xz = distance(p.pos, c.pos);
          const dy = Math.abs(p.pos[1] - c.pos[1]);
          if (xz <= t.pickup_radius + EPS && dy <= t.pickup_height + EPS) {
            c.available = false;
            c.respawnTicks = 2700;
            p.charmTicks = 600;
            this.emit('charm_picked', { charm_id: c.id, charm_ticks: 600 });
          }
        }
      }
    }

    // 5. Interact with lantern
    if (edge('interact') && p.carried > 0 && p.fallingWait === 0) {
      const candidates = this.lanterns.filter(l => (!l.lit || l.fuelUnits < t.fuel_max * HZ) && distance(p.pos, l.pos) <= t.interact_radius + EPS);
      candidates.sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos) || (a.id < b.id ? -1 : 1));
      const l = candidates[0];
      if (l?.lit) {
        const amount = Math.min(p.carried, Math.ceil((t.fuel_max * HZ - l.fuelUnits) / (t.fuel_per_mote * HZ)));
        if (amount > 0) {
          const wasWeak = l.fuelUnits < t.low_fuel_threshold * HZ;
          p.carried -= amount;
          l.fuelUnits = Math.min(t.fuel_max * HZ, l.fuelUnits + amount * t.fuel_per_mote * HZ);
          this.score += amount * t.score.per_deposit;
          this.emit('refuel', { lantern_id: l.id, amount, fuel: Math.round(l.fuel * 10) / 10 });
          if (wasWeak && l.fuelUnits >= t.low_fuel_threshold * HZ) this.startSafePush(l);
        }
      } else if (l) {
        const relight = l.ever_lit;
        const cost = relight ? t.relight_cost : t.lantern_cost;
        const amount = Math.min(p.carried, cost - l.deposited);
        p.carried -= amount;
        l.deposited += amount;
        this.score += amount * t.score.per_deposit;
        this.emit('deposit', { lantern_id: l.id, amount, deposited: l.deposited });
        if (l.deposited >= cost) {
          l.lit = true;
          l.ever_lit = true; l.fuelUnits = t.fuel_max * HZ;
          if (relight) l.relit_count++;
          p.successful_lights++;
          this.score += relight ? t.score.per_relight : t.score.per_lantern;
          this.emit('lantern_lit', { lantern_id: l.id, relight });
          this.startSafePush(l);
        }
      }
    }

    // 6. Update safe zones
    for (const s of this.shades) {
      if (s.safePushTicks && s.safePushTicks > 0) {
        const lamp = this.lanterns.find(l => l.id === s.safePushLantern);
        if (lamp) {
          const d = distance(s.pos, lamp.pos), remaining = Math.max(0, t.safe_radius + 0.0001 - d);
          const ux = d > EPS ? (s.pos[0] - lamp.pos[0]) / d : 1;
          const uz = d > EPS ? (s.pos[2] - lamp.pos[2]) / d : 0;
          s.pos[0] += ux * remaining / s.safePushTicks;
          s.pos[2] += uz * remaining / s.safePushTicks;
        }
        s.safePushTicks--;
        s.safePushActive = true;
      } else {
        s.safePushActive = false;
      }
      if (!s.safePushActive) s.pos = this.excludeSafeZones(s.pos);
    }

    // 7. Pulse (Tỏa Sáng)
    if (edge('pulse') && p.carried >= t.pulse_cost && p.pulseCdTicks <= 0 && p.fallingWait === 0) {
      p.carried -= t.pulse_cost;
      p.pulseCdTicks = Math.ceil(t.pulse_cooldown_s * HZ); // 180 ticks
      const pulseCenter = [p.pos[0], p.pos[1] + 0.8, p.pos[2]];
      const stunnedIds = [];

      // Pulse shades
      for (const s of this.shades) {
        const d3 = distance3D(pulseCenter, [s.pos[0], s.pos[1] + 0.8, s.pos[2]]);
        if (d3 <= t.pulse_radius + EPS) {
          const wasDraining = s.state === 'drain';
          s.state = 'stunned';
          s.drainTicks = 0;
          s.stunnedTicks = 120;
          s.pushTicks = 15;
          const xz = distance(p.pos, s.pos);
          const ux = xz > EPS ? (s.pos[0] - p.pos[0]) / xz : 1;
          const uz = xz > EPS ? (s.pos[2] - p.pos[2]) / xz : 0;
          s.pushVel = [ux * (t.pulse_push_m / 15), uz * (t.pulse_push_m / 15)];
          stunnedIds.push(s.id);
          this.score += wasDraining ? t.score.per_drain_stun : t.score.per_stun;
        }
      }

      // Pulse drifters
      for (const d of this.drifters) {
        const d3 = distance3D(pulseCenter, d.pos);
        if (d3 <= t.pulse_radius + EPS) {
          if (d.state === 'chase') {
            d.state = 'flee';
            d.fleeTicks = 240;
          } else if (d.state === 'flee' && d.stolen > 0) {
            for (let i = 0; i < d.stolen; i++) {
              this.addMote([d.pos[0] + (i * 0.2), d.pos[1], d.pos[2]], 'dropped', 480);
            }
            this.emit('drifter_drop', { drifter_id: d.id, amount: d.stolen });
            d.stolen = 0;
            d.despawnTicks = 120;
          }
        }
      }

      this.emit('pulse', { stunned_ids: stunnedIds });
    }

    // 8. Move Shades & Stray Winds (Gió Lạc)
    // Stray Winds movement
    for (const d of this.drifters) {
      if (d.despawnTicks > 0) {
        d.despawnTicks--;
        continue;
      }
      const distMay = distance3D(p.pos, d.pos);
      if (d.state === 'idle') {
        if (p.carried >= 5 && distMay <= 15.0 + EPS) {
          d.state = 'chase';
        } else {
          // Cruise slowly 2 m/s
          d.pos[0] += (2.0 / HZ);
        }
      }
      if (d.state === 'chase') {
        if (p.carried < 5 || distMay > 15.0 + EPS) {
          d.state = 'idle';
        } else {
          const dx = p.pos[0] - d.pos[0];
          const dy = p.pos[1] - d.pos[1];
          const dz = p.pos[2] - d.pos[2];
          const len = Math.hypot(dx, dy, dz);
          if (len > EPS) {
            d.pos[0] += (dx / len) * (7.0 / HZ);
            d.pos[1] += (dy / len) * (7.0 / HZ);
            d.pos[2] += (dz / len) * (7.0 / HZ);
          }
        }
      } else if (d.state === 'flee') {
        const dx = d.pos[0] - p.pos[0];
        const dz = d.pos[2] - p.pos[2];
        const len = Math.hypot(dx, dz);
        const ux = len > EPS ? dx / len : 1;
        const uz = len > EPS ? dz / len : 0;
        d.pos[0] += ux * (7.0 / HZ);
        d.pos[2] += uz * (7.0 / HZ);
        d.fleeTicks--;
      }
    }
    this.drifters = this.drifters.filter(d => {
      if (d.despawnTicks > 0) return true;
      if (d.state === 'flee') return d.fleeTicks > 0;
      return true;
    });

    // Shades movement
    const curShadeSpeed = this.config.shadeSpeed;
    for (const s of this.shades) {
      if (s.safePushActive) continue;
      if (s.pushTicks > 0) {
        s.pushTicks--;
        s.pos[0] += s.pushVel[0];
        s.pos[2] += s.pushVel[1];
        s.pos = this.excludeSafeZones(s.pos);
      }
      if (s.state === 'stunned') continue;

      if (s.state === 'recoil') {
        s.pos[0] += s.recoilDir[0] * (2.0 / 60);
        s.pos[2] += s.recoilDir[1] * (2.0 / 60);
        s.pos = this.excludeSafeZones(s.pos);
        continue;
      }

      const d = distance(s.pos, p.pos);
      let releasedDrain = false;
      if (s.state === 'drain') {
        const target = this.lanterns.find(l => l.id === s.target_lantern_id);
        if (d <= 6 + EPS) { s.state = 'chase'; s.target_lantern_id = null; s.drainTicks = 0; }
        else if (!target?.lit || target.fuelUnits >= t.low_fuel_threshold * HZ || distance(s.pos, target.pos) > 2 + EPS) {
          s.state = 'wander'; s.target_lantern_id = null; s.drainTicks = 0; releasedDrain = true;
        } else continue;
      }
      if (!releasedDrain && !s.recoveredThisTick) {
        if (d <= 12.0 + EPS) s.state = 'chase';
        else if (d > 18.0 + EPS) s.state = 'wander';
      }

      if (s.state === 'chase') {
        const amount = Math.min(d, curShadeSpeed / HZ);
        const target = [...s.pos];
        if (d > EPS) {
          target[0] += (p.pos[0] - s.pos[0]) / d * amount;
          target[2] += (p.pos[2] - s.pos[2]) / d * amount;
        }
        s.pos = this.excludeSafeZones(target);
      } else if (s.state === 'wander') {
        this.moveWanderingShade(s,curShadeSpeed);
      }
    }

    // 9. Contact: Gió Lạc steals first, then Shades inflict hits
    if (p.fallingWait === 0) {
      // Drifter steal
      for (const d of this.drifters) {
        if ((d.state === 'chase' || d.state === 'idle') && d.stolen === 0) {
          if (distance(p.pos, d.pos) <= 1.2 + EPS) {
            const stealAmount = Math.min(3, p.carried);
            p.carried -= stealAmount;
            d.stolen = stealAmount;
            d.state = 'flee';
            d.fleeTicks = 240;
            this.emit('drifter_steal', { drifter_id: d.id, amount: stealAmount, carried: p.carried });
          }
        }
      }

      // Shades hits (sorted by id ascending)
      const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      let hitThisTick = false;
      for (const s of sortedShades) {
        if (s.state === 'stunned' || s.state === 'recoil' || s.safePushActive) continue;
        const xz = distance(s.pos, p.pos);
        const dy = Math.abs(s.pos[1] - p.pos[1]);
        if (xz <= t.shade_hit_radius + EPS && dy <= t.shade_hit_height + EPS) {
          if (!this.isSafeAt(p.pos) && p.invulnTicks <= 0 && !hitThisTick && p.flames > 0) {
            hitThisTick = true;
            p.flames--;
            const dropped = Math.floor(p.carried * t.hit_drop_ratio);
            p.carried -= dropped;
            // Drop motes in ring 1.5 - 2.5 m
            for (let i = 0; i < dropped; i++) {
              const a = (i * Math.PI * 2 / Math.max(1, dropped));
              const r = 1.5 + (i % 3) * 0.4;
              this.addMote([p.pos[0] + Math.cos(a) * r, p.pos[1], p.pos[2] + Math.sin(a) * r], 'dropped', 480);
            }
            p.invulnTicks = 90; // 1.5s
            // Shade enters recoil
            s.state = 'recoil';
            s.recoilTicks = 60;
            const rx = xz > EPS ? (s.pos[0] - p.pos[0]) / xz : 1;
            const rz = xz > EPS ? (s.pos[2] - p.pos[2]) / xz : 0;
            s.recoilDir = [rx, rz];
            this.emit('player_hit', { by: 'shade', flames: p.flames, dropped, lost: false });
          }
        }
      }
    }

    // 10. Spawn according to schedule
    // Fireflies: at ticks 240, 480, ...
    if (this.randomMotes && this.tick % 240 === 0 && this.motes.length < 30) {
      const emptyPts = this.config.moteSpawnPoints.filter(pt => !this.motes.some(m => distance(m.pos, pt) < 1.0));
      if (emptyPts.length > 0) {
        const pt = emptyPts[Math.floor(this.random() * emptyPts.length)];
        this.addMote(pt, 'random');
      }
    }

    // Shades: 2 at tick 300, then 1 every interval
    if (this.randomShades) {
      const interval = this.config.shadeSpawnInterval;
      if (this.tick === 300) {
        for (let i = 0; i < 2; i++) {
          if (this.shades.length < this.config.shadeMax) {
            const valid = this.config.shadeSpawnPoints.filter(pt => distance(pt, p.pos) >= 15.0);
            if (valid.length > 0) {
              const pt = valid[Math.floor(this.random() * valid.length)];
              this.addShade(pt);
            }
          }
        }
      } else if (this.tick > 300 && (this.tick - 300) % interval === 0) {
        if (this.shades.length < this.config.shadeMax) {
          const valid = this.config.shadeSpawnPoints.filter(pt => distance(pt, p.pos) >= 15.0);
          if (valid.length > 0) {
            const pt = valid[Math.floor(this.random() * valid.length)];
            this.addShade(pt);
          }
        }
      }
    }

    // Stray Winds (Drifters): Nights 2 and 3 at tick 1200, 2400, ...
    if (this.config.hasDrifters && this.randomDrifters && this.tick % 1200 === 0 && this.drifters.length < 2) {
      const fogPts = this.config.shadeSpawnPoints;
      if (fogPts.length > 0) {
        const pt = fogPts[Math.floor(this.random() * fogPts.length)];
        this.drifters.push({
          id: `D${++this.drifterId}`,
          pos: [...pt],
          state: 'idle',
          stolen: 0,
          fleeTicks: 0,
          despawnTicks: 0
        });
      }
    }

    // 11. Win / Loss check
    if (p.flames <= 0) {
      this.finish('lost', 'no_flames');
    } else if (this.timeLeft <= EPS) {
      const enough = this.lanterns.filter(l => l.lit).length >= Math.ceil(t.win_ratio * this.lanterns.length);
      this.finish(enough ? 'won' : 'lost', enough ? 'dawn_survived' : 'dawn');
    }

    return this.events;
  }

  finish(state, reason) {
    this.state = state;
    if (state === 'won') {
      this.score += this.lanterns.filter(l => l.lit).reduce((sum, l) => sum + this.t.score.per_lantern_at_dawn + Math.floor(l.fuelUnits / HZ), 0) + this.player.flames * this.t.score.per_flame_left;
    }
    this.emit('game_over', { result: state, reason });
  }

  snapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.simTick,
      night: this.night,
      state: this.paused ? 'paused' : this.state,
      time_left_s: round(this.timeLeft),
      score: this.score,
      wind: {
        active: Boolean(this.wind.active),
        dir_deg: round(this.wind.dir_deg)
      },
      player: {
        pos: roundedPos(this.player.pos),
        vel: roundedPos(this.player.vel),
        grounded: Boolean(this.player.grounded),
        flames: this.player.flames,
        carried: this.player.carried,
        capacity: this.player.capacity,
        invuln: this.player.invulnTicks > 0,
        dash_cd_s: round(this.player.dashCdTicks / HZ),
        pulse_cd_s: round(this.player.pulseCdTicks / HZ),
        charm_s: round(this.player.charmTicks / HZ)
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: roundedPos(l.pos),
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? Math.round(l.fuel * 10) / 10 : 0,
        ever_lit: l.ever_lit,
        relit_count: l.relit_count
      })),
      shades: this.shades.map(s => ({
        id: s.id,
        pos: roundedPos(s.pos),
        state: s.state
      })),
      motes_active: this.motes.length,
      motes: this.motes.map(m => ({
        id: m.id,
        pos: roundedPos(m.pos),
        kind: m.kind,
        ttl_s: m.ttlTicks === Infinity ? null : round(m.ttlTicks / HZ)
      })),
      drifters: this.drifters.map(d => ({
        id: d.id,
        pos: roundedPos(d.pos),
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map(c => ({
        id: c.id,
        available: c.available,
        respawn_s: round(c.respawnTicks / HZ)
      }))
    };
  }

  end() {
    return {
      type: 'end',
      ticks: this.tick,
      state: this.state,
      score: this.score
    };
  }
}
