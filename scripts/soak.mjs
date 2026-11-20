import {readFileSync,writeFileSync} from 'node:fs';
import {Game,seededRandom} from '../src/game.mjs';
import {performance} from 'node:perf_hooks';
export function runSoak(tuning,{seed,nights}){
  const start=performance.now(),results=[],runs=[];let crashes=0,memStart,memEnd;
  for(let i=1;i<=nights;i++){
    const night=1+(i-1)%3,nightSeed=seed+i,rng=seededRandom(nightSeed);let game;
    try{
      game=new Game(tuning,{night,seed:nightSeed});global.gc?.();if(i===1)memStart=process.memoryUsage().rss/1048576;
      let move=[0,0];const limit=tuning[`night${night}_duration_s`]*60;
      for(let tick=0;tick<limit&&game.state==='playing';tick++){
        if(tick%30===0){const angle=rng()*Math.PI*2;move=[Math.cos(angle),Math.sin(angle)];}
        game.step({move,jump:rng()<.05,dash:rng()<.03,pulse:rng()<.02,interact:rng()<.1});
      }
      results.push(game.state);runs.push({night,seed:nightSeed,ticks:game.tick,result:game.state});
    }catch(error){crashes++;results.push('crashed');runs.push({night,seed:nightSeed,error:error.message});}
    // Release the completed world before constructing the next; same Node process throughout.
    game=null;global.gc?.();
    if(i===nights){game=new Game(tuning,{night,seed:nightSeed});global.gc?.();memEnd=process.memoryUsage().rss/1048576;game=null;}
  }
  return{nights,crashes,results,mem_start_mb:memStart,mem_end_mb:memEnd,duration_s:(performance.now()-start)/1000,runs};
}
const options={};for(let i=2;i<process.argv.length;i+=2)options[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
try{
  const seed=Number(options.seed),nights=Number(options.nights);if(!Number.isSafeInteger(seed)||!Number.isInteger(nights)||nights<1||!options.out)throw new Error('Cần --seed <int> --nights <int dương> --out <file>');
  const tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url),'utf8')).tuning;
  const report=runSoak(tuning,{seed,nights});writeFileSync(options.out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){console.error(error.message);process.exitCode=1;}
