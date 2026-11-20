import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
export function dataDirectory(){return process.env.LANTERN_DATA_DIR??(process.platform==='win32'?join(process.env.LOCALAPPDATA??homedir(),'DaoDenLong'):process.platform==='darwin'?join(homedir(),'Library','Application Support','DaoDenLong'):join(process.env.XDG_DATA_HOME??join(homedir(),'.local','share'),'dao-den-long'));}
export function validEntry(e){return e&&/^[A-Za-z0-9_]{3,12}$/.test(e.name)&&Number.isSafeInteger(e.score)&&e.score>=0&&Number.isInteger(e.nights_won)&&e.nights_won>=0&&e.nights_won<=3&&Number.isSafeInteger(e.seed)&&typeof e.achieved_at==='string'&&/(Z|[+-]\d{2}:\d{2})$/.test(e.achieved_at)&&Number.isFinite(Date.parse(e.achieved_at));}
export function rankEntries(entries){return entries.filter(validEntry).map(e=>({name:e.name,score:e.score,nights_won:e.nights_won,achieved_at:e.achieved_at,seed:e.seed})).sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10);}
const queues=new Map();
export async function readLeaderboard(dir=dataDirectory()){
  try{const body=JSON.parse(await readFile(join(dir,'leaderboard.json'),'utf8'));if(!Array.isArray(body.entries))throw new Error('Bảng điểm trên đĩa sai định dạng');return{entries:rankEntries(body.entries)};}
  catch(e){if(e.code==='ENOENT')return{entries:[]};throw e;}
}
export function saveScore(entry,dir=dataDirectory()){
  const task=(queues.get(dir)??Promise.resolve()).catch(()=>{}).then(async()=>{
    const complete={...entry,achieved_at:new Date().toISOString()};if(!validEntry(complete))throw new Error('Tên cần 3–12 ký tự A–Z, a–z, 0–9 hoặc _; điểm/Đêm/seed phải hợp lệ');
    const current=await readLeaderboard(dir);const result={entries:rankEntries([...current.entries,complete])};await mkdir(dir,{recursive:true});
    const file=join(dir,'leaderboard.json'),temporary=file+`.${process.pid}.tmp`;await writeFile(temporary,JSON.stringify(result,null,2)+'\n');await rename(temporary,file);return result;
  });queues.set(dir,task);return task;
}
export async function exportLeaderboard(destination){const body=await readLeaderboard();await mkdir(dirname(resolve(destination)),{recursive:true});await writeFile(destination,JSON.stringify(body,null,2)+'\n');}
