import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9590;
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-quality-${Date.now()}`);

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
  console.log('=== VERIFICANDO CALIDAD Y NITIDEZ DE LOS RECORTES ===\n');

  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!!document.getElementById('btnToggleBook') && !!window.book`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 1. Abrir libro en Hoja 02
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

  await evalInPage(`document.getElementById('btnNext').click();`);
  for (let i = 0; i < 30; i++) {
    const ready = await evalInPage(`!window.book.isAnimating && !!document.querySelector('.wrap-trinchera')`);
    if (ready) break;
    await new Promise(r => setTimeout(r, 150));
  }

  // Captura 1: Página normal en el libro (ambos recortes con la nueva resolución 740px)
  const snapPage = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-quality-1-page.png', Buffer.from(snapPage.data, 'base64'));
  console.log('✓ Captura 1 (Página en escala normal) guardada: screenshot-quality-1-page.png');

  // 2. Abrir recorte "Trinchera del Asombro" en primer plano
  await evalInPage(`
    const wrap = document.querySelector('.wrap-trinchera');
    window.book.openForegroundClipping(wrap);
  `);
  await new Promise(r => setTimeout(r, 700));

  const fgSrc = await evalInPage(`document.getElementById('clippingFloatingImg').src`);
  const fgNatural = await evalInPage(`(() => {
    const img = document.getElementById('clippingFloatingImg');
    return { w: img.naturalWidth, h: img.naturalHeight };
  })()`);
  console.log('✓ Imagen cargada en primer plano:', fgSrc);
  console.log('  Resolución nativa en primer plano:', fgNatural);

  if (fgNatural.w < 2000) {
    throw new Error('La imagen en primer plano no es la versión master hires');
  }

  // Captura 2: Primer plano tamaño normal
  const snapFgNormal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-quality-2-foreground-normal.png', Buffer.from(snapFgNormal.data, 'base64'));
  console.log('✓ Captura 2 (Primer plano tamaño habitual) guardada: screenshot-quality-2-foreground-normal.png');

  // 3. Ampliar considerablemente (escala 2.2x con CTRL)
  await evalInPage(`(() => {
    window.book.clippingScale = 2.2;
    window.book.clippingPanX = 0;
    window.book.clippingPanY = 40;
    const card = document.getElementById('clippingFloatingCard');
    card.style.transform = 'translate3d(0px, 40px, 60px) scale(2.2)';
  })()`);
  await new Promise(r => setTimeout(r, 500));

  // Captura 3: Primer plano ampliado considerablemente
  const snapFgZoom = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-quality-3-foreground-zoom.png', Buffer.from(snapFgZoom.data, 'base64'));
  console.log('✓ Captura 3 (Primer plano ampliado a 2.2x) guardada: screenshot-quality-3-foreground-zoom.png');

  // 4. Cerrar recorte y probar recorte "Un niño dice"
  await evalInPage(`window.book.closeForegroundClipping();`);
  await new Promise(r => setTimeout(r, 600));

  await evalInPage(`
    const wrapLeft = document.querySelector('.wrap-nino-dice');
    window.book.openForegroundClipping(wrapLeft);
  `);
  await new Promise(r => setTimeout(r, 700));

  const fgLeftSrc = await evalInPage(`document.getElementById('clippingFloatingImg').src`);
  const fgLeftNatural = await evalInPage(`(() => {
    const img = document.getElementById('clippingFloatingImg');
    return { w: img.naturalWidth, h: img.naturalHeight };
  })()`);
  console.log('✓ Imagen "Un niño dice" en primer plano:', fgLeftSrc);
  console.log('  Resolución nativa:', fgLeftNatural);

  const snapNino = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-quality-4-nino-foreground.png', Buffer.from(snapNino.data, 'base64'));
  console.log('✓ Captura 4 ("Un niño dice" en primer plano) guardada: screenshot-quality-4-nino-foreground.png');

  console.log('\n=== VALIDACIÓN DE CALIDAD COMPLETADA CON ÉXITO ===');
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
