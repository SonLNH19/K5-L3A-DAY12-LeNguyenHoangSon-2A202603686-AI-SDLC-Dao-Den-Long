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
    for (const key of ['jump', 'interact', 'pulse', 'dash']) if (key in f) boolean(f[key], key);
  }
  return value;
}
export function validateScenario(s, tuning) {
  object(s, 'scenario');
  if ('player' in s) {
    object(s.player, 'player');
    if ('pos' in s.player) position(s.player.pos, 'player.pos');
    if ('carried' in s.player) number(s.player.carried, 'carried', 0, tuning.carry_capacity, true);
    if ('flames' in s.player) number(s.player.flames, 'flames', 0, Infinity, true);
  }
  for (const key of ['random_motes', 'random_shades']) if (key in s) boolean(s[key], key);
  if ('time_left_s' in s) number(s.time_left_s, 'time_left_s', 0);
  if ('motes' in s) {
    if (!Array.isArray(s.motes)) fail('motes: phải là mảng');
    s.motes.forEach(p => position(p, 'mote'));
  }
  if ('shades' in s) {
    if (!Array.isArray(s.shades)) fail('shades: phải là mảng');
    const ids = new Set();
    for (const shade of s.shades) {
      object(shade, 'shade'); position(shade.pos, 'shade.pos');
      if ('id' in shade) {
        if (typeof shade.id !== 'string' || !shade.id || ids.has(shade.id)) fail('shade.id: phải là chuỗi không rỗng và duy nhất');
        ids.add(shade.id);
      }
    }
  }
  if ('lanterns' in s) {
    if (!Array.isArray(s.lanterns)) fail('lanterns: phải là mảng');
    const ids = new Set();
    for (const l of s.lanterns) {
      object(l, 'lantern');
      if (!/^L[1-5]$/.test(l.id) || ids.has(l.id)) fail('lantern.id: cần L1…L5, không trùng');
      ids.add(l.id);
      if ('pos' in l) position(l.pos, 'lantern.pos');
      if ('deposited' in l) number(l.deposited, 'deposited', 0, tuning.lantern_cost, true);
      if ('lit' in l) boolean(l.lit, 'lit');
      if (l.lit === false && l.deposited === tuning.lantern_cost) fail('Đèn đủ ánh sáng không thể lit=false');
    }
  }
  return s;
}
