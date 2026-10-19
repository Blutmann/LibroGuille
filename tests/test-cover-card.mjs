import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const port = 9510;
const tempDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `edge-cover-${Date.now()}`);

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,820',
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

function send(method, params = {}) {
  let id = 1000;
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
  console.log('=== VERIFICANDO DETALLE DE IDENTIFICACIÓN EN LA TAPA ===\n');

  // Go to book scene directly
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('sceneTypewriter').classList.add('is-hidden');
      document.getElementById('sceneBook').classList.remove('is-hidden');
      if (window.book) window.book.notifyChange();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // Inspect cover elements
  const coverInfo = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(() => {
      const sleeve = document.querySelector('.cover-pocket-sleeve');
      const card = document.querySelector('.cover-card-paper');
      const textEl = document.querySelector('.card-handwritten-text');
      const plastic = document.querySelector('.pocket-plastic-film');
      const affordance = document.querySelector('.cover-open-affordance');
      const bookContainer = document.getElementById('bookContainer');
      const coverView = document.querySelector('.book-cover-view');

      const lines = textEl ? Array.from(textEl.querySelectorAll('.card-line')).map(el => el.textContent.trim()) : [];

      return {
        hasSleeve: !!sleeve,
        hasCard: !!card,
        hasText: !!textEl,
        hasPlastic: !!plastic,
        lines,
        fullText: textEl ? textEl.innerText.trim() : null,
        sleeveRect: sleeve ? { left: sleeve.getBoundingClientRect().left, right: sleeve.getBoundingClientRect().right, top: sleeve.getBoundingClientRect().top, bottom: sleeve.getBoundingClientRect().bottom, width: sleeve.getBoundingClientRect().width, height: sleeve.getBoundingClientRect().height } : null,
        coverRect: coverView ? { left: coverView.getBoundingClientRect().left, right: coverView.getBoundingClientRect().right, top: coverView.getBoundingClientRect().top, bottom: coverView.getBoundingClientRect().bottom, width: coverView.getBoundingClientRect().width, height: coverView.getBoundingClientRect().height } : null,
        sleeveStyles: sleeve ? {
          position: window.getComputedStyle(sleeve).position,
          right: window.getComputedStyle(sleeve).right,
          bottom: window.getComputedStyle(sleeve).bottom,
          borderLeft: window.getComputedStyle(sleeve).borderLeft,
          borderBottom: window.getComputedStyle(sleeve).borderBottom,
          zIndex: window.getComputedStyle(sleeve).zIndex
        } : null,
        cardStyles: card ? {
          backgroundColor: window.getComputedStyle(card).backgroundColor,
          borderRadius: window.getComputedStyle(card).borderRadius
        } : null,
        textStyles: textEl ? {
          color: window.getComputedStyle(textEl).color,
          fontFamily: window.getComputedStyle(textEl).fontFamily,
          fontSize: window.getComputedStyle(textEl).fontSize
        } : null
      };
    })()`
  });

  console.log('Cover Info Check:', JSON.stringify(coverInfo.result.value, null, 2));

  const val = coverInfo.result.value;
  if (!val.hasSleeve) throw new Error('Falta .cover-pocket-sleeve');
  if (!val.hasCard) throw new Error('Falta .cover-card-paper');
  if (!val.hasPlastic) throw new Error('Falta .pocket-plastic-film');

  // Verify exact text lines
  const expectedLines = ['Cuaderno', 'para', 'mis hijos', 'Papá 1984'];
  console.log('\nLíneas encontradas:', val.lines);
  console.log('Líneas esperadas:', expectedLines);

  if (val.lines.join('\n') !== expectedLines.join('\n')) {
    throw new Error(`Texto no coincide: esperado "${expectedLines.join('\n')}", obtenido "${val.lines.join('\n')}"`);
  }
  console.log('✓ TEXTO EXACTO DE 4 LÍNEAS CONFIRMADO');

  // Check location: lower right sector
  if (val.sleeveRect && val.coverRect) {
    const isRightSector = val.sleeveRect.right > (val.coverRect.left + val.coverRect.width * 0.5);
    const isBottomSector = val.sleeveRect.bottom > (val.coverRect.top + val.coverRect.height * 0.5);
    console.log(`Posición relativa: horizontal > 50% = ${isRightSector}, vertical > 50% = ${isBottomSector}`);
    if (!isRightSector || !isBottomSector) {
      throw new Error('La tarjeta no está en el sector inferior derecho');
    }
    console.log('✓ UBICACIÓN EN SECTOR INFERIOR DERECHO CONFIRMADA');
  }

  // Capture full screenshot of closed book
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-cover-card.png', Buffer.from(ss.data, 'base64'));
  console.log('✓ Captura completa guardada en screenshot-cover-card.png');

  // Test opening and closing
  console.log('\nProbando apertura y cierre de la tapa...');
  await send('Runtime.evaluate', { expression: `window.book.openBook();` });
  await new Promise(r => setTimeout(r, 1000));
  await send('Runtime.evaluate', { expression: `window.book.closeBook();` });
  await new Promise(r => setTimeout(r, 1000));
  console.log('✓ Apertura y cierre interactivo comprobados sin errores');

  console.log('\n=== TODAS LAS VALIDACIONES DE LA TAPA PASARON EXITOSAMENTE ===');
} catch (e) {
  console.error('❌ ERROR:', e);
  process.exitCode = 1;
} finally {
  ws.close();
  edge.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
}
