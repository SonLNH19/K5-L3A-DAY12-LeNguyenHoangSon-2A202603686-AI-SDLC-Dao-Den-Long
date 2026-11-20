import {existsSync} from 'node:fs';
import {chromium} from '@playwright/test';
export function browserPath(){
  const paths=process.env.PLAYWRIGHT_EXECUTABLE_PATH?[process.env.PLAYWRIGHT_EXECUTABLE_PATH]:process.platform==='win32'?['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']:process.platform==='darwin'?['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']:['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
  return paths.find(p=>existsSync(p))??(existsSync(chromium.executablePath())?chromium.executablePath():null);
}
