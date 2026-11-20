import * as THREE from '../vendor/three.module.js';
import { Game, distance, seededRandom } from './game.mjs';

const $ = id => document.getElementById(id);
const contract = await fetch('/game.contract.json').then(r => {
  if (!r.ok) throw new Error('Không đọc được game.contract.json');
  return r.json();
});
const T = contract.tuning;

// Settings from localStorage
let settings = { volume: 80, mouseSens: 5, accessibleColors: false };
try {
  const saved = localStorage.getItem('dao_den_long_settings');
  if (saved) settings = { ...settings, ...JSON.parse(saved) };
} catch {}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: true, powerPreference: 'high-performance' });
} catch {
  $('error').hidden = false;
  $('error').textContent = 'Không khởi tạo được WebGL. Hãy bật tăng tốc đồ họa trong trình duyệt.';
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0E1430');
scene.fog = new THREE.FogExp2('#1B2350', 0.009);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 400);
scene.add(new THREE.HemisphereLight('#b6e1e3', '#1B2350', 1.8));

const moonlight = new THREE.DirectionalLight('#a5c2e2', 2.0);
moonlight.position.set(-30, 50, -25);
moonlight.castShadow = true;
moonlight.shadow.mapSize.set(1024, 1024);
Object.assign(moonlight.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, far: 140 });
scene.add(moonlight);

const ambient = new THREE.AmbientLight('#8dc4ab', 0.15);
scene.add(ambient);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const materials = {
  grass: mat('#2F5D50'),
  sand: mat('#C9B48A'),
  wood: mat('#6B4A2F'),
  darkwood: mat('#3d281a'),
  sea: mat('#12384A', { metalness: 0.25, roughness: 0.4 }),
  lampLit: mat('#FFB347', { emissive: '#FFB347', emissiveIntensity: 2.2 }),
  lampCore: mat('#FFE9B0', { emissive: '#FFE9B0', emissiveIntensity: 3 }),
  lampUnlit: mat('#5B5F6E'),
  ink: mat('#120A1A', { emissive: '#7A3CFF', emissiveIntensity: 0.3 }),
  inkStunned: mat('#3A3450', { emissive: '#3A3450', emissiveIntensity: 0.2 }),
  cloth: mat('#E8E2D0'),
  scarf: mat('#C8102E'),
  skin: mat('#e1b786'),
  hat: mat('#c2a76c'),
  drifter: mat('#8FA3B8', { transparent: true, opacity: 0.85 }),
  gold: mat('#F2C14E', { emissive: '#F2C14E', emissiveIntensity: 0.5 })
};

function mesh(geometry, material, parent = scene, position = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cylinder(top, bottom, height, segments, material, parent, pos) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material, parent, pos);
}
function sphere(radius, material, parent, pos) {
  return mesh(new THREE.SphereGeometry(radius, 10, 8), material, parent, pos);
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.15, '#FFF6C2');
  g.addColorStop(0.4, '#FFE58A88');
  g.addColorStop(1, '#FFB34700');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}
const glowMap = glowTexture();
function glow(parent, size, color = '#FFE58A') {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1);
  parent.add(s);
  return s;
}

// Procedural environment container
const worldGroup = new THREE.Group();
scene.add(worldGroup);

function buildEnvironment(night) {
  while (worldGroup.children.length > 0) {
    worldGroup.remove(worldGroup.children[0]);
  }

  // Common sea of clouds
  const sea = mesh(new THREE.PlaneGeometry(900, 900), materials.sea, worldGroup, [0, -11, 0]);
  sea.rotation.x = -Math.PI / 2;
  sea.receiveShadow = false;

  if (night === 1) {
    // Đảo Bến: Circular r=40
    cylinder(40, 38, 3, 80, materials.sand, worldGroup, [0, -1.6, 0]);
    cylinder(39.85, 40, 0.35, 80, materials.grass, worldGroup, [0, -0.18, 0]);
    cylinder(38, 9, 9, 30, materials.sand, worldGroup, [0, -7.4, 0]);
  } else if (night === 2) {
    // Đảo Cau: Island A at (0,0) r=28, Island B at (70,0) r=28
    for (const cx of [0, 70]) {
      cylinder(28, 26, 3, 60, materials.sand, worldGroup, [cx, -1.6, 0]);
      cylinder(27.85, 28, 0.35, 60, materials.grass, worldGroup, [cx, -0.18, 0]);
      cylinder(26, 8, 9, 24, materials.sand, worldGroup, [cx, -7.4, 0]);
    }
    // Bamboo bridge: x in [26, 44], z in [-2, 2]
    const bridge = mesh(new THREE.BoxGeometry(20, 0.3, 4), materials.wood, worldGroup, [35, -0.15, 0]);
    bridge.receiveShadow = true;
    // Jump pads at (20, 0, 18) and (50, 0, -18)
    for (const [px, pz] of [[20, 18], [50, -18]]) {
      const pad = mesh(new THREE.CylinderGeometry(1, 1, 0.1, 24), mat('#F2C14E', { emissive: '#F2C14E', emissiveIntensity: 0.8 }), worldGroup, [px, 0.05, pz]);
      glow(pad, 3, '#F2C14E');
    }
  } else if (night === 3) {
    // Đảo Chuông: 3 tiers
    // Tier 0: r=45 Y=0
    cylinder(45, 43, 3, 80, materials.sand, worldGroup, [0, -1.6, 0]);
    cylinder(44.85, 45, 0.35, 80, materials.grass, worldGroup, [0, -0.18, 0]);
    cylinder(43, 10, 9, 30, materials.sand, worldGroup, [0, -7.4, 0]);

    // Tier 1: Y=3 annulus 12..24 in z > 0
    const t1 = mesh(new THREE.CylinderGeometry(24, 24, 3, 40, 1, false, 0, Math.PI), materials.grass, worldGroup, [0, 1.5, 0]);
    t1.rotation.y = -Math.PI / 2;

    // Tier 2: Y=6 disc r=8
    cylinder(8, 8, 6, 32, materials.grass, worldGroup, [0, 3, 0]);

    // Bell tower: center (0,6,0), r=2, height 8 (Y: 6 to 14)
    cylinder(2, 2.2, 8, 20, materials.wood, worldGroup, [0, 10, 0]);
    mesh(new THREE.ConeGeometry(2.8, 2, 4), materials.darkwood, worldGroup, [0, 15, 0]).rotation.y = Math.PI / 4;

    // Jump pad at (0, 3, 13)
    const pad = mesh(new THREE.CylinderGeometry(1, 1, 0.1, 24), mat('#F2C14E', { emissive: '#F2C14E', emissiveIntensity: 0.8 }), worldGroup, [0, 3.05, 13]);
    glow(pad, 3, '#F2C14E');

    // Ramps at 30 deg and 150 deg
    for (const deg of [30, 150]) {
      const rad = deg * Math.PI / 180;
      const rx = 27 * Math.cos(rad);
      const rz = 27 * Math.sin(rad);
      const ramp = mesh(new THREE.BoxGeometry(6, 0.2, 3), materials.wood, worldGroup, [rx, 1.5, rz]);
      ramp.rotation.y = -rad;
      ramp.rotation.z = Math.atan2(3, 6);
    }
  }
}

