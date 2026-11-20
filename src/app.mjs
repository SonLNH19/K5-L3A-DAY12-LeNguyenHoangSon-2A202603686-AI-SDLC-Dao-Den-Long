import * as THREE from '../vendor/three.module.js';
import { Game, WORLD, distance, seededRandom } from './game.mjs';

const $ = id => document.getElementById(id);
const contract = await fetch('/game.contract.json').then(r => { if (!r.ok) throw new Error('Không đọc được game.contract.json'); return r.json(); });
const T = contract.tuning;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: true, powerPreference: 'high-performance' }); }
catch { $('error').hidden = false; $('error').textContent = 'Không khởi tạo được WebGL. Hãy bật tăng tốc đồ họa trong Chrome/Edge hoặc thử trình duyệt khác. Headless vẫn chạy được bằng Node.js.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a1726'); scene.fog = new THREE.FogExp2('#132734', .009);
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, .1, 350);
scene.add(new THREE.HemisphereLight('#b6e1e3', '#274441', 2));
const moonlight = new THREE.DirectionalLight('#a5c2e2', 2.2); moonlight.position.set(-30, 45, -25); moonlight.castShadow = true;
moonlight.shadow.mapSize.set(1024, 1024); Object.assign(moonlight.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 120 }); moonlight.shadow.bias = -.0005; scene.add(moonlight);
const ambient = new THREE.AmbientLight('#8dc4ab', .18); scene.add(ambient);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .88, ...extra });
const materials = { grass: mat('#284c43'), edge: mat('#183337'), rock: mat('#32494d'), stone: mat('#63817b'), wood: mat('#654d3d'), darkwood: mat('#263e38'), leaf: mat('#28534c'), leaf2: mat('#376455'), cloth: mat('#78aaa2'), pants: mat('#243f4d'), skin: mat('#e1b786'), hat: mat('#c2a76c'), lamp: mat('#ffd48c',{emissive:'#ff972c',emissiveIntensity:2}), ink: mat('#2c183e',{emissive:'#3b1752',emissiveIntensity:.4}), eye: mat('#e0a1ff',{emissive:'#b95bff',emissiveIntensity:3}) };
function mesh(geometry, material, parent = scene, position = [0,0,0]) {
  const m = new THREE.Mesh(geometry,material); m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function cylinder(top,bottom,height,segments,material,parent,pos) { return mesh(new THREE.CylinderGeometry(top,bottom,height,segments),material,parent,pos); }
function sphere(radius,material,parent,pos) { return mesh(new THREE.SphereGeometry(radius,10,8),material,parent,pos); }
function glowTexture() {
  const canvas=document.createElement('canvas'); canvas.width=64;canvas.height=64; const ctx=canvas.getContext('2d');
  const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fffff0');g.addColorStop(.12,'#fff3ac');g.addColorStop(.35,'#ffd36a88');g.addColorStop(1,'#ff9d0000');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(canvas);
}
const glowMap=glowTexture();
function glow(parent,size,color='#ffc56f') {const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(size,size,1);parent.add(s);return s;}

// Procedural island, assets and decoration. No external images, models, fonts or CDN.
cylinder(WORLD.radius,WORLD.radius-2,3,80,materials.edge,scene,[0,-1.6,0]);
cylinder(WORLD.radius-.15,WORLD.radius, .35,80,materials.grass,scene,[0,-.18,0]);
cylinder(WORLD.radius-2,9,9,30,materials.edge,scene,[0,-7.4,0]);
const sea=mesh(new THREE.PlaneGeometry(700,700),mat('#142d3c',{metalness:.25,roughness:.4}),scene,[0,-11,0]);sea.rotation.x=-Math.PI/2;sea.receiveShadow=false;
const random=seededRandom(708);
const treePositions=[];
for(let i=0;i<27;i++){
  const a=random()*Math.PI*2,r=30+random()*7,x=Math.cos(a)*r,z=Math.sin(a)*r;
  treePositions.push([x,z]); const group=new THREE.Group(); group.position.set(x,0,z);scene.add(group);
  const h=3+random()*3; cylinder(.14,.28,h,6,materials.darkwood,group,[0,h/2,0]);
  for(let j=0;j<3;j++){const cone=mesh(new THREE.ConeGeometry(1.7-j*.25,2.8,6),j%2?materials.leaf2:materials.leaf,group,[0,h-1+j*.8,0]);cone.rotation.y=random();}
}
for(let i=0;i<40;i++){
  const a=random()*Math.PI*2,r=5+random()*33;
  const rock=mesh(new THREE.DodecahedronGeometry(.3+random()*.7),materials.rock,scene,[Math.sin(a)*r,.2,Math.cos(a)*r]);rock.scale.y=.5+random();rock.rotation.set(random(),random(),random());
}
// Faint stone routes radiate from the clearing.
for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5;
  for(let j=1;j<13;j++){const r=j*1.9,side=(j%2?1:-1)*.28;const stone=cylinder(.43,.48,.07,6,materials.stone,scene,[Math.sin(a)*r+Math.cos(a)*side,.02,Math.cos(a)*r-Math.sin(a)*side]);stone.rotation.y=random()*3;}
}
const center=mesh(new THREE.TorusGeometry(3,.035,5,70),mat('#86b8a4',{emissive:'#2f5b4e',emissiveIntensity:.25}),scene,[0,.025,0]);center.rotation.x=-Math.PI/2;
for(let i=0;i<9;i++){
  const cloud=new THREE.Group();const a=i*Math.PI*2/9;cloud.position.set(Math.sin(a)*55,-7+random()*3,Math.cos(a)*55);scene.add(cloud);
  for(let j=0;j<4;j++){const m=sphere(4+random()*4,mat('#839baf',{transparent:true,opacity:.08,depthWrite:false}),cloud,[(j-1.5)*5,random()*2,0]);m.scale.y=.32;m.castShadow=false;}
}
const starGeo=new THREE.BufferGeometry();const stars=[];for(let i=0;i<300;i++){const a=random()*Math.PI*2,r=110+random()*50;stars.push(Math.cos(a)*r,25+random()*100,Math.sin(a)*r);}starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:'#c2ddd9',size:.2,transparent:true,opacity:.7})));
const moon=sphere(5, new THREE.MeshBasicMaterial({color:'#d6e3d4'}),scene,[-65,65,-110]);const moonAura=glow(moon,26,'#a8d8f3');moonAura.material.opacity=.2;

