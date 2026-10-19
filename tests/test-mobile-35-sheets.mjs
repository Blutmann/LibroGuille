import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9380 + Math.floor(Math.random() * 20);
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-mobile-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=390,844',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
}

if (!tabs || tabs.length === 0) {
  edge.kill();
  process.exit(1);
}

const tab = tabs.find(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
await new Promise(r => setTimeout(r, 600));

let msgId = 10;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === id) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else resolve(d.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  return res && res.result ? res.result.value : null;
}

try {
  console.log('=== TEST: MOBILE SINGLE-SHEET NAVIGATION ===\n');

  // Switch to book scene
  await evalInPage(`
    document.getElementById('sceneTypewriter').classList.add('is-hidden');
    document.getElementById('sceneBook').classList.remove('is-hidden');
    document.getElementById('btnToggleBook').click();
  `);
  await new Promise(r => setTimeout(r, 1000));

  // Check initial mobile sheet
  const firstMobile = await evalInPage(`
    (() => {
      const num = document.querySelector('#pageRightContent .sheet-number-display');
      const ind = document.getElementById('pageIndicator');
      return {
        number: num ? num.textContent.trim() : null,
        indicator: ind ? ind.textContent.trim() : null
      };
    })()
  `);
  console.log('Mobile initial sheet:', firstMobile);
  if (firstMobile.number !== '01/35') throw new Error(`Expected 01/35 on mobile start, got ${firstMobile.number}`);

  // Advance 1 step
  await evalInPage(`document.getElementById('btnNext').click();`);
  await new Promise(r => setTimeout(r, 400));

  const secondMobile = await evalInPage(`
    (() => {
      const num = document.querySelector('#pageRightContent .sheet-number-display');
      const ind = document.getElementById('pageIndicator');
      return {
        number: num ? num.textContent.trim() : null,
        indicator: ind ? ind.textContent.trim() : null
      };
    })()
  `);
  console.log('Mobile second sheet (single step):', secondMobile);
  if (secondMobile.number !== '02/35') throw new Error(`Expected 02/35 on mobile step 2, got ${secondMobile.number}`);

  // Advance 1 more step
  await evalInPage(`document.getElementById('btnNext').click();`);
  await new Promise(r => setTimeout(r, 400));

  const thirdMobile = await evalInPage(`
    (() => {
      const num = document.querySelector('#pageRightContent .sheet-number-display');
      const ind = document.getElementById('pageIndicator');
      return {
        number: num ? num.textContent.trim() : null,
        indicator: ind ? ind.textContent.trim() : null
      };
    })()
  `);
  console.log('Mobile third sheet (single step):', thirdMobile);
  if (thirdMobile.number !== '03/35') throw new Error(`Expected 03/35 on mobile step 3, got ${thirdMobile.number}`);

  console.log('✓ NAVEGACIÓN MÓVIL PASO A PASO (1 EN 1) CONFIRMADA');
} catch (e) {
  console.error('❌ Error mobile test:', e);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