// Player 3D model
function createPlayer() {
  const group = new THREE.Group();
  scene.add(group);
  const body = cylinder(0.32, 0.42, 0.85, 8, materials.cloth, group, [0, 1.05, 0]);
  const scarf = cylinder(0.35, 0.38, 0.2, 8, materials.scarf, group, [0, 1.45, 0]);
  const head = sphere(0.29, materials.skin, group, [0, 1.7, 0]);
  const hat = mesh(new THREE.ConeGeometry(0.9, 0.42, 24), materials.hat, group, [0, 2.02, 0]);
  hat.rotation.z = -0.08;
  const left = cylinder(0.12, 0.13, 0.6, 6, materials.cloth, group, [-0.2, 0.35, 0]);
  const right = cylinder(0.12, 0.13, 0.6, 6, materials.cloth, group, [0.2, 0.35, 0]);
  const handLamp = cylinder(0.16, 0.16, 0.3, 8, materials.lampLit, group, [0.7, 1.2, 0]);
  glow(handLamp, 1.8);
  const light = new THREE.PointLight('#FFB347', 5, 9, 2);
  light.position.set(0, 1.5, 0);
  group.add(light);
  return { group, left, right, body, light };
}
const character = createPlayer();

// Views maps
const lampViews = new Map();
const moteViews = new Map();
const shadeViews = new Map();
const drifterViews = new Map();
const charmViews = new Map();

function createLamp(l) {
  const group = new THREE.Group();
  group.position.set(...l.pos);
  scene.add(group);
  cylinder(1.2, 1.4, 0.25, 8, materials.sand, group, [0, 0.13, 0]);
  cylinder(0.17, 0.25, 3.4, 8, materials.wood, group, [0, 1.8, 0]);
  const frame = mesh(new THREE.BoxGeometry(1.3, 1.6, 1.3), mat('#5B5F6E'), group, [0, 3.5, 0]);
  const tears = new THREE.Group(); group.add(tears);
  for (const x of [-0.35, 0.3]) {
    const points = [[x,4.1,.66],[x+.12,3.85,.66],[x-.08,3.6,.66],[x+.12,3.3,.66],[x,3,.66]].map(p=>new THREE.Vector3(...p));
    tears.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({color:'#100e18',linewidth:2})));
  }
  const sideTear = new THREE.Line(new THREE.BufferGeometry().setFromPoints([[.66,4.1,-.3],[.66,3.8,-.1],[.66,3.5,-.35],[.66,3.1,-.15]].map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:'#100e18'}));tears.add(sideTear);
  const roof = mesh(new THREE.ConeGeometry(1.3, 0.65, 4), materials.darkwood, group, [0, 4.65, 0]);
  roof.rotation.y = Math.PI / 4;
  const light = new THREE.PointLight('#FFB347', 0, 20, 2);
  light.position.y = 3.6;
  group.add(light);
  const aura = glow(group, 8, '#FFE58A');
  aura.position.y = 3.5;
  aura.visible = false;
  const zone = mesh(new THREE.RingGeometry(T.safe_radius - 0.08, T.safe_radius, 80), new THREE.MeshBasicMaterial({ color: '#FFB347', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }), group, [0, 0.06, 0]);
  zone.rotation.x = -Math.PI / 2;
  zone.visible = false;
  const label = document.createElement('div'); label.className='lamp-label'; label.dataset.lantern=l.id;
  label.innerHTML='<span class="fuel-text"></span><div class="fuel-track"><i></i></div>';
  $('lamp-labels').append(label);
  const view = { group, frame, light, aura, zone, tears, label };
  lampViews.set(l.id, view);
  return view;
}

