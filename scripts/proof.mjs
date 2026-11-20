import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { platform, arch, cpus, release } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT } from './build.mjs';
import { createDemoRoute } from './demo-route.mjs';
const dir = join(ROOT, 'docs/proof/phase-1'); mkdirSync(dir,{recursive:true});
const checks=[];
function run(name,args){const out=join(dir,name+'.jsonl');const r=spawnSync(process.execPath,['src/headless.mjs','--seed','19','--night','1','--ticks','650','--out',out,...args],{cwd:ROOT,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return readFileSync(out,'utf8');}
const tests=spawnSync(process.execPath,['--test','--test-reporter=tap','tests/game.test.mjs','tests/headless.test.mjs'],{cwd:ROOT,encoding:'utf8'});
writeFileSync(join(dir,'tests.tap'),tests.stdout+tests.stderr);if(tests.status!==0)throw new Error('Test thất bại, xem tests.tap');
for(const [name,args,expected]of [
  ['pickup',['--scenario','tests/scenarios/pickup.json'],'playing'],
  ['win',['--scenario','tests/scenarios/win.json','--inputs','tests/scenarios/win.inputs.json'],'won'],
  ['lose',['--scenario','tests/scenarios/lose.json'],'lost']]){
  const raw=run(name,args),end=JSON.parse(raw.trim().split('\n').at(-1));if(end.state!==expected)throw new Error(`${name}: kết quả sai`);checks.push({name,expected,end});
}
const a=run('determinism-a',[]),b=run('determinism-b',[]);if(a!==b)throw new Error('Output không tất định');
const route=createDemoRoute(12);if(route.end.state!=='won')throw new Error('Không hoàn thành được lượt chơi mặc định');
const routePath=join(dir,'full-run.inputs.json');writeFileSync(routePath,JSON.stringify({frames:route.frames})+'\n');
writeFileSync(join(dir,'full-run.summary.json'),JSON.stringify({seed:12,end:route.end,seconds:route.end.ticks/60,snapshot:route.snapshot,note:'Default game; no scenario overrides or state edits. Inputs generated from observable positions.'},null,2)+'\n');
const full=spawnSync(process.execPath,['src/headless.mjs','--seed','12','--night','1','--ticks','18000','--inputs',routePath,'--out',join(dir,'full-run.jsonl')],{cwd:ROOT,encoding:'utf8'});
if(full.status!==0)throw new Error(full.stderr);
const replayEnd=JSON.parse(readFileSync(join(dir,'full-run.jsonl'),'utf8').trim().split('\n').at(-1));
if(JSON.stringify(replayEnd)!==JSON.stringify(route.end))throw new Error('CLI replay không khớp lượt chơi mặc định');checks.push({name:'full-default-run',expected:'won',end:replayEnd});
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'});
const report={generated_at:new Date().toISOString(),platform:platform(),arch:arch(),os_release:release(),cpu:cpus()[0]?.model,node:process.version,base_commit:git.stdout.trim(),working_tree_note:'Bằng chứng của working tree lúc chạy; cần commit code và bằng chứng cùng nhau trước tag.',checks,determinism:{identical:true,sha256:createHash('sha256').update(a).digest('hex')},limits:['Không chứng minh test ẩn của giảng viên đạt.','Nền tảng khác chỉ được xác nhận bằng job CI tương ứng hoặc chạy thật.','Ảnh và kiểm tra GUI nằm trong bộ browser test riêng.']};
writeFileSync(join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Đã lưu bằng chứng thật tại docs/proof/phase-1/');
