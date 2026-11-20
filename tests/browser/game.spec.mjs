import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const proof = 'docs/proof/phase-4/browser';
const fixture = name => JSON.parse(readFileSync(`tests/scenarios/${name}.json`, 'utf8'));

test.beforeEach(async ({ page }) => {
  await page.goto('/?qa=1');
  await page.waitForFunction(() => Boolean(window.__qa));
});

test('3D renders without JS errors; start, keyboard, jump, dash, pause and responsive layout', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await expect(page.getByRole('heading', { name: 'Mang ánh sáng về nhà.' })).toBeVisible();
  mkdirSync(proof, { recursive: true });
  await page.screenshot({ path: `${proof}/intro.png` });

  await page.getByRole('button', { name: 'Bắt đầu chuyến đi' }).click();
  await expect(page.locator('#overlay')).toBeHidden();

  const before = await page.evaluate(() => window.__qa.game.snapshot());

  // Test movement WASD
  await page.keyboard.down('KeyW');
  // Wait for real motion before releasing the key. Software WebGL can stall
  // rendered frames during shader compilation; a fixed 600ms tap can be lost.
  await expect.poll(() => page.evaluate(() => window.__qa.game.player.pos[2]), {
    timeout: process.env.CI ? 60000 : 10000,
    intervals: [100, 250, 500]
  }).toBeLessThan(before.player.pos[2] - 0.4);
  await page.keyboard.up('KeyW');
  const after = await page.evaluate(() => window.__qa.game.snapshot());
  expect(after.player.pos[2]).toBeLessThan(before.player.pos[2] - 0.4);

  // Test Dash (Shift)
  await page.keyboard.press('ShiftLeft');
  await expect.poll(()=>page.evaluate(()=>window.__qa.game.player.dashCdTicks)).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>window.__qa.game.player.dashTicksLeft)).toBe(0);

  // Test Jump
  await page.keyboard.down('Space');
  await expect.poll(()=>page.evaluate(()=>window.__qa.game.player.pos[1]),{intervals:[20,50,100],message:'Space must make the real player airborne'}).toBeGreaterThan(0);
  await page.keyboard.up('Space');

  // Test Pause (Escape)
  await page.keyboard.press('Escape');
  await expect(page.locator('#overlay')).toBeVisible();
  const tick = await page.evaluate(() => window.__qa.game.tick);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__qa.game.tick)).toBe(tick);

  await page.getByRole('button', { name: 'Tiếp tục chuyến đi' }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${proof}/playing.png` });

  const gl = await page.evaluate(() => ({
    webgl: !!window.__qa.renderer.getContext(),
    calls: window.__qa.renderer.info.render.calls,
    triangles: window.__qa.renderer.info.render.triangles,
    state: window.__qa.game.state
  }));
  expect(gl.webgl).toBe(true);
  expect(gl.triangles).toBeGreaterThan(0);

  // Responsive viewport check
  await page.setViewportSize({ width: 640, height: 780 });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(640);
  await page.screenshot({ path: `${proof}/small-window.png` });

  expect(errors).toEqual([]);
  writeFileSync(`${proof}/render.json`, JSON.stringify({ platform: process.platform, gl, page_errors: errors, scope: 'Phase 4 Chromium software WebGL renderer; macOS/Linux not verified by this local report' }, null, 2));
});

// Ticket-03 replaces early all_lit: test real E, then advance actual ticks to dawn.
test('real E lights final lantern without early win; dawn wins then next night resets capacity', async ({ page }) => {
  await page.evaluate(s => window.__qa.loadScenario({...s,time_left_s:3}), fixture('win'));
  await page.keyboard.press('KeyE');
  await expect(page.locator('#lamp-count')).toHaveText('5');
  expect(await page.evaluate(() => window.__qa.game.state)).toBe('playing');
  await expect(page.locator('#capacity')).toHaveText('12');
  await page.evaluate(()=>window.__qa.advance(180));
  await expect(page.locator('#overlay')).toBeVisible();
  expect(await page.evaluate(() => window.__qa.game.state)).toBe('won');
  await expect(page.locator('#lamp-count')).toHaveText('5');
  await page.screenshot({ path: `${proof}/won.png` });
  await page.locator('#overlay-next').click();await page.locator('#start').click();
  expect(await page.evaluate(()=>window.__qa.game.night)).toBe(2);await expect(page.locator('#capacity')).toHaveText('10');
});

test('oil labels, collapsed torn lamps, refueling and saved accessible color setting',async({page})=>{
  await page.evaluate(()=>window.__qa.loadScenario({random_motes:false,random_shades:false,motes:[],player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20},{id:'L2',pos:[3,0,0]}],shades:[{id:'S1',pos:[1,0,0],state:'drain',target_lantern_id:'L1'}]}));
  await expect(page.locator('.lamp-label[data-lantern="L1"]')).toHaveClass(/low-fuel/);
  await expect(page.locator('.lamp-label[data-lantern="L2"]')).toHaveAttribute('data-paper-scale','0.8');
  await page.screenshot({path:`${proof}/low-fuel.png`});
  await page.keyboard.press('KeyE');await expect.poll(()=>page.evaluate(()=>window.__qa.game.lanterns[0].fuel)).toBeGreaterThan(30);
  await expect(page.locator('.lamp-label[data-lantern="L1"]')).not.toHaveClass(/low-fuel/);
  await page.locator('#settings-btn').click();await page.getByLabel('Bảng màu dễ phân biệt').check();await page.locator('#close-settings').click();
  expect(await page.evaluate(()=>window.__qa.settings.accessibleColors)).toBe(true);
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--danger').trim())).toBe('#FFFFFF');
  await page.locator('#start').click();
  await expect.poll(()=>page.evaluate(()=>window.__qa.shadeColors[0]?.eyes)).toBe('00b3ff');
  expect(await page.evaluate(()=>window.__qa.shadeColors[0].outline)).toBe('00b3ff');
  await page.screenshot({path:`${proof}/accessible-colors.png`});
  await page.reload();await page.waitForFunction(()=>Boolean(window.__qa));
  await page.locator('#overlay-settings').click();await expect(page.getByLabel('Bảng màu dễ phân biệt')).toBeChecked();
});

test('loss and replay use actual collision rules', async ({ page }) => {
  await page.evaluate(s => {
    window.__qa.loadScenario(s);
    window.__qa.advance(1);
  }, fixture('lose'));
  await expect(page.locator('#overlay-title')).toHaveText('Đừng để tắt hy vọng.');
  expect(await page.evaluate(() => window.__qa.game.state)).toBe('lost');
  await page.screenshot({ path: `${proof}/lost.png` });
  await page.getByRole('button', { name: 'Thử lại Đêm này' }).click();
  await expect(page.locator('#health')).toHaveAttribute('aria-label', '3 trên 3 máu');
});

test('F key consumes 3 carried light and stuns a nearby shade', async ({ page }) => {
  await page.evaluate(() => window.__qa.loadScenario({
    random_motes: false,
    random_shades: false,
    motes: [],
    player: { carried: 5 },
    shades: [{ id: 'S1', pos: [3.5, 0, 0] }],
    lanterns: [{ id: 'L1', pos: [0, 0, 15], lit: true }]
  }));
  await page.keyboard.press('KeyF');
  await expect.poll(() => page.evaluate(() => window.__qa.game.player.carried)).toBe(2);
  expect(await page.evaluate(() => window.__qa.game.shades[0].state)).toBe('stunned');
  await expect(page.locator('#lamp-count')).toHaveText('1');
  await page.screenshot({ path: `${proof}/pulse-and-lit-lamp.png` });
});

test('Phase4 forest,18px UI,remap conflict,large text and reduced motion persist',async({page})=>{
  await page.setViewportSize({width:1280,height:720});expect(await page.evaluate(()=>window.__qa.forestCounts.trees)).toBe(70);
  await page.locator('#overlay-settings').click();await page.getByRole('button',{name:'Đổi phím Tương tác',exact:true}).click();await page.keyboard.press('KeyW');await expect(page.locator('#binding-message')).toContainText('trùng');await page.keyboard.press('KeyG');
  await page.getByLabel('Giảm chuyển động',{exact:true}).check();await page.getByLabel('Chữ lớn (×1.25)',{exact:true}).check();await page.locator('#close-settings').click();
  expect(await page.evaluate(()=>window.__qa.settings.keys.interact)).toBe('KeyG');expect(await page.evaluate(()=>window.__qa.settings.reducedMotion)).toBe(true);
  const font=await page.locator('#start').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));expect(font).toBeGreaterThanOrEqual(22.5);
  await page.screenshot({path:`${proof}/forest-large-text.png`});await page.reload();await page.waitForFunction(()=>Boolean(window.__qa));expect(await page.evaluate(()=>window.__qa.settings.keys.interact)).toBe('KeyG');
  await page.locator('#overlay-settings').click();await page.locator('#reset-keys').click();expect(await page.evaluate(()=>window.__qa.settings.keys.interact)).toBe('KeyE');await page.locator('#close-settings').click();
});
test('Phase4 loss offers score entry,server persists it and leaderboard survives reload',async({page})=>{
  await page.evaluate(s=>{window.__qa.loadScenario(s);window.__qa.advance(1);},fixture('lose'));
  await expect(page.locator('#score-form')).toBeVisible();await page.getByLabel('Tên lưu điểm',{exact:false}).fill('Demo_User');await page.locator('#save-score').click();await expect(page.locator('#score-message')).toContainText('Đã lưu');
  await page.locator('#overlay-leaderboard').click();await expect(page.locator('#leaderboard-rows')).toContainText('Demo_User');await page.screenshot({path:`${proof}/leaderboard.png`});await page.reload();await page.waitForFunction(()=>Boolean(window.__qa));await page.locator('#overlay-leaderboard').click();await expect(page.locator('#leaderboard-rows')).toContainText('Demo_User');
});