function createShade(s) {
  const group = new THREE.Group();
  scene.add(group);
  const body = sphere(0.8, materials.ink, group, [0, 1.2, 0]);
  body.scale.set(0.85, 1.35, 0.8);
  const outline = new THREE.Mesh(body.geometry, new THREE.MeshBasicMaterial({color:settings.accessibleColors?'#00B3FF':'#7A3CFF',wireframe:true,transparent:true,opacity:.3}));outline.position.copy(body.position);outline.scale.copy(body.scale).multiplyScalar(1.03);group.add(outline);
  const eyeMaterial = new THREE.MeshBasicMaterial({color:settings.accessibleColors?'#00B3FF':'#7A3CFF'});
  const eyes = [-.24,.24].map(x=>sphere(.095,eyeMaterial,group,[x,1.35,.59]));
  const aura = glow(group, 3.5, '#7A3CFF');
  aura.position.y = 1;
  aura.material.opacity = 0.25;
  const view = { group, body, aura, outline, eyes };
  shadeViews.set(s.id, view);
  return view;
}

function createDrifter(d) {
  const group = new THREE.Group();
  scene.add(group);
  const ribbon = mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 24), materials.drifter, group, [0, 1.2, 0]);
  const aura = glow(group, 2.8, '#8FA3B8');
  aura.position.y = 1.2;
  const view = { group, ribbon, aura };
  drifterViews.set(d.id, view);
  return view;
}

function createCharm(c) {
  const group = new THREE.Group();
  scene.add(group);
  const talisman = mesh(new THREE.BoxGeometry(0.4, 0.8, 0.05), materials.scarf, group, [0, 0.8, 0]);
  const border = mesh(new THREE.BoxGeometry(0.44, 0.84, 0.04), materials.gold, group, [0, 0.8, 0]);
  const aura = glow(group, 2.0, '#F2C14E');
  aura.position.y = 0.8;
  const view = { group, talisman, aura };
  charmViews.set(c.id, view);
  return view;
}

const pulseRing = mesh(new THREE.RingGeometry(0.94, 1, 96), new THREE.MeshBasicMaterial({ color: '#FFB347', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }), scene, [0, 0.12, 0]);
pulseRing.rotation.x = -Math.PI / 2;

