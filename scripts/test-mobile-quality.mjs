import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9595;
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-quality-mobile-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=412,892',
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
  console.log('=== VERIFICANDO CALIDAD EN MOBILE (412 x 892) ===\n');

  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!document.getElementById('btnToggleBook') && !!window.book`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Abrir libro en Hoja 02
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

  // En móvil el paso de página avanza hoja por hoja
  await evalInPage(`document.getElementById('btnNext').click();`);
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!window.book.isAnimating && !!document.querySelector('.wrap-trinchera, .wrap-nino-dice')`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // Abrir recorte en primer plano en móvil
  await evalInPage(`
    const wrap = document.querySelector('.wrap-nino-dice') || document.querySelector('.wrap-trinchera');
    if (wrap) window.book.openForegroundClipping(wrap);
  `);
  await new Promise(r => setTimeout(r, 700));

  const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-quality-5-mobile.png', Buffer.from(snapMobile.data, 'base64'));
  console.log('✓ Captura 5 (Mobile) guardada: screenshot-quality-5-mobile.png');

  console.log('\n=== VERIFICACIÓN MOBILE COMPLETADA CON ÉXITO ===');
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
