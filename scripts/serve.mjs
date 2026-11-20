import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { build, ROOT } from './build.mjs';
import {readLeaderboard,saveScore,exportLeaderboard} from '../src/leaderboard.mjs';
const exportIndex=process.argv.indexOf('--export-leaderboard');
if(exportIndex>=0){if(!process.argv[exportIndex+1])throw new Error('Thiếu đường dẫn xuất bảng điểm');await exportLeaderboard(process.argv[exportIndex+1]);console.log('Đã xuất bảng xếp hạng');process.exit(0);}
if(!process.env.LANTERN_SKIP_BUILD)build();
const root = resolve(ROOT, 'dist');
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(pathname==='/api/leaderboard'){
      res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
      if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){res.writeHead(403);return res.end(JSON.stringify({error:'Origin không hợp lệ'}));}
      try{
        if(req.method==='GET')return res.end(JSON.stringify(await readLeaderboard()));
        if(req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)throw new Error('Dữ liệu quá lớn');}return res.end(JSON.stringify(await saveScore(JSON.parse(body))));}
        res.writeHead(405);return res.end(JSON.stringify({error:'Method không hỗ trợ'}));
      }catch(error){res.writeHead(400);return res.end(JSON.stringify({error:error.message}));}
    }
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); return res.end('Forbidden'); }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Đảo Đèn Lồng: http://localhost:${port}`));