const moteMat = new THREE.SpriteMaterial({ map: glowMap, color: '#FFF6C2', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

// Input & Game state
const keys = new Set();
const pendingActions = new Set();
let currentNight = 1;
let totalCampaignScore = 0;
let game = new Game(T, { seed: 12, night: currentNight });
let started = false;
let paused = true;
let overlayMode = 'intro';
let yaw = 0.25;
let accumulator = 0;
let last = performance.now();
let pulseAge = 10;
let toastUntil = 0;
let soundOn = false;
let audio;

// Web Audio synthesizer
function playSound(type) {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const now = audio.currentTime;
    const vol = (settings.volume / 100) * 0.05;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);

    if (type === 'pickup') {
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'deposit') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'lit') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      gain.gain.setValueAtTime(vol * 1.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(vol * 1.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'pulse') {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.25);
      gain.gain.setValueAtTime(vol * 1.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'dash') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
      gain.gain.setValueAtTime(vol * 1.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'jump') {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'charm') {
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gain.gain.setValueAtTime(vol * 1.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'tick') {
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(vol * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    }
  } catch {}
}

function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('show');
  toastUntil = performance.now() + 2400;
}

function events(list) {
  for (const e of list) {
    if (e.name === 'mote_picked') playSound('pickup');
    if (e.name === 'deposit') playSound('deposit');
    if (e.name === 'refuel') { toast(`Đã châm ${e.data.lantern_id}: ${e.data.fuel} dầu`); playSound('deposit'); }
    if (e.name === 'lantern_out') { toast(`⚠ ${e.data.lantern_id} đã cạn dầu. Thắp lại cần 5 đom đóm!`); playSound('hit'); }
    if (e.name === 'lantern_lit') {
      toast('Một ngọn đèn đã thức giấc. Bạn có thể trú trong ánh sáng!');
      playSound('lit');
    }
    if (e.name === 'player_hit') {
      toast(e.data.by === 'fall' ? 'Mây bị rơi khỏi đảo! -1 Ngọn Lửa.' : 'Bóng Mực tấn công! Rơi đom đóm.');
      playSound('hit');
    }
    if (e.name === 'pulse') {
      pulseAge = 0;
      pulseRing.position.set(game.player.pos[0], game.player.pos[1] + 0.12, game.player.pos[2]);
      playSound('pulse');
    }
    if (e.name === 'dash') playSound('dash');
    if (e.name === 'charm_picked') {
      toast('Nhặt được Bùa Gió! Tốc độ 7.2 m/s và Lướt không hồi chiêu trong 10s.');
      playSound('charm');
    }
    if (e.name === 'drifter_steal') {
      toast(`Gió Lạc cướp đi ${e.data.amount} đom đóm!`);
      playSound('hit');
    }
    if (e.name === 'drifter_drop') {
      toast(`Tỏa Sáng đánh rơi ${e.data.amount} đom đóm từ Gió Lạc!`);
      playSound('lit');
    }
    if (e.name === 'game_over') showEnd(e.data);
  }
}

const nightDialogues = {
  1: {
    kicker: 'ĐÊM 01 · ĐẢO BẾN',
    title: 'Mang ánh sáng về nhà.',
    dialogue: '"Mây ơi, đêm nay sương lạnh lắm. Hãy giữ chặt ngọn đèn nhỏ và đánh thức năm ngọn Đèn Lồng Lớn trên Đảo Bến trước khi bình minh lên nhé!" — Ông Đăng',
    desc: 'Đèn sáng rồi vẫn cạn dầu. Cùng Mây châm dầu, sống sót 240 giây và giữ ít nhất 3/5 đèn sáng tại bình minh.'
  },
  2: {
    kicker: 'ĐÊM 02 · ĐẢO CAU',
    title: 'Vượt cầu mây sang bờ mới.',
    dialogue: '"Đảo Cau gió thổi mạnh qua cầu tre. Con nhớ dùng bục nhảy và cẩn thận Gió Lạc bay cướp đom đóm đấy!" — Ông Đăng',
    desc: 'Hai hòn đảo nối bằng cầu tre. Giữ ít nhất 4/6 đèn sáng tới bình minh sau 270 giây, cẩn thận Gió Lạc.'
  },
  3: {
    kicker: 'ĐÊM 03 · ĐẢO CHUÔNG',
    title: 'Đỉnh tháp chuông trước bình minh.',
    dialogue: '"Đảo Chuông có tháp chuông cổ trên đỉnh tầng ba. Gió lớn sẽ ùa về từng cơn, hãy gom bùa gió và giữ những ngọn đèn cháy tới bình minh!" — Ông Đăng',
    desc: 'Hòn đảo 3 tầng hiểm trở. Sống sót 300 giây và giữ ít nhất 5/7 đèn sáng ở tick bình minh.'
  }
};

function showIntro(night) {
  currentNight = night;
  paused = true;
  overlayMode = 'intro';
  $('overlay').hidden = false;
  const d = nightDialogues[night];
  $('overlay-kicker').textContent = d.kicker;
  $('overlay-title').textContent = d.title;
  $('dialogue-text').textContent = d.dialogue;
  $('overlay-text').textContent = d.desc;
  $('overlay-guide').hidden = false;
  $('start').hidden = false;
  $('start').textContent = 'Bắt đầu chuyến đi';
  $('overlay-retry').hidden = true;
  $('overlay-next').hidden = true;
  $('night-title-header').textContent = d.kicker;
  buildEnvironment(night);
}

function showEnd(data) {
  paused = true;
  keys.clear();
  pendingActions.clear();
  overlayMode = 'end';
  $('overlay').hidden = false;
  $('overlay-guide').hidden = true;
  $('start').hidden = true;

  if (data.result === 'won') {
    totalCampaignScore += game.score;
    if (currentNight < 3) {
      $('overlay-kicker').textContent = `ĐÊM 0${currentNight} HOÀN THÀNH · ÁNH SÁNG ĐÃ TRỞ VỀ`;
      $('overlay-title').textContent = 'Hòn đảo đã bừng sáng!';
      $('dialogue-text').textContent = `"Tốt lắm Mây! Hòn đảo này đã an toàn. Nhưng phía trước còn những hòn đảo khác đang chờ con..." — Ông Đăng`;
      $('overlay-text').textContent = `Bạn sống sót tới bình minh với ${game.lanterns.filter(l=>l.lit).length}/${game.lanterns.length} đèn sáng! Điểm Đêm: ${game.score}. Tổng điểm: ${totalCampaignScore}.`;
      $('overlay-next').hidden = false;
      $('overlay-next').textContent = `Tiến vào Đêm 0${currentNight + 1} ✦`;
      $('overlay-retry').hidden = true;
    } else {
      // Sunrise screen!
      $('overlay-kicker').textContent = 'BÌNH MINH ĐÃ ĐẾN · TOÀN BỘ BA HÒN ĐẢO THỨC GIẤC';
      $('overlay-title').textContent = 'Bình Minh Trên Đảo Đèn Lồng';
      $('dialogue-text').textContent = `"Mây nhìn xem, vầng đông đã rạng rồi! Ánh sáng từ ba hòn đảo đã xua tan toàn bộ sương đen. Con đã làm được!" — Ông Đăng`;
      $('overlay-text').textContent = `Chiến dịch hoàn tất xuất sắc! Tổng điểm 3 Đêm của bạn: ${totalCampaignScore}.`;
      $('overlay-next').hidden = true;
      $('overlay-retry').hidden = false;
      $('overlay-retry').textContent = 'Chơi lại từ Đêm 1';
    }
  } else {
    $('overlay-kicker').textContent = `ĐÊM 0${currentNight} · HẸN MỘT CHUYẾN ĐI KHÁC`;
    $('overlay-title').textContent = 'Đừng để tắt hy vọng.';
    $('dialogue-text').textContent = `"Không sao đâu Mây, đêm nào rồi cũng sẽ có lúc sáng. Nghỉ ngơi một chút rồi ta thử lại nhé." — Ông Đăng`;
    $('overlay-text').textContent = (data.reason === 'dawn' ? 'Bình minh đã đến nhưng số đèn đang sáng chưa đạt 60%.' : 'Ngọn lửa cuối của Mây đã tắt.') + ` Điểm: ${game.score}.`;
    $('overlay-retry').hidden = false;
    $('overlay-retry').textContent = 'Thử lại Đêm này';
    $('overlay-next').hidden = true;
  }
}

function pauseToggle() {
  if (!started || game.state !== 'playing') return;
  if (paused) {
    paused = false;
    $('overlay').hidden = true;
  } else {
    paused = true;
    overlayMode = 'pause';
    $('overlay').hidden = false;
    $('overlay-kicker').textContent = 'CHUYẾN ĐI ĐANG TẠM DỪNG';
    $('overlay-title').textContent = 'Giữ một chút ánh sáng.';
    $('dialogue-text').textContent = '"Tạm dừng một nhịp thở, ngắm nhìn biển mây và chuẩn bị cho hành trình tiếp theo."';
    $('overlay-text').textContent = 'Trò chơi đang dừng. Phím tắt: W A S D di chuyển, Shift lướt, Space nhảy, E nạp đèn, F tỏa sáng.';
    $('overlay-guide').hidden = false;
    $('start').hidden = false;
    $('start').textContent = 'Tiếp tục chuyến đi';
    $('overlay-retry').hidden = false;
    $('overlay-retry').textContent = 'Chơi lại Đêm này';
    $('overlay-next').hidden = true;
  }
}

function startNight(night, scenario) {
  currentNight = night;
  buildEnvironment(night);
  game = new Game(T, { seed: 12 + night, scenario: scenario ?? {}, night });
  pulseAge = 10;
  accumulator = 0;
  keys.clear();
  pendingActions.clear();
  for (const map of [moteViews, shadeViews, lampViews, drifterViews, charmViews]) {
    for (const v of map.values()) { scene.remove(v.group ?? v); v.label?.remove(); }
    map.clear();
  }
  paused = false;
  started = true;
  overlayMode = 'playing';
  $('overlay').hidden = true;
  camera.position.set(game.player.pos[0] + Math.sin(yaw) * 19, 14, game.player.pos[2] + Math.cos(yaw) * 19);
  sync(performance.now() / 1000);
}

// Event Listeners
$('start').addEventListener('click', () => {
  if (overlayMode === 'intro') {
    startNight(currentNight);
  } else if (overlayMode === 'pause') {
    pauseToggle();
  }
});
$('overlay-next').addEventListener('click', () => {
  if (currentNight < 3) {
    showIntro(currentNight + 1);
  }
});
$('overlay-retry').addEventListener('click', () => {
  if (overlayMode === 'end' && currentNight === 3 && game.state === 'won') {
    totalCampaignScore = 0;
    showIntro(1);
  } else {
    startNight(currentNight);
  }
});
$('pause-btn').addEventListener('click', pauseToggle);

$('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').textContent = `Âm thanh: ${soundOn ? 'bật' : 'tắt'}`;
  if (soundOn) playSound('pickup');
});

