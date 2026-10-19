import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9517;
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-mob-sheet01-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=412,892',
  `--user-data-dir=${tempDir}`,
  'http://localhost:3000/index.html'
]);

let tabs = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 300));
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

function send(method, params = {}) {
  let id = Math.floor(Math.random() * 100000);
  return new Promise((resolve) => {
    const curId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) { ws.removeEventListener('message', handler); resolve(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

try {
  console.log('=== VERIFICANDO HOJA 01 EN MÓVIL (412x892) ===\n');

  // Go to book scene and open book
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('sceneTypewriter').classList.add('is-hidden');
      document.getElementById('sceneBook').classList.remove('is-hidden');
      window.book.applyCoverAngle(180, false);
      window.book.isClosed = false;
      window.book.currentIndex = 2;
      window.book.renderCurrentSpread();
      window.book.notifyChange();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const inspection = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const pageRight = document.querySelector('#pageRight');
      const footerNum = pageRight ? pageRight.querySelector('.sheet-number-display') : null;
      const comp = pageRight ? pageRight.querySelector('.sheet-scrapbook-composition') : null;
      const d1 = pageRight ? pageRight.querySelector('.date-typewritten-1951') : null;
      const c1 = pageRight ? pageRight.querySelector('.clipping-card-1') : null;
      const c2 = pageRight ? pageRight.querySelector('.clipping-card-2') : null;
      const d2 = pageRight ? pageRight.querySelector('.date-handwritten-1959') : null;

      const getBox = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height) };
      };

      return {
        footerText: footerNum ? footerNum.textContent.trim() : null,
        comp: !!comp,
        d1: getBox(d1),
        c1: getBox(c1),
        c2: getBox(c2),
        d2: getBox(d2)
      };
    })()`
  });

  console.log('Mobile Sheet 01:', JSON.stringify(inspection.result.value, null, 2));

  const mobSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('c:\\Users\\Administrador\\Downloads\\libro-para-mis-hijos\\screenshot-sheet-01-mobile.png', Buffer.from(mobSnap.data, 'base64'));
  console.log('✓ Captura móvil guardada: screenshot-sheet-01-mobile.png');

} catch (err) {
  console.error('ERROR en verificación móvil:', err);
  process.exit(1);
} finally {
  edge.kill();
}
