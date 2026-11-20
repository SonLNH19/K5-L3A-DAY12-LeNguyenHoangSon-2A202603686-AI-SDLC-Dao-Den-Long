export class InputError extends Error {}
const fail = message => { throw new InputError(message); };
const object = (v, name) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${name}: phải là object`); };
const number = (v, name, min = -Infinity, max = Infinity, integer = false) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isSafeInteger(v))) fail(`${name}: số không hợp lệ`);
};
const position = (v, name) => {
  if (!Array.isArray(v) || v.length !== 3) fail(`${name}: cần [x,y,z]`);
  v.forEach(n => number(n, name));
};
const boolean = (v, name) => { if (typeof v !== 'boolean') fail(`${name}: phải là boolean`); };

export function validateInputs(value) {
  object(value, 'inputs');
  if (!Array.isArray(value.frames)) fail('inputs.frames: phải là mảng');
  let previous = -1;
  for (const f of value.frames) {
    object(f, 'frame'); number(f.tick, 'frame.tick', 0, Infinity, true);
    if (f.tick <= previous) fail('frame.tick phải tăng nghiêm ngặt');
    previous = f.tick;
    if ('move' in f) {
      if (!Array.isArray(f.move) || f.move.length !== 2) fail('move: cần [x,z]');
      f.move.forEach(n => number(n, 'move', -1, 1));
    }
    if ('cam_yaw_deg' in f) number(f.cam_yaw_deg, 'cam_yaw_deg');
    for (const key of ['jump', 'interact', 'pulse', 'dash', 'pause']) if (key in f) boolean(f[key], key);
  }
  return value;
}

export function validateScenario(s, tuning) {
  object(s, 'scenario');
  if ('night' in s) number(s.night, 'night', 1, 3, true);
  if ('player' in s) {
    object(s.player, 'player');
    if ('pos' in s.player) position(s.player.pos, 'player.pos');
    if ('successful_lights' in s.player) number(s.player.successful_lights, 'successful_lights', 0, Infinity, true);
    const capacity = Math.min(tuning.capacity_max, tuning.carry_capacity + 2 * (s.player.successful_lights ?? 0));
    if ('carried' in s.player) number(s.player.carried, 'carried', 0, capacity, true);
    if ('flames' in s.player) number(s.player.flames, 'flames', 0, Infinity, true);
    for (const k of ['invuln_ticks', 'dash_cd_ticks', 'pulse_cd_ticks', 'charm_ticks']) {
      if (k in s.player) number(s.player[k], `player.${k}`, 0, Infinity, true);
    }
  }
  for (const key of ['random_motes', 'random_shades', 'random_drifters', 'wind_enabled']) {
    if (key in s) boolean(s[key], key);
  }
  if ('time_left_s' in s) number(s.time_left_s, 'time_left_s', 0);
  if ('motes' in s) {
    if (!Array.isArray(s.motes)) fail('motes: phải là mảng');
    s.motes.forEach(p => position(p, 'mote'));
  }
  if ('shades' in s) {
    if (!Array.isArray(s.shades)) fail('shades: phải là mảng');
    const ids = new Set();
    const validStates = new Set(['spawning', 'wander', 'chase', 'recoil', 'stunned', 'drain']);
    for (const shade of s.shades) {
      object(shade, 'shade'); position(shade.pos, 'shade.pos');
      if ('id' in shade) {
        if (typeof shade.id !== 'string' || !shade.id || ids.has(shade.id)) fail('shade.id: phải là chuỗi không rỗng và duy nhất');
        ids.add(shade.id);
      }
      if ('state' in shade && !validStates.has(shade.state)) fail(`shade.state: không hợp lệ (${shade.state})`);
      if ('state_ticks_left' in shade) number(shade.state_ticks_left, 'shade.state_ticks_left', 0, Infinity, true);
      if ('target_lantern_id' in shade && !/^L[1-7]$/.test(shade.target_lantern_id)) fail('shade.target_lantern_id: cần L1…L7');
    }
  }
  if ('drifters' in s) {
    if (!Array.isArray(s.drifters)) fail('drifters: phải là mảng');
    const ids = new Set();
    const validStates = new Set(['idle', 'chase', 'flee']);
    for (const d of s.drifters) {
      object(d, 'drifter'); position(d.pos, 'drifter.pos');
      if ('id' in d) {
        if (typeof d.id !== 'string' || !d.id || ids.has(d.id)) fail('drifter.id: phải là chuỗi không rỗng và duy nhất');
        ids.add(d.id);
      }
      if ('state' in d && !validStates.has(d.state)) fail(`drifter.state: không hợp lệ (${d.state})`);
      if ('stolen' in d) number(d.stolen, 'drifter.stolen', 0, tuning.carry_capacity, true);
    }
  }
  if ('charms' in s) {
    if (!Array.isArray(s.charms)) fail('charms: phải là mảng');
    const ids = new Set();
    for (const c of s.charms) {
      object(c, 'charm');
      if ('id' in c) {
        if (typeof c.id !== 'string' || !c.id || ids.has(c.id)) fail('charm.id: phải là chuỗi không rỗng và duy nhất');
        ids.add(c.id);
      }
      if ('available' in c) boolean(c.available, 'charm.available');
      if ('respawn_ticks' in c) number(c.respawn_ticks, 'charm.respawn_ticks', 0, Infinity, true);
    }
  }
  if ('lanterns' in s) {
    if (!Array.isArray(s.lanterns)) fail('lanterns: phải là mảng');
    const ids = new Set();
    for (const l of s.lanterns) {
      object(l, 'lantern');
      if (!/^L[1-7]$/.test(l.id) || ids.has(l.id)) fail('lantern.id: cần L1…L7, không trùng');
      ids.add(l.id);
      if ('pos' in l) position(l.pos, 'lantern.pos');
      if ('deposited' in l) number(l.deposited, 'deposited', 0, tuning.lantern_cost, true);
      if ('lit' in l) boolean(l.lit, 'lit');
      if ('fuel' in l) number(l.fuel, 'fuel', 0, tuning.fuel_max);
      if ('ever_lit' in l) boolean(l.ever_lit, 'ever_lit');
      const cost = l.ever_lit ? tuning.relight_cost : tuning.lantern_cost;
      if (l.lit === false && l.deposited >= cost) fail('Đèn đủ ánh sáng không thể lit=false');
      if (l.lit === true && l.fuel === 0) fail('Đèn sáng phải có dầu lớn hơn 0');
      if (l.lit === false && l.fuel > 0) fail('Đèn tắt không có dầu');
      if (l.lit === true && l.ever_lit === false) fail('Đèn sáng phải ever_lit=true');
    }
  }
  return s;
}
