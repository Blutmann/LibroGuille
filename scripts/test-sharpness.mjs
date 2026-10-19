import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9585;
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-test-sharpness-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,820',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch(`http://localhost:${port}/json`);
    tabs = await res.json();
    if (tabs && tabs.length > 0) break;
  } catch (_) {}
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
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return res && res.result ? res.result.value : null;
}

try {
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!document.getElementById('btnToggleBook') && !!window.book`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Transición a la escena del libro y abrirlo
  await evalInPage(`
    document.getElementById('sceneTypewriter').classList.add('is-hidden');
    document.getElementById('sceneBook').classList.remove('is-hidden');
    window.book.openBook();
  `);

  for (let i = 0; i < 30; i++) {
    const opened = await evalInPage(`!window.book.isClosed && !window.book.isAnimating`);
    if (opened) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // Pliego 2
  await evalInPage(`document.getElementById('btnNext').click();`);
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!window.book.isAnimating && !!document.querySelector('.wrap-trinchera')`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // Abrir recorte Trinchera con imagen hires
  await evalInPage(`
    const wrap = document.querySelector('.wrap-trinchera');
    window.book.openForegroundClipping(wrap);
  `);
  await new Promise(r => setTimeout(r, 650));

  // Cargar explícitamente imagen hires en floating img
  await evalInPage(`
    const img = document.getElementById('clippingFloatingImg');
    img.src = 'assets/sheet-02/clipping-trinchera-1961-hires.png';
  `);
  await new Promise(r => setTimeout(r, 600));

  // Escalar a 2.0x
  await evalInPage(`
    window.book.clippingScale = 2.0;
    const card = document.getElementById('clippingFloatingCard');
    card.style.transform = 'translate3d(0px, 0px, 60px) scale(2.0)';
  `);
  await new Promise(r => setTimeout(r, 500));

  // Tomar captura macro
  const cardRect = await evalInPage(`(() => {
    const r = document.getElementById('clippingFloatingCard').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);

  console.log('Card rect at scale 2.0:', cardRect);

  const snap = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: Math.max(0, cardRect.x),
      y: Math.max(0, cardRect.y),
      width: Math.min(1280, cardRect.width),
      height: Math.min(820, cardRect.height),
      scale: 1
    }
  });

  fs.writeFileSync('test-sharpness-scale2.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved test-sharpness-scale2.png');
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
