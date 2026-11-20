import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH || (process.platform==='win32'?(existsSync(chrome)?chrome:existsSync(edge)?edge:undefined):undefined);
export default defineConfig({
  // Hosted Linux runners render WebGL through software and can need >45s for a
  // complete interaction/reload scenario. Keep every assertion, allow CI time.
  testDir:'./tests/browser',workers:1,timeout:process.env.CI?120000:45000,
  expect:{timeout:process.env.CI?15000:5000},
  reporter:'list',
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:900},navigationTimeout:process.env.CI?60000:30000,screenshot:'only-on-failure',launchOptions:{executablePath,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']}},
  webServer:{command:`"${process.execPath}" scripts/serve.mjs`,url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000}
});