function createPlayer(){
  const group=new THREE.Group();scene.add(group);
  const body=cylinder(.32,.42,.85,8,materials.cloth,group,[0,1.05,0]);
  const head=sphere(.29,materials.skin,group,[0,1.7,0]);
  const hat=mesh(new THREE.ConeGeometry(.9,.42,24),materials.hat,group,[0,2.02,0]);hat.rotation.z=-.08;
  const rim=mesh(new THREE.TorusGeometry(.85,.025,4,24),materials.wood,group,[0,1.82,0]);rim.rotation.x=Math.PI/2;
  const left=cylinder(.12,.13,.6,6,materials.pants,group,[-.2,.35,0]);const right=cylinder(.12,.13,.6,6,materials.pants,group,[.2,.35,0]);
  const arm=cylinder(.09,.1,.65,6,materials.cloth,group,[.44,1.13,0]);arm.rotation.z=.35;
  const arm2=cylinder(.09,.1,.65,6,materials.cloth,group,[-.44,1.13,0]);arm2.rotation.z=-.25;
  cylinder(.015,.015,.45,4,materials.wood,group,[.7,1.55,0]);
  const handLamp=cylinder(.16,.16,.3,8,materials.lamp,group,[.7,1.2,0]);glow(handLamp,1.8);
  const light=new THREE.PointLight('#ffc46b',5,9,2);light.position.set(0,1.5,0);group.add(light);
  const halo=mesh(new THREE.RingGeometry(.7,.85,32),new THREE.MeshBasicMaterial({color:'#ffe0a0',transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}),group,[0,.04,0]);halo.rotation.x=-Math.PI/2;
  return {group,left,right,body,light};
}
const character=createPlayer();
const lampViews=new Map(),moteViews=new Map(),shadeViews=new Map();
function createLamp(l){
  const group=new THREE.Group();group.position.set(...l.pos);scene.add(group);
  cylinder(1.2,1.4,.25,8,materials.stone,group,[0,.13,0]); cylinder(.17,.25,3.4,8,materials.wood,group,[0,1.8,0]);
  const frame=mesh(new THREE.BoxGeometry(1.3,1.6,1.3),mat('#59706a',{emissive:'#ff9f37',emissiveIntensity:0}),group,[0,3.5,0]);
  for(const x of [-.7,.7])for(const z of [-.7,.7])cylinder(.055,.055,1.85,5,materials.wood,group,[x,3.5,z]);
  const roof=mesh(new THREE.ConeGeometry(1.3,.65,4),materials.darkwood,group,[0,4.65,0]);roof.rotation.y=Math.PI/4;
  cylinder(.1,.1,.55,6,materials.wood,group,[0,2.35,0]);
  const light=new THREE.PointLight('#ffb64d',0,20,2);light.position.y=3.6;group.add(light);
  const aura=glow(group,8);aura.position.y=3.5;aura.visible=false;
  const zone=mesh(new THREE.RingGeometry(T.safe_radius-.08,T.safe_radius,80),new THREE.MeshBasicMaterial({color:'#e6bd75',transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide}),group,[0,.06,0]);zone.rotation.x=-Math.PI/2;zone.visible=false;
  const ground=mesh(new THREE.CircleGeometry(T.safe_radius,60),new THREE.MeshBasicMaterial({color:'#e8b65a',transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide}),group,[0,.04,0]);ground.rotation.x=-Math.PI/2;ground.visible=false;
  const view={group,frame,light,aura,zone,ground};lampViews.set(l.id,view);return view;
}
function createShade(s){
  const group=new THREE.Group();scene.add(group);const body=sphere(.8,materials.ink,group,[0,1.2,0]);body.scale.set(.85,1.35,.8);
  mesh(new THREE.ConeGeometry(.68,1.4,9),materials.ink,group,[0,.65,0]).rotation.z=Math.PI;
  for(const x of [-.22,.22]){const eye=sphere(.075,materials.eye,group,[x,1.4,.58]);eye.scale.y=.6;}
  const aura=glow(group,3.5,'#a45ae8');aura.position.y=1;aura.material.opacity=.22;
  const view={group,body};shadeViews.set(s.id,view);return view;
}
const pulseRing=mesh(new THREE.RingGeometry(.94,1,96),new THREE.MeshBasicMaterial({color:'#ffdb89',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}),scene,[0,.12,0]);pulseRing.rotation.x=-Math.PI/2;
const moteMat=new THREE.SpriteMaterial({map:glowMap,color:'#ffe9a3',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const keys=new Set(),pendingActions=new Set(); let game=new Game(T,{seed:12}),started=false,paused=true,overlayMode='intro',yaw=.25,accumulator=0,last=performance.now(),pulseAge=10,toastUntil=0,soundOn=false,audio;
function beep(frequency=600,duration=.12){
  if(!soundOn)return;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.value=frequency;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(gain);gain.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{soundOn=false;}
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+2400;}
function events(list){for(const e of list){
  if(e.name==='mote_picked')beep(650+e.data.carried*35,.08);
  if(e.name==='lantern_lit'){toast('Một ngọn đèn đã thức giấc. Bạn có thể trú trong ánh sáng.');beep(880,.6);}
  if(e.name==='player_hit'){toast('Bóng Mực chạm vào Mây! Hãy tỏa sáng hoặc về đèn đã thắp.');beep(150,.3);}
  if(e.name==='pulse'){pulseAge=0;pulseRing.position.set(game.player.pos[0],.12,game.player.pos[2]);beep(400,.35);}
  if(e.name==='game_over')showEnd(e.data);
}}
function showEnd(data){
  paused=true;keys.clear();pendingActions.clear();overlayMode='end';$('overlay').hidden=false;
  $('overlay-kicker').textContent=data.result==='won'?'ĐÊM 01 · ÁNH SÁNG ĐÃ TRỞ VỀ':'ĐÊM 01 · HẸN MỘT CHUYẾN ĐI KHÁC';
  $('overlay-title').textContent=data.result==='won'?'Đảo lại sáng rồi.':'Đừng để tắt hy vọng.';
  $('overlay-text').textContent=(data.result==='won'?'Cả năm ngọn đèn đã được thắp. Mây mang hơi ấm trở lại Đảo Bến.':data.reason==='dawn'?'Bình minh đã đến trước khi đủ năm ngọn đèn được thắp.':'Ngọn lửa cuối của Mây đã tắt. Hãy dùng ánh sáng để đẩy lùi Bóng Mực và trú ở đèn đã thắp.')+` Điểm của bạn: ${game.score}.`;
  $('overlay-guide').hidden=true;$('start').textContent='Chơi lại từ đầu';$('overlay-foot').textContent='MỖI CHUYẾN ĐI LÀ MỘT CƠ HỘI THẮP SÁNG';
}
function help(){
  if(!started||game.state!=='playing')return;
  if(overlayMode==='help'&&!$('overlay').hidden){$('overlay').hidden=true;paused=false;overlayMode='playing';return;}
  paused=true;keys.clear();pendingActions.clear();overlayMode='help';$('overlay').hidden=false;$('overlay-kicker').textContent='CHUYẾN ĐI ĐANG TẠM DỪNG';$('overlay-title').textContent='Giữ một chút ánh sáng.';$('overlay-text').textContent='Gom đom đóm, đến gần một đèn chưa sáng và nhấn E. Bóng Mực không thể bước vào vòng sáng của đèn đã thắp.';$('overlay-guide').hidden=false;$('start').textContent='Tiếp tục chuyến đi';
}
function restart(scenario){
  game=new Game(T,{seed:12,scenario:scenario??{}});pulseAge=10;accumulator=0;keys.clear();pendingActions.clear();
  for(const map of [moteViews,shadeViews,lampViews]){for(const v of map.values()){scene.remove(v.group??v);}map.clear();}
  paused=false;started=true;overlayMode='playing';$('overlay').hidden=true;camera.position.set(game.player.pos[0]+Math.sin(yaw)*19,14,game.player.pos[2]+Math.cos(yaw)*19);sync(performance.now()/1000);
}
$('start').addEventListener('click',()=>{if(overlayMode==='help'){help();return;}restart();});
$('help').addEventListener('click',help);
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').textContent=`Âm thanh: ${soundOn?'bật':'tắt'}`;beep();});
const relevant=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyF','KeyQ','KeyR']);
addEventListener('keydown',e=>{
  if(e.code==='KeyH'||e.code==='Escape'){e.preventDefault();if(!e.repeat)help();return;}
  if(relevant.has(e.code)){e.preventDefault();if(!paused){keys.add(e.code);if(!e.repeat&&['Space','KeyE','KeyF'].includes(e.code))pendingActions.add(e.code);}}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();if(started&&!paused&&game.state==='playing')help();});
let dragging=false;
$('world').addEventListener('contextmenu',e=>e.preventDefault());
$('world').addEventListener('pointerdown',e=>{if(e.button===2){dragging=true;$('world').setPointerCapture(e.pointerId);}});
$('world').addEventListener('pointermove',e=>{if(dragging&&!paused)yaw-=e.movementX*.005;});
$('world').addEventListener('pointerup',()=>dragging=false);
function input(){
  if(keys.has('KeyQ'))yaw+=.025;if(keys.has('KeyR'))yaw-=.025;
  // Latch short taps until a simulation step sees them, even between two rendered frames.
  const action=code=>keys.has(code)||pendingActions.has(code);
  const result={move:[Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))],cam_yaw_deg:yaw*180/Math.PI,jump:action('Space'),interact:action('KeyE'),pulse:action('KeyF')};
  pendingActions.clear();return result;
}
function drawMap(){
  const ctx=$('map').getContext('2d'),w=180,scale=1.8;ctx.clearRect(0,0,w,w);ctx.save();ctx.translate(w/2,w/2);
  ctx.strokeStyle='#8eb6a533';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,WORLD.radius*scale,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#508a7810';ctx.fill();ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(0,0,45,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  for(const m of game.motes){ctx.fillStyle='#ffe5a680';ctx.fillRect(m.pos[0]*scale-1,m.pos[2]*scale-1,2,2);}
  for(const l of game.lanterns){const x=l.pos[0]*scale,z=l.pos[2]*scale;ctx.fillStyle=l.lit?'#ffcd79':'#627e7b';ctx.beginPath();ctx.arc(x,z,l.lit?5:4,0,Math.PI*2);ctx.fill();if(l.lit){ctx.strokeStyle='#ffcf7833';ctx.beginPath();ctx.arc(x,z,T.safe_radius*scale,0,Math.PI*2);ctx.stroke();}}
  for(const s of game.shades){ctx.fillStyle=s.state==='stunned'?'#b4a3ca':'#ba80df';ctx.beginPath();ctx.arc(s.pos[0]*scale,s.pos[2]*scale,2.8,0,Math.PI*2);ctx.fill();}
  ctx.translate(game.player.pos[0]*scale,game.player.pos[2]*scale);ctx.rotate(-yaw);ctx.fillStyle='#e5f4e9';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,4);ctx.lineTo(0,2);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();
}
function sync(time){
  const p=game.player;character.group.position.set(...p.pos);
  const moving=!paused&&Math.hypot(...game.input.move)>0;
  if(moving){const [x,z]=game.input.move;character.group.rotation.y=Math.atan2(x,z)+yaw;}
  character.left.rotation.x=moving?Math.sin(time*14)*.5:0;character.right.rotation.x=-character.left.rotation.x;
  character.group.visible=game.tick>=game.invulnerableUntil||Math.floor(time*12)%2===0;
  const litCount=game.lanterns.filter(l=>l.lit).length;
  ambient.intensity=.18+litCount*.12;
  for(const l of game.lanterns){const v=lampViews.get(l.id)??createLamp(l);v.frame.material.color.set(l.lit?'#ffcc77':'#4c6664');v.frame.material.emissiveIntensity=l.lit?2.4:.06;v.light.intensity=l.lit?20:0;v.aura.visible=v.zone.visible=v.ground.visible=l.lit;v.aura.material.opacity=.42+Math.sin(time*2)*.05;}
  const active=new Set(game.motes.map(m=>m.id));
  for(const [id,v]of moteViews)if(!active.has(id)){scene.remove(v);moteViews.delete(id);}
  for(const [i,m]of game.motes.entries()){
    let v=moteViews.get(m.id);if(!v){v=new THREE.Sprite(moteMat);v.scale.set(1.3,1.3,1);scene.add(v);moteViews.set(m.id,v);}v.position.set(m.pos[0]+Math.sin(time*1.5+i)*.15,.7+Math.sin(time*2+i)*.22,m.pos[2]);
  }
  for(const s of game.shades){const v=shadeViews.get(s.id)??createShade(s);v.group.position.set(s.pos[0],s.pos[1]+Math.sin(time*3+s.pos[0])*.1,s.pos[2]);v.group.rotation.y=Math.atan2(p.pos[0]-s.pos[0],p.pos[2]-s.pos[2]);v.group.rotation.z=s.state==='stunned'?Math.sin(time*8)*.15:0;}
  $('capacity').textContent=T.carry_capacity;$('carried').textContent=p.carried;$('carry-meter').style.width=`${p.carried/T.carry_capacity*100}%`;
  $('health').replaceChildren(...Array.from({length:T.flames},(_,i)=>{const span=document.createElement('span');span.textContent='● ';if(i>=p.flames)span.className='empty';return span;}));$('health').setAttribute('aria-label',`${p.flames} trên ${T.flames} máu`);
  const seconds=Math.ceil(game.timeLeft);$('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('score').textContent=game.score;$('lamp-count').textContent=litCount;
  $('lamp-progress').replaceChildren(...game.lanterns.map(l=>{const el=document.createElement('span');el.className=l.lit?'lit':'';el.textContent=l.lit?'✦':l.id.slice(1);el.title=`${l.id}: ${l.deposited}/${T.lantern_cost}`;return el;}));
  const nearest=[...game.lanterns].filter(l=>!l.lit).sort((a,b)=>distance(p.pos,a.pos)-distance(p.pos,b.pos))[0];
  $('objective').textContent=p.carried===T.carry_capacity?'Túi đã đầy. Mang ánh sáng về đèn.':`Gom đom đóm. Mỗi đèn cần ${T.lantern_cost} đốm sáng.`;
  const canInteract=nearest&&distance(p.pos,nearest.pos)<=T.interact_radius;
  $('interaction').hidden=paused||!canInteract;$('interaction').textContent=canInteract?(p.carried?`[E] Nạp ${nearest.id} · ${nearest.deposited}/${T.lantern_cost} đom đóm`:`${nearest.id} cần ánh sáng · Hãy nhặt đom đóm`):'';
  drawMap();
}
const target=new THREE.Vector3(),desired=new THREE.Vector3();
camera.position.set(20,23,33);camera.lookAt(0,0,0);
function animate(now){
  const dt=Math.min((now-last)/1000,.1);last=now;
  if(!paused&&game.state==='playing'){
    accumulator+=dt;while(accumulator>=1/60&&!paused){events(game.step(input()));accumulator-=1/60;}
  }else accumulator=0;
  pulseAge+=dt;if(pulseAge<.65){const scale=.1+(pulseAge/.65)*T.pulse_radius;pulseRing.scale.set(scale,scale,1);pulseRing.material.opacity=.7*(1-pulseAge/.65);}else pulseRing.material.opacity=0;
  sync(now/1000);
  if(started){const p=game.player.pos;desired.set(p[0]+Math.sin(yaw)*19,p[1]+14,p[2]+Math.cos(yaw)*19);camera.position.lerp(desired,1-Math.exp(-dt*6));target.set(p[0],p[1]+.6,p[2]);camera.lookAt(target);}
  else {camera.position.set(32,30,40);camera.lookAt(0,0,0);}
  if(now>toastUntil)$('toast').classList.remove('show');
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
// Only enabled explicitly in the browser test URL. All scenario outcomes still run real game.step().
if(new URLSearchParams(location.search).has('qa'))window.__qa={get game(){return game;},loadScenario:restart,advance(count,patch={}){for(let i=0;i<count&&game.state==='playing';i++)events(game.step(i===0?patch:{}));sync(performance.now()/1000);},pause(){paused=true;keys.clear();},get renderer(){return renderer;}};
sync(0);requestAnimationFrame(animate);
