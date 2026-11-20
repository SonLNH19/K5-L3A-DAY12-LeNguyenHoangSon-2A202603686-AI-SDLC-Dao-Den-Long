const processStart=performance.timeOrigin;
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {writeFileSync,existsSync} from 'node:fs';
import {platform,release,arch} from 'node:os';
import {createServer} from 'node:net';
import {browserPath} from './browser-runtime.mjs';
import {frameStatistics} from '../src/phase4.mjs';
import {ROOT} from './build.mjs';
const args={};for(let i=2;i<process.argv.length;i+=2)args[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
let server,browser;
try{
  const seed=Number(args.seed),duration=Number(args.duration);if(!Number.isSafeInteger(seed)||!Number.isFinite(duration)||duration<=0||!args.out)throw new Error('Cần --seed <int> --duration <giây dương> --out <file>');
  const executablePath=browserPath();if(!executablePath)throw new Error('Cài Chrome hoặc chạy node scripts/setup-browser.mjs trước benchmark');
  const port=await new Promise((resolve,reject)=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});s.on('error',reject);});
  server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:ROOT,env:{...process.env,PORT:String(port),LANTERN_SKIP_BUILD:existsSync(new URL('../dist/index.html',import.meta.url))?'1':''},stdio:['ignore','pipe','pipe']});
  let errors='';server.stderr.on('data',chunk=>errors+=chunk);
  await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(data.toString().includes('http://localhost:'))resolve();});server.on('exit',code=>reject(new Error(`Server ${code}: ${errors}`)));setTimeout(()=>reject(new Error('Server startup timed out')),20000).unref();});
  browser=await chromium.launch({executablePath,headless:args.headless==='true',args:['--window-size=1280,720','--enable-unsafe-swiftshader','--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',error=>{errors+='\n'+error.message;});
  await page.goto(`http://127.0.0.1:${port}/?benchmark=1&seed=${seed}&duration=${duration}`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__benchmark?.done,{},{timeout:(duration+3)*1000+120000,polling:250});
  const data=await page.evaluate(()=>window.__benchmark);
  if(data.error)throw new Error(data.error);
  const stats=frameStatistics(data.samples);
  const result={contract_version:'1.3',...stats,load_ms:Math.max(0,data.first_frame_epoch-processStart),peak_mem_mb:null,vsync_off:false,renderer:`Three.js ${data.three_revision} / ${data.renderer}`,os:`${platform()} ${release()} ${arch()}`};
  writeFileSync(args.out,JSON.stringify(result,null,2)+'\n');
  writeFileSync(args.out.replace(/\.json$/,'')+'.scene.json',JSON.stringify({seed,duration,warmup_s:3,viewport:{width:1280,height:720},...data.scene,errors,mode:args.headless==='true'?'headless-browser':'windowed-browser'},null,2)+'\n');
  console.log(JSON.stringify(result));
}catch(error){console.error(error.message);process.exitCode=1;}
finally{await browser?.close();server?.kill();}
