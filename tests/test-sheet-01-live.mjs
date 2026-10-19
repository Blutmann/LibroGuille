import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9516;
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-sheet01-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,820',
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
  console.log('=== VERIFICANDO HOJA 01/35 EN EL LIBRO DIGITAL ===\n');

  // Go to book scene and open book
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('sceneTypewriter').classList.add('is-hidden');
      document.getElementById('sceneBook').classList.remove('is-hidden');
      window.book.openBook();
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // Inspect pageRight elements on Hoja 01
  const inspection = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const pageRight = document.querySelector('#pageRight');
      const footerNum = pageRight ? pageRight.querySelector('.sheet-number-display') : null;
      const comp = pageRight ? pageRight.querySelector('.sheet-scrapbook-composition') : null;
      const date1 = pageRight ? pageRight.querySelector('.date-typewritten-1951') : null;
      const clip1 = pageRight ? pageRight.querySelector('.clipping-card-1') : null;
      const clip2 = pageRight ? pageRight.querySelector('.clipping-card-2') : null;
      const date2 = pageRight ? pageRight.querySelector('.date-handwritten-1959') : null;

      const getBox = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
          src: el.src ? el.src.split('/').slice(-2).join('/') : null
        };
      };

      return {
        footerText: footerNum ? footerNum.textContent.trim() : null,
        hasComposition: !!comp,
        date1: getBox(date1),
        clip1: getBox(clip1),
        clip2: getBox(clip2),
        date2: getBox(date2)
      };
    })()`
  });

  const res = inspection.result.value;
  console.log('Datos de la Hoja 01:', JSON.stringify(res, null, 2));

  if (res.footerText !== '01/35') {
    throw new Error(`Esperado pie '01/35', pero se encontró '${res.footerText}'`);
  }
  if (!res.hasComposition) {
    throw new Error('No se encontró la composición .sheet-scrapbook-composition');
  }
  if (!res.date1 || res.date1.width <= 0) {
    throw new Error('date1 (sept. 1.951) no se renderizó correctamente');
  }
  if (!res.clip1 || res.clip1.width <= 0) {
    throw new Error('clip1 (Biblioteca Popular Sarmiento) no se renderizó');
  }
  if (!res.clip2 || res.clip2.width <= 0) {
    throw new Error('clip2 (Certamen René Bastianini 1959) no se renderizó');
  }
  if (!res.date2 || res.date2.width <= 0) {
    throw new Error('date2 (LA NACIÓN 2/3 Dbre/59) no se renderizó');
  }

  console.log('\n✓ Todos los 4 elementos fundamentales están presentes y con dimensiones válidas.');

  // Full desk screenshot
  const fullSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('c:\\Users\\Administrador\\Downloads\\libro-para-mis-hijos\\screenshot-sheet-01-desk.png', Buffer.from(fullSnap.data, 'base64'));
  console.log('✓ Captura general guardada: screenshot-sheet-01-desk.png');

  // Closeup macro screenshot of pageRight
  const pageRectInfo = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const el = document.querySelector('#pageRight');
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()`
  });
  const pr = pageRectInfo.result.value;
  const closeupSnap = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: pr.x,
      y: pr.y,
      width: pr.width,
      height: pr.height,
      scale: 2
    }
  });
  fs.writeFileSync('c:\\Users\\Administrador\\Downloads\\libro-para-mis-hijos\\screenshot-sheet-01-closeup.png', Buffer.from(closeupSnap.data, 'base64'));
  console.log('✓ Captura macro guardada: screenshot-sheet-01-closeup.png');

} catch (err) {
  console.error('ERROR en verificación:', err);
  process.exit(1);
} finally {
  edge.kill();
}