// Settings Modal
function applySettings() {
  document.documentElement.style.setProperty('--danger',settings.accessibleColors?'#FFFFFF':'#FF5A5F');
  document.documentElement.classList.toggle('accessible-colors',settings.accessibleColors);
  $('accessible-colors').checked=Boolean(settings.accessibleColors);
  $('volume-slider').value=settings.volume;$('volume-val').textContent=`${settings.volume}%`;
  $('mouse-sens-slider').value=settings.mouseSens;$('mouse-sens-val').textContent=settings.mouseSens;
  materials.ink.emissive.set(settings.accessibleColors?'#00B3FF':'#7A3CFF');
}
applySettings();
function openSettings() {
  if(started&&!paused&&game.state==='playing')pauseToggle();
  $('settings-modal').hidden = false;
}
$('settings-btn').addEventListener('click',openSettings);
$('overlay-settings').addEventListener('click',openSettings);
$('close-settings').addEventListener('click', () => {
  settings.volume = Number($('volume-slider').value);
  settings.mouseSens = Number($('mouse-sens-slider').value);
  settings.accessibleColors = $('accessible-colors').checked;
  try { localStorage.setItem('dao_den_long_settings', JSON.stringify(settings)); } catch {}
  $('settings-modal').hidden = true;
  applySettings();
});
$('volume-slider').addEventListener('input', e => { $('volume-val').textContent = `${e.target.value}%`; });
$('mouse-sens-slider').addEventListener('input', e => { $('mouse-sens-val').textContent = e.target.value; });

// Controls & Keyboard
const relevant = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'KeyE', 'KeyF', 'KeyQ', 'KeyR', 'ShiftLeft', 'ShiftRight', 'KeyJ'
]);
addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (!e.repeat) pauseToggle();
    return;
  }
  if (relevant.has(e.code)) {
    e.preventDefault();
    if (!paused) {
      keys.add(e.code);
      if (!e.repeat && ['Space', 'KeyE', 'KeyF', 'ShiftLeft', 'ShiftRight', 'KeyJ'].includes(e.code)) {
        pendingActions.add(e.code);
      }
    }
  }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => {
  keys.clear();
  if (started && !paused && game.state === 'playing') pauseToggle();
});

