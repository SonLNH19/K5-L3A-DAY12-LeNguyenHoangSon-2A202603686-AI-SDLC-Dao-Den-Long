import { seededRandom } from './game.mjs';
export function benchmarkScenario(seed=42){
  const rng=seededRandom(seed),rotation=rng()*Math.PI*2;
  const spread=(count,radius)=>Array.from({length:count},(_,i)=>{const a=rotation+i*Math.PI*(3-Math.sqrt(5));const r=radius*Math.sqrt((i+.5)/count);return[Math.cos(a)*r,0,Math.sin(a)*r];});
  return {random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,player:{pos:[0,0,0]},motes:spread(100,38),shades:spread(200,38).map((pos,i)=>({id:`S${i+1}`,pos,state:'wander'})),lanterns:['L1','L2','L3'].map(id=>({id,lit:true,fuel:100}))};
}
export function frameStatistics(times){
  if(!times.length||times.some(t=>!Number.isFinite(t)||t<=0))throw new Error('Không có mẫu frame hợp lệ');
  const sorted=[...times].sort((a,b)=>a-b),k=Math.max(1,Math.ceil(times.length*.01));
  return{avg_fps:1000*times.length/times.reduce((a,b)=>a+b,0),p1_low_fps:1000/(sorted.slice(-k).reduce((a,b)=>a+b,0)/k),frame_ms_p95:sorted[Math.ceil(sorted.length*.95)-1],frames:times.length};
}
export const DEFAULT_KEYS=Object.freeze({up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',interact:'KeyE',pulse:'KeyF',pause:'Escape'});
export const ACTION_LABELS=Object.freeze({up:'Tiến',down:'Lùi',left:'Sang trái',right:'Sang phải',jump:'Nhảy',dash:'Lướt',interact:'Tương tác',pulse:'Tỏa sáng',pause:'Tạm dừng'});
export function validateBindings(bindings){
  const used=new Set();for(const action of Object.keys(DEFAULT_KEYS)){const key=bindings?.[action];if(typeof key!=='string'||!/^[A-Za-z][A-Za-z0-9]*$/.test(key)||used.has(key))return false;used.add(key);}return true;
}
export function keyLabel(code){return code.startsWith('Key')?code.slice(3):code.startsWith('Digit')?code.slice(5):({Space:'Space',ShiftLeft:'Shift trái',ShiftRight:'Shift phải',Escape:'Esc',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'}[code]??code);}
