import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const proof='docs/proof/phase-1/browser';
const fixture=name=>JSON.parse(readFileSync(`tests/scenarios/${name}.json`,'utf8'));
test.beforeEach(async({page})=>{
  await page.goto('/?qa=1');await page.waitForFunction(()=>Boolean(window.__qa));
});
test('3D renders without JS errors; start, keyboard, jump, pause and responsive layout',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await expect(page.getByRole('heading',{name:'Mang ánh sáng về nhà.'})).toBeVisible();
  await page.screenshot({path:`${proof}/intro.png`});
  await page.getByRole('button',{name:'Bắt đầu chuyến đi'}).click();await expect(page.locator('#overlay')).toBeHidden();
  const before=await page.evaluate(()=>window.__qa.game.snapshot());
  await page.keyboard.down('KeyW');await page.waitForTimeout(700);await page.keyboard.up('KeyW');
  const after=await page.evaluate(()=>window.__qa.game.snapshot());expect(after.player.pos[2]).toBeLessThan(before.player.pos[2]-.5);
  await page.keyboard.down('Space');await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__qa.game.player.pos[1])).toBeGreaterThan(0);await page.keyboard.up('Space');
  await page.keyboard.press('KeyH');await expect(page.locator('#overlay')).toBeVisible();const tick=await page.evaluate(()=>window.__qa.game.tick);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__qa.game.tick)).toBe(tick);
  await page.getByRole('button',{name:'Tiếp tục chuyến đi'}).click();await page.waitForTimeout(200);await page.screenshot({path:`${proof}/playing.png`});
  const gl=await page.evaluate(()=>({webgl:!!window.__qa.renderer.getContext(),calls:window.__qa.renderer.info.render.calls,triangles:window.__qa.renderer.info.render.triangles,state:window.__qa.game.state}));expect(gl.webgl).toBe(true);expect(gl.triangles).toBeGreaterThan(0);
  await page.setViewportSize({width:640,height:780});await page.waitForTimeout(200);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(640);await page.screenshot({path:`${proof}/small-window.png`});
  expect(errors).toEqual([]);mkdirSync(proof,{recursive:true});writeFileSync(`${proof}/render.json`,JSON.stringify({platform:process.platform,gl,page_errors:errors,scope:'Chromium software WebGL; real macOS graphics not verified'},null,2));
});
test('real E key lights final lantern, wins and restarts cleanly',async({page})=>{
  await page.evaluate(s=>window.__qa.loadScenario(s),fixture('win'));await page.keyboard.press('KeyE');
  await expect(page.locator('#overlay-title')).toHaveText('Đảo lại sáng rồi.');expect(await page.evaluate(()=>window.__qa.game.state)).toBe('won');await expect(page.locator('#lamp-count')).toHaveText('5');
  await page.screenshot({path:`${proof}/won.png`});await page.getByRole('button',{name:'Chơi lại từ đầu'}).click();await expect(page.locator('#overlay')).toBeHidden();expect(await page.evaluate(()=>window.__qa.game.state)).toBe('playing');await expect(page.locator('#lamp-count')).toHaveText('0');
});
test('loss and replay use actual collision rules',async({page})=>{
  await page.evaluate(s=>{window.__qa.loadScenario(s);window.__qa.advance(1);},fixture('lose'));
  await expect(page.locator('#overlay-title')).toHaveText('Đừng để tắt hy vọng.');expect(await page.evaluate(()=>window.__qa.game.state)).toBe('lost');await page.screenshot({path:`${proof}/lost.png`});await page.getByRole('button',{name:'Chơi lại từ đầu'}).click();await expect(page.locator('#health')).toHaveAttribute('aria-label','3 trên 3 máu');
});
test('F key consumes carried light and stuns a nearby shade; lit islands brighten',async({page})=>{
  await page.evaluate(()=>window.__qa.loadScenario({random_motes:false,random_shades:false,motes:[],player:{carried:5},shades:[{id:'S1',pos:[4,0,0]}],lanterns:[{id:'L1',pos:[0,0,15],lit:true}]}));
  await page.keyboard.press('KeyF');await expect.poll(()=>page.evaluate(()=>window.__qa.game.player.carried)).toBe(3);expect(await page.evaluate(()=>window.__qa.game.shades[0].state)).toBe('stunned');await expect(page.locator('#lamp-count')).toHaveText('1');await page.screenshot({path:`${proof}/pulse-and-lit-lamp.png`});
});