let dragging = false;
$('world').addEventListener('contextmenu', e => e.preventDefault());
$('world').addEventListener('pointerdown', e => {
  if (e.button === 2) {
    dragging = true;
    $('world').setPointerCapture(e.pointerId);
  }
});
$('world').addEventListener('pointermove', e => {
  if (dragging && !paused) {
    const sens = (settings.mouseSens / 5) * 0.005;
    yaw -= e.movementX * sens;
  }
});
$('world').addEventListener('pointerup', () => dragging = false);

function input() {
  if (keys.has('KeyQ')) yaw += 0.025;
  if (keys.has('KeyR')) yaw -= 0.025;
  const action = code => keys.has(code) || pendingActions.has(code);
  const result = {
    move: [
      Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
      Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'))
    ],
    cam_yaw_deg: yaw * 180 / Math.PI,
    jump: action('Space'),
    interact: action('KeyE'),
    pulse: action('KeyF'),
    dash: action('ShiftLeft') || action('ShiftRight') || action('KeyJ'),
    pause: false
  };
  pendingActions.clear();
  return result;
}

// Minimap
function drawMap() {
  const ctx = $('map').getContext('2d'), w = 180, scale = currentNight === 3 ? 1.7 : (currentNight === 2 ? 1.1 : 1.8);
  ctx.clearRect(0, 0, w, w);
  ctx.save();
  ctx.translate(w / 2, w / 2);

  // Islands outline
  ctx.strokeStyle = '#2F5D50';
  ctx.lineWidth = 1.5;
  if (currentNight === 1) {
    ctx.beginPath(); ctx.arc(0, 0, 40 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2F5D5022'; ctx.fill();
  } else if (currentNight === 2) {
    ctx.save();
    ctx.translate(-35 * scale, 0);
    ctx.beginPath(); ctx.arc(0, 0, 28 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2F5D5022'; ctx.fill();
    ctx.beginPath(); ctx.arc(70 * scale, 0, 28 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.fill();
    ctx.fillStyle = '#6B4A2F66';
    ctx.fillRect(26 * scale, -2 * scale, 18 * scale, 4 * scale);
    ctx.restore();
  } else if (currentNight === 3) {
    ctx.beginPath(); ctx.arc(0, 0, 45 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2F5D5022'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 24 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2); ctx.stroke();
  }

  // Motes
  for (const m of game.motes) {
    ctx.fillStyle = '#FFF6C2';
    ctx.fillRect(m.pos[0] * scale - 1, m.pos[2] * scale - 1, 2, 2);
  }
  // Lanterns
  for (const l of game.lanterns) {
    const x = l.pos[0] * scale, z = l.pos[2] * scale;
    ctx.fillStyle = l.lit ? '#FFB347' : '#5B5F6E';
    ctx.beginPath();
    ctx.arc(x, z, l.lit ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (l.lit) {
      ctx.strokeStyle = '#FFB34744';
      ctx.beginPath();
      ctx.arc(x, z, T.safe_radius * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Shades
  for (const s of game.shades) {
    ctx.fillStyle = settings.accessibleColors ? '#00B3FF' : (s.state === 'stunned' ? '#3A3450' : '#7A3CFF');
    ctx.beginPath();
    ctx.arc(s.pos[0] * scale, s.pos[2] * scale, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Player
  ctx.translate(game.player.pos[0] * scale, game.player.pos[2] * scale);
  ctx.rotate(-yaw);
  ctx.fillStyle = '#F5F1E6';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 4);
  ctx.lineTo(0, 2);
  ctx.lineTo(-4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Synchronization with 3D scene & HUD
let lastCountdownSecond = -1;

function sync(time) {
  const p = game.player;
  character.group.position.set(...p.pos);
  const moving = !paused && Math.hypot(...game.input.move) > 0;
  if (moving) {
    const [x, z] = game.input.move;
    character.group.rotation.y = Math.atan2(x, z) + yaw;
  }
  character.left.rotation.x = moving ? Math.sin(time * 14) * 0.5 : 0;
  character.right.rotation.x = -character.left.rotation.x;
  character.group.visible = p.invulnTicks <= 0 || Math.floor(time * 12) % 2 === 0;

  // Ambient lighting formula from Part 3:
  const litCount = game.lanterns.filter(l => l.lit).length;
  ambient.intensity = 0.15 + 0.55 * (litCount / game.lanterns.length);

  // Lantern views
  for (const l of game.lanterns) {
    const v = lampViews.get(l.id) ?? createLamp(l);
    const low = l.lit && l.fuel < T.low_fuel_threshold;
    const blink = low ? .45+.55*(.5+.5*Math.cos(time*Math.PI*2)) : 1;
    v.frame.scale.y=l.lit?1:.8;
    v.tears.visible=!l.lit;
    v.frame.material.color.set(l.lit ? '#FFB347' : '#5B5F6E');
    v.frame.material.emissive.set(l.lit?'#FFB347':'#000000');
    v.frame.material.emissiveIntensity = l.lit ? 2.4*blink : 0.05;
    v.light.intensity = l.lit ? 20*blink : 0;
    v.aura.visible=l.lit;v.zone.visible=l.lit&&!low;
    v.aura.material.opacity = (.45+Math.sin(time*2)*.05)*blink;
    const screen = new THREE.Vector3(l.pos[0],l.pos[1]+5.3,l.pos[2]).project(camera);
    v.label.hidden = !started || screen.z>1 || Math.abs(screen.x)>1.05 || Math.abs(screen.y)>1.05;
    v.label.style.left=`${(screen.x*.5+.5)*innerWidth}px`;v.label.style.top=`${(-screen.y*.5+.5)*innerHeight}px`;
    v.label.classList.toggle('low-fuel',low);
    v.label.dataset.lit=String(l.lit);v.label.dataset.fuel=String(l.fuel);v.label.dataset.paperScale=String(v.frame.scale.y);
    v.label.querySelector('.fuel-text').textContent=l.lit?`${low?'⚠ ':''}${l.id} · ${l.fuel.toFixed(1)} dầu`:`${l.id} · TẮT · ${l.ever_lit?T.relight_cost:T.lantern_cost} ✦`;
    v.label.querySelector('.fuel-track').hidden=!l.lit;
    v.label.querySelector('i').style.width=`${l.fuel/T.fuel_max*100}%`;
    v.label.style.opacity=String(blink);
  }

  // Motes views
  const activeMotes = new Set(game.motes.map(m => m.id));
  for (const [id, v] of moteViews) {
    if (!activeMotes.has(id)) { scene.remove(v); moteViews.delete(id); }
  }
  for (const [i, m] of game.motes.entries()) {
    let v = moteViews.get(m.id);
    if (!v) {
      v = new THREE.Sprite(moteMat);
      v.scale.set(1.2, 1.2, 1);
      scene.add(v);
      moteViews.set(m.id, v);
    }
    v.position.set(m.pos[0] + Math.sin(time * 1.5 + i) * 0.12, m.pos[1] + 0.6 + Math.sin(time * 2 + i) * 0.18, m.pos[2]);
  }

  // Shades views
  const activeShades = new Set(game.shades.map(s => s.id));
  for (const [id, v] of shadeViews) {
    if (!activeShades.has(id)) { scene.remove(v.group); shadeViews.delete(id); }
  }
  for (const s of game.shades) {
    const v = shadeViews.get(s.id) ?? createShade(s);
    const inkColor=settings.accessibleColors?'#00B3FF':'#7A3CFF';
    v.outline.material.color.set(inkColor);v.eyes[0].material.color.set(inkColor);v.aura.material.color.set(inkColor);
    v.group.position.set(s.pos[0], s.pos[1] + Math.sin(time * 3 + s.pos[0]) * 0.1, s.pos[2]);
    v.group.rotation.y = Math.atan2(p.pos[0] - s.pos[0], p.pos[2] - s.pos[2]);
    v.body.material = s.state === 'stunned' ? materials.inkStunned : materials.ink;
    v.group.rotation.z = s.state === 'stunned' ? Math.sin(time * 8) * 0.15 : 0;
  }

  // Drifters views
  const activeDrifters = new Set(game.drifters.map(d => d.id));
  for (const [id, v] of drifterViews) {
    if (!activeDrifters.has(id)) { scene.remove(v.group); drifterViews.delete(id); }
  }
  for (const d of game.drifters) {
    const v = drifterViews.get(d.id) ?? createDrifter(d);
    v.group.position.set(d.pos[0], d.pos[1] + Math.sin(time * 4) * 0.15, d.pos[2]);
    v.ribbon.rotation.x = time * 2;
    v.ribbon.rotation.y = time * 3;
  }

  // Charms views
  for (const c of game.charms) {
    let v = charmViews.get(c.id);
    if (!v) v = createCharm(c);
    v.group.position.set(...c.pos);
    v.group.visible = c.available;
    v.talisman.rotation.y = time * 2;
  }

  // Phase 3: capacity grows with successful first lights and relights, capped at 20.
  $('carried').textContent = p.carried;
  $('capacity').textContent = p.capacity;
  $('mote-slots').replaceChildren(...Array.from({ length: p.capacity }, (_, i) => {
    const slot = document.createElement('div');
    slot.className = `mote-slot ${i < p.carried ? 'filled' : ''}`;
    return slot;
  }));

  // Flames
  $('health').replaceChildren(...Array.from({ length: T.flames }, (_, i) => {
    const span = document.createElement('span');
    span.textContent = '● ';
    if (i >= p.flames) span.className = 'empty';
    return span;
  }));
  $('health').setAttribute('aria-label', `${p.flames} trên ${T.flames} máu`);

  // Timer & countdown
  const seconds = Math.ceil(game.timeLeft);
  $('timer').textContent = `${seconds<=30?'⚠ ':''}${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  if (seconds <= 30) {
    $('timer').classList.add('timer-warning');
  } else {
    $('timer').classList.remove('timer-warning');
  }
  if (seconds <= 10 && seconds > 0 && seconds !== lastCountdownSecond) {
    lastCountdownSecond = seconds;
    playSound('tick');
  }

  $('score').textContent = game.score;
  $('lamp-count').textContent = litCount;
  $('lamp-total-text').textContent = `/ ${game.lanterns.length} đèn đã sáng`;

  $('lamp-progress').replaceChildren(...game.lanterns.map(l => {
    const el = document.createElement('span');
    el.className = l.lit ? 'lit' : '';
    el.textContent = l.lit ? (l.fuel<T.low_fuel_threshold?'⚠':'✦') : l.id.slice(1);
    el.classList.toggle('low-fuel',l.lit&&l.fuel<T.low_fuel_threshold);
    el.title = l.lit?`${l.id}: ${l.fuel.toFixed(1)} dầu`:`${l.id}: ${l.deposited}/${l.ever_lit?T.relight_cost:T.lantern_cost}`;
    return el;
  }));

  // Skills cooldown HUD
  const dashCdRatio = p.dashCdTicks > 0 ? (p.dashCdTicks / (T.dash_cooldown_s * 60)) : 0;
  $('dash-cd-ring').setAttribute('stroke-dasharray', `${(1 - dashCdRatio) * 100}, 100`);

  const pulseCdRatio = p.pulseCdTicks > 0 ? (p.pulseCdTicks / (T.pulse_cooldown_s * 60)) : 0;
  $('pulse-cd-ring').setAttribute('stroke-dasharray', `${(1 - pulseCdRatio) * 100}, 100`);

  // Interaction prompt & Offscreen lantern pointer
  const unlitLanterns = game.lanterns.filter(l => !l.lit || l.fuelUnits<T.fuel_max*60).sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos) || (a.id<b.id?-1:1));
  const nearest = unlitLanterns[0];
  const canInteract = nearest && distance(p.pos, nearest.pos) <= T.interact_radius;
  $('interaction').hidden = paused || !canInteract;
  $('interaction').textContent = canInteract ? (nearest.lit?`[E] Châm dầu ${nearest.id} · ${nearest.fuel.toFixed(1)}/100`:`[E] ${nearest.ever_lit?'Thắp lại':'Nạp'} ${nearest.id} · ${nearest.deposited}/${nearest.ever_lit?T.relight_cost:T.lantern_cost}`) : '';
  $('objective').textContent=`Giữ ≥ ${Math.ceil(T.win_ratio*game.lanterns.length)}/${game.lanterns.length} đèn sáng tới bình minh. Dầu <30 mất vùng an toàn.`;

  // Offscreen arrow
  if (nearest && !paused && started) {
    const screenPos = new THREE.Vector3(...nearest.pos);
    screenPos.project(camera);
    const isBehind = screenPos.z > 1;
    const isOffscreen = isBehind || screenPos.x < -0.9 || screenPos.x > 0.9 || screenPos.y < -0.9 || screenPos.y > 0.9;
    if (isOffscreen) {
      $('lantern-pointer').hidden = false;
      const angle = Math.atan2(screenPos.y, screenPos.x);
      const edgeX = Math.cos(angle) * (innerWidth / 2 - 40) + innerWidth / 2;
      const edgeY = -Math.sin(angle) * (innerHeight / 2 - 40) + innerHeight / 2;
      $('lantern-pointer').style.transform = `translate(${edgeX - 30}px, ${edgeY - 20}px)`;
    } else {
      $('lantern-pointer').hidden = true;
    }
  } else {
    $('lantern-pointer').hidden = true;
  }

  drawMap();
}

const target = new THREE.Vector3(), desired = new THREE.Vector3();
camera.position.set(20, 23, 33);
camera.lookAt(0, 0, 0);

function animate(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  if (!paused && game.state === 'playing') {
    accumulator += dt;
    while (accumulator >= 1 / 60 && !paused) {
      events(game.step(input()));
      accumulator -= 1 / 60;
    }
  } else {
    accumulator = 0;
  }

  pulseAge += dt;
  if (pulseAge < 0.65) {
    const scale = 0.1 + (pulseAge / 0.65) * T.pulse_radius;
    pulseRing.scale.set(scale, scale, 1);
    pulseRing.material.opacity = 0.75 * (1 - pulseAge / 0.65);
  } else {
    pulseRing.material.opacity = 0;
  }

  sync(now / 1000);

  if (started) {
    const p = game.player.pos;
    desired.set(p[0] + Math.sin(yaw) * 19, p[1] + 14, p[2] + Math.cos(yaw) * 19);
    camera.position.lerp(desired, 1 - Math.exp(-dt * 6));
    target.set(p[0], p[1] + 0.6, p[2]);
    camera.lookAt(target);
  } else {
    camera.position.set(32, 30, 40);
    camera.lookAt(0, 0, 0);
  }

  if (now > toastUntil) $('toast').classList.remove('show');
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
});

// QA Hook for automated browser tests
if (new URLSearchParams(location.search).has('qa')) {
  window.__qa = {
    get game() { return game; },
    loadScenario(scenario) {
      currentNight = scenario.night ?? 1;
      startNight(currentNight, scenario);
    },
    advance(count, patch = {}) {
      for (let i = 0; i < count && game.state === 'playing'; i++) {
        events(game.step(i === 0 ? patch : {}));
      }
      sync(performance.now() / 1000);
    },
    pause() {
      paused = true;
      keys.clear();
    },
    get renderer() { return renderer; },
    get settings() { return {...settings}; },
    get shadeColors() { return [...shadeViews.values()].map(v=>({outline:v.outline.material.color.getHexString(),eyes:v.eyes[0].material.color.getHexString()})); },
    get campaignScore() { return totalCampaignScore; }
  };
}

showIntro(1);
requestAnimationFrame(animate);
